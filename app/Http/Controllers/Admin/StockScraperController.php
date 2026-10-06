<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StockScraperController extends Controller
{
    /**
     * Display the scraping & export page.
     */
    public function index(): Response
    {
        $registeredStocks = Stock::query()
            ->orderBy('ticker')
            ->get(['id', 'ticker', 'name', 'bursa', 'is_active']);

        $defaultEndDate = Carbon::today()->format('Y-m-d');
        $defaultStartDate = Carbon::today()->subYear()->format('Y-m-d');

        return Inertia::render('admin/saham/scraper', [
            'stocks' => $registeredStocks,
            'defaultStartDate' => $defaultStartDate,
            'defaultEndDate' => $defaultEndDate,
        ]);
    }

    /**
     * Scrape historical price data from Yahoo Finance and export as formatted Excel (.xlsx).
     */
    public function export(Request $request)
    {
        $validated = $request->validate([
            'tickers' => ['required', 'array', 'min:1'],
            'tickers.*' => ['required', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'bursa' => ['nullable', 'string', 'in:all,IDX,NYSE'],
            'sector' => ['nullable', 'string'],
        ], [
            'tickers.required' => 'Pilih minimal satu kode saham.',
            'tickers.min' => 'Pilih minimal satu kode saham.',
            'start_date.required' => 'Tanggal mulai wajib diisi.',
            'end_date.required' => 'Tanggal selesai wajib diisi.',
            'end_date.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
        ]);

        $rawTickers = array_unique(array_map(function ($t) {
            return strtoupper(trim($t));
        }, $validated['tickers']));

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();

        $startTs = $startDate->timestamp;
        $endTs = $endDate->timestamp;

        // Get bursa and sector lookup from DB for known stocks
        $dbStocks = Stock::query()
            ->whereIn('ticker', $rawTickers)
            ->orWhereIn('ticker', array_map(fn($t) => $t . '.JK', $rawTickers))
            ->get()
            ->keyBy(fn($item) => strtoupper($item->ticker));

        // Master stock name dictionary from json as fallback
        $masterStocks = [];
        $jsonPath = resource_path('js/data/tickerSaham.json');
        if (file_exists($jsonPath)) {
            $jsonContent = json_decode(file_get_contents($jsonPath), true);
            if (is_array($jsonContent)) {
                foreach ($jsonContent as $item) {
                    $t = strtoupper($item['ticker']);
                    $masterStocks[$t] = $item['name'] ?? null;
                    $masterStocks[str_replace('.JK', '', $t)] = $item['name'] ?? null;
                }
            }
        }

        $scrapedData = []; // [ticker => ['category' => 'IDX'|'NYSE', 'prices' => ['YYYY-MM-DD' => price]]]
        $failedTickers = [];

        foreach ($rawTickers as $ticker) {
            $stock = $dbStocks[$ticker] ?? ($dbStocks[$ticker . '.JK'] ?? ($dbStocks[str_replace('.JK', '', $ticker)] ?? null));
            $category = $stock && $stock->bursa ? $stock->bursa : 'IDX';

            // Filter by requested bursa if specified
            if (!empty($validated['bursa']) && $validated['bursa'] !== 'all') {
                if ($category !== $validated['bursa']) {
                    continue;
                }
            }

            $yahooTicker = $ticker;
            if ($category === 'IDX' && !str_contains($yahooTicker, '.')) {
                $yahooTicker .= '.JK';
            }

            try {
                $url = "https://query1.finance.yahoo.com/v8/finance/chart/{$yahooTicker}?period1={$startTs}&period2={$endTs}&interval=1d&events=history";

                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'application/json',
                ])->timeout(15)->get($url);

                if (!$response->successful()) {
                    Log::warning("Yahoo Finance scraper error for {$ticker}: HTTP {$response->status()}");
                    $failedTickers[] = $ticker;
                    continue;
                }

                $json = $response->json();
                $result = $json['chart']['result'][0] ?? null;

                if (!$result) {
                    $failedTickers[] = $ticker;
                    continue;
                }

                $timestamps = $result['timestamp'] ?? [];
                $quotes = $result['indicators']['quote'][0]['close'] ?? [];
                $adjQuotes = $result['indicators']['adjclose'][0]['adjclose'] ?? [];

                $priceMap = [];

                for ($i = 0; $i < count($timestamps); $i++) {
                    $ts = $timestamps[$i] ?? null;
                    $val = $quotes[$i] ?? ($adjQuotes[$i] ?? null);

                    if ($ts === null || $val === null || !is_numeric($val)) {
                        continue;
                    }

                    $closePrice = round((float)$val, 2);
                    if ($closePrice <= 0) {
                        continue;
                    }

                    $dateKey = Carbon::createFromTimestamp($ts, 'Asia/Jakarta')->format('Y-m-d');
                    $priceMap[$dateKey] = $closePrice;
                }

                if (!empty($priceMap)) {
                    ksort($priceMap);
                    $scrapedData[$ticker] = [
                        'category' => $category,
                        'prices' => $priceMap,
                    ];
                } else {
                    $failedTickers[] = $ticker;
                }

                // Friendly throttle
                usleep(100000); // 100ms
            } catch (\Throwable $e) {
                Log::error("Exception scraping {$ticker}: " . $e->getMessage());
                $failedTickers[] = $ticker;
            }
        }

        if (empty($scrapedData)) {
            return redirect()->back()->withErrors([
                'tickers' => 'Gagal mengambil data dari Yahoo Finance untuk saham yang dipilih atau tidak ada riwayat harga pada rentang tanggal tersebut.',
            ]);
        }

        // Group scraped data by sheet category (IDX, NYSE)
        $sheetGroups = [];
        foreach ($scrapedData as $ticker => $item) {
            $cat = $item['category'] === 'NYSE' ? 'NYSE' : 'IDX';
            $sheetGroups[$cat][$ticker] = $item['prices'];
        }

        // Create Spreadsheet
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0); // Remove default sheet

        $sheetIndex = 0;
        foreach (['IDX', 'NYSE'] as $targetCategory) {
            if (empty($sheetGroups[$targetCategory])) {
                continue;
            }

            $tickerPriceMap = $sheetGroups[$targetCategory];
            $sheet = $spreadsheet->createSheet($sheetIndex++);
            $sheet->setTitle($targetCategory);

            // Collect all unique dates across all tickers in this sheet
            $allDates = [];
            foreach ($tickerPriceMap as $prices) {
                foreach (array_keys($prices) as $d) {
                    $allDates[$d] = true;
                }
            }
            $sortedDates = array_keys($allDates);
            sort($sortedDates);

            $sheetTickers = array_keys($tickerPriceMap);

            // Row 1: Headers (Column A = Date, Column B..N = Ticker)
            $sheet->setCellValue([1, 1], 'Date');
            $colIdx = 2;
            foreach ($sheetTickers as $ticker) {
                $sheet->setCellValue([$colIdx, 1], $ticker);
                $colIdx++;
            }

            // Row 2: Name (Column A = Name, Column B..N = Company Name)
            $sheet->setCellValue([1, 2], 'Name');
            $colIdx = 2;
            foreach ($sheetTickers as $ticker) {
                $stock = $dbStocks[$ticker] ?? ($dbStocks[$ticker . '.JK'] ?? ($dbStocks[str_replace('.JK', '', $ticker)] ?? null));
                $stockName = $stock?->name ?: ($masterStocks[$ticker] ?? ($masterStocks[str_replace('.JK', '', $ticker)] ?? str_replace('.JK', '', $ticker)));
                $sheet->setCellValue([$colIdx, 2], $stockName);
                $colIdx++;
            }

            // Row 3: Bursa (Column A = Bursa, Column B..N = IDX / NYSE)
            $sheet->setCellValue([1, 3], 'Bursa');
            $colIdx = 2;
            foreach ($sheetTickers as $ticker) {
                $stock = $dbStocks[$ticker] ?? ($dbStocks[$ticker . '.JK'] ?? ($dbStocks[str_replace('.JK', '', $ticker)] ?? null));
                $stockBursa = $stock?->bursa ?: $targetCategory;
                $sheet->setCellValue([$colIdx, 3], $stockBursa);
                $colIdx++;
            }

            // Row 4: Sector (Column A = Sector, Column B..N = Sector Name)
            $sheet->setCellValue([1, 4], 'Sector');
            $colIdx = 2;
            foreach ($sheetTickers as $ticker) {
                $stock = $dbStocks[$ticker] ?? ($dbStocks[$ticker . '.JK'] ?? ($dbStocks[str_replace('.JK', '', $ticker)] ?? null));
                $stockSector = $stock?->sector;
                if (empty($stockSector) && !empty($validated['sector']) && $validated['sector'] !== 'all') {
                    $stockSector = $validated['sector'];
                }
                $sheet->setCellValue([$colIdx, 4], $stockSector ?: '');
                $colIdx++;
            }

            // Fill rows (Dates & prices) starting at Row 5
            $rowIdx = 5;
            foreach ($sortedDates as $date) {
                $sheet->setCellValue([1, $rowIdx], $date);

                $colIdx = 2;
                foreach ($sheetTickers as $ticker) {
                    $price = $tickerPriceMap[$ticker][$date] ?? null;
                    if ($price !== null) {
                        $sheet->setCellValue([$colIdx, $rowIdx], $price);
                    }
                    $colIdx++;
                }
                $rowIdx++;
            }

            $highestColumn = $sheet->getHighestColumn();
            $highestRow = $sheet->getHighestRow();

            // Style headers (Row 1: Tickers)
            $headerRange = "A1:{$highestColumn}1";
            $sheet->getStyle($headerRange)->getFont()->setBold(true)->setSize(11);
            $sheet->getStyle($headerRange)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE6F4EA'); // Light emerald green tint

            $sheet->getStyle($headerRange)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);

            // Style metadata labels (A2:A4)
            $metaLabelRange = "A2:A4";
            $sheet->getStyle($metaLabelRange)->getFont()->setBold(true)->setSize(10);
            $sheet->getStyle($metaLabelRange)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFF1F3F4'); // Neutral gray tint
            $sheet->getStyle($metaLabelRange)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);

            // Style metadata values (B2:highestColumn 4)
            $metaValueRange = "B2:{$highestColumn}4";
            $sheet->getStyle($metaValueRange)->getFont()->setSize(10);
            $sheet->getStyle($metaValueRange)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);

            // Auto-size columns
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $sheet->getColumnDimensionByColumn($col)->setAutoSize(true);
            }

            // Apply thin borders to all data cells
            $sheet->getStyle("A1:{$highestColumn}{$highestRow}")->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN)
                ->getColor()->setARGB('FFD1D5DB');

            // Format date column (A5 downwards)
            $sheet->getStyle("A5:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // If no sheets were created, create a fallback IDX sheet
        if ($spreadsheet->getSheetCount() === 0) {
            $sheet = $spreadsheet->createSheet(0);
            $sheet->setTitle('IDX');
            $sheet->setCellValue('A1', 'Date');
        }

        $spreadsheet->setActiveSheetIndex(0);

        // Generate Filename
        $validTickersCount = count($scrapedData);
        $cleanTickerNames = array_map(function ($t) {
            return str_replace('.JK', '', $t);
        }, array_keys($scrapedData));

        if ($validTickersCount === 1) {
            $tickerPart = $cleanTickerNames[0];
        } elseif ($validTickersCount <= 3) {
            $tickerPart = implode('_', $cleanTickerNames);
        } else {
            $tickerPart = $validTickersCount . '_Saham';
        }

        $formattedStart = $startDate->format('Y-m-d');
        $formattedEnd = $endDate->format('Y-m-d');
        $fileName = "Data_Saham_{$tickerPart}_{$formattedStart}_sd_{$formattedEnd}.xlsx";

        return new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
