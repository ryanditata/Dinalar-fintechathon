<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockPrice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class StockController extends Controller
{
    public const SECTORS = [
        'Technology',
        'Financial Services',
        'Industrials',
        'Consumer Cyclical',
        'Communication Services',
        'Healthcare',
        'Energy',
        'Consumer Defensive',
        'Basic Materials',
        'Real Estate',
        'Utilities',
    ];

    /**
     * Display a listing of the stocks.
     */
    public function index(Request $request)
    {
        $query = Stock::query()->with(['latestPrice'])->withCount('prices');

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('ticker', 'like', '%' . $search . '%')
                  ->orWhere('name', 'like', '%' . $search . '%')
                  ->orWhere('sector', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('bursa') && $request->bursa !== 'all') {
            $query->where('bursa', $request->bursa);
        }

        if ($request->filled('sector') && $request->sector !== 'all') {
            $query->where('sector', $request->sector);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $stocks = $query->orderBy('ticker', 'asc')->paginate(15)->withQueryString();

        // Calculate price change and percentage for each stock in current page
        $stockIds = $stocks->pluck('id');
        $pricesByStock = StockPrice::whereIn('stock_id', $stockIds)
            ->orderBy('date', 'desc')
            ->get()
            ->groupBy('stock_id');

        $stocks->through(function ($stock) use ($pricesByStock) {
            $prices = $pricesByStock->get($stock->id, collect());
            $latest = $prices->first();
            $previous = $prices->skip(1)->first();

            $change = null;
            $changePercent = null;

            if ($latest && $previous && (float) $previous->close_price > 0) {
                $latestClose = (float) $latest->close_price;
                $prevClose = (float) $previous->close_price;
                $change = $latestClose - $prevClose;
                $changePercent = (($latestClose - $prevClose) / $prevClose) * 100;
            } elseif ($latest) {
                $change = 0;
                $changePercent = 0;
            }

            $stock->change = $change;
            $stock->change_percent = $changePercent !== null ? round($changePercent, 2) : null;
            $stock->previous_price = $previous ? (float) $previous->close_price : null;
            $stock->recent_prices = $prices->take(7)->pluck('close_price')->reverse()->values()->map(fn($p) => (float) $p)->toArray();

            return $stock;
        });

        $statistics = [
            'total_stocks' => Stock::count(),
            'total_prices' => StockPrice::count(),
            'idx_conventional_count' => Stock::where('bursa', 'IDX')->orWhere('bursa', 'IDX Conventional')->count(),
            'nyse_count' => Stock::where('bursa', 'NYSE')
                ->orWhere('bursa', 'New York Stock Exchange')
                ->count(),
            'jii_count' => Stock::where('bursa', 'NYSE')
                ->orWhere('bursa', 'New York Stock Exchange')
                ->count(),
            'active_stocks_count' => Stock::where('is_active', true)->count(),
            'last_price_date' => StockPrice::max('date'),
        ];

        return Inertia::render('admin/saham/index', [
            'stocks' => $stocks,
            'filters' => [
                'search' => $request->search,
                'bursa' => $request->bursa ?? 'all',
                'sector' => $request->sector,
                'status' => $request->status,
            ],
            'statistics' => $statistics,
            'availableSectors' => self::SECTORS,
        ]);
    }

    /**
     * Store a newly created stock in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ticker' => ['required', 'string', 'max:20', 'unique:stocks,ticker'],
            'name' => ['nullable', 'string', 'max:255'],
            'bursa' => ['required', 'string', 'in:IDX,NYSE'],
            'sector' => ['nullable', 'string', 'in:' . implode(',', self::SECTORS)],
            'is_active' => ['boolean'],
        ], [
            'ticker.required' => 'Kode ticker saham wajib diisi.',
            'ticker.unique' => 'Kode ticker saham sudah terdaftar di sistem.',
            'bursa.required' => 'Bursa wajib dipilih.',
            'bursa.in' => 'Bursa harus IDX atau NYSE.',
            'sector.in' => 'Sektor yang dipilih tidak valid.',
        ]);

        $ticker = strtoupper(trim($validated['ticker']));

        $stock = Stock::create([
            'ticker' => $ticker,
            'name' => !empty($validated['name']) ? trim($validated['name']) : str_replace('.JK', '', $ticker),
            'bursa' => $validated['bursa'],
            'sector' => !empty($validated['sector']) ? trim($validated['sector']) : null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', "Saham {$stock->ticker} berhasil ditambahkan.");
    }

    /**
     * Update the specified stock in storage.
     */
    public function update(Request $request, Stock $stock)
    {
        $validated = $request->validate([
            'ticker' => [
                'required',
                'string',
                'max:20',
                Rule::unique('stocks', 'ticker')->ignore($stock->id),
            ],
            'name' => ['nullable', 'string', 'max:255'],
            'bursa' => ['required', 'string', 'in:IDX,NYSE'],
            'sector' => ['nullable', 'string', 'in:' . implode(',', self::SECTORS)],
            'is_active' => ['boolean'],
        ], [
            'ticker.required' => 'Kode ticker saham wajib diisi.',
            'ticker.unique' => 'Kode ticker saham sudah digunakan oleh emiten lain.',
            'bursa.required' => 'Bursa wajib dipilih.',
            'bursa.in' => 'Bursa harus IDX atau NYSE.',
            'sector.in' => 'Sektor yang dipilih tidak valid.',
        ]);

        $ticker = strtoupper(trim($validated['ticker']));

        $stock->update([
            'ticker' => $ticker,
            'name' => !empty($validated['name']) ? trim($validated['name']) : str_replace('.JK', '', $ticker),
            'bursa' => $validated['bursa'],
            'sector' => !empty($validated['sector']) ? trim($validated['sector']) : null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', "Data saham {$stock->ticker} berhasil diperbarui.");
    }

    /**
     * Handle the Excel import for historic stock prices.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:51200'], // max 50MB
        ]);

        $file = $request->file('file');
        
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheetNames = $spreadsheet->getSheetNames();

            $totalStocksImported = 0;
            $totalPricesImported = 0;
            $sheetsProcessed = [];

            // Target sheet names & standard category mappings
            $targetSheetMappings = [
                'idx conventional' => 'IDX',
                'jakarta islamic index' => 'NYSE',
                'jii' => 'NYSE',
                'nyse' => 'NYSE',
                'new york stock exchange' => 'NYSE',
                'idx' => 'IDX',
            ];

            DB::beginTransaction();

            foreach ($sheetNames as $sheetName) {
                $normalizedSheetName = strtolower(trim($sheetName));
                
                // Determine if this sheet should be processed
                $category = null;
                foreach ($targetSheetMappings as $pattern => $mappedCategory) {
                    if (str_contains($normalizedSheetName, $pattern)) {
                        $category = $mappedCategory;
                        break;
                    }
                }

                if (!$category) {
                    continue;
                }

                $sheet = $spreadsheet->getSheetByName($sheetName);
                $rows = $sheet->toArray(null, true, true, false);

                if (empty($rows) || count($rows) < 2) {
                    continue;
                }

                // Header row: index 0 -> [Date, Ticker1, Ticker2, ...]
                $header = $rows[0];
                $tickerColumns = [];

                // Check for metadata rows (Row 2: Name, Row 3: Bursa, Row 4: Sector)
                $namesRow = null;
                $bursaRow = null;
                $sectorRow = null;
                $dataStartRow = 1;

                // Inspect potential metadata rows (indices 1..4)
                for ($checkIdx = 1; $checkIdx <= min(4, count($rows) - 1); $checkIdx++) {
                    $rowLabel = strtolower(trim((string)($rows[$checkIdx][0] ?? '')));
                    if ($rowLabel === 'name' || $rowLabel === 'nama') {
                        $namesRow = $rows[$checkIdx];
                        $dataStartRow = max($dataStartRow, $checkIdx + 1);
                    } elseif ($rowLabel === 'bursa') {
                        $bursaRow = $rows[$checkIdx];
                        $dataStartRow = max($dataStartRow, $checkIdx + 1);
                    } elseif ($rowLabel === 'sector' || $rowLabel === 'sektor') {
                        $sectorRow = $rows[$checkIdx];
                        $dataStartRow = max($dataStartRow, $checkIdx + 1);
                    }
                }

                for ($col = 1; $col < count($header); $col++) {
                    $rawTicker = $header[$col];
                    if ($rawTicker && is_string($rawTicker) && trim($rawTicker) !== '') {
                        $cleanedTicker = strtoupper(trim($rawTicker));
                        
                        $stockName = null;
                        if ($namesRow && !empty($namesRow[$col])) {
                            $stockName = trim((string)$namesRow[$col]);
                        }
                        if (!$stockName) {
                            $stockName = str_replace('.JK', '', $cleanedTicker);
                        }

                        $stockBursa = $category;
                        if ($bursaRow && !empty($bursaRow[$col])) {
                            $b = strtoupper(trim((string)$bursaRow[$col]));
                            if (in_array($b, ['IDX', 'NYSE'])) {
                                $stockBursa = $b;
                            }
                        }

                        $stockSector = null;
                        if ($sectorRow && !empty($sectorRow[$col])) {
                            $s = trim((string)$sectorRow[$col]);
                            foreach (self::SECTORS as $validSec) {
                                if (strcasecmp($s, $validSec) === 0) {
                                    $stockSector = $validSec;
                                    break;
                                }
                            }
                            if (!$stockSector && !empty($s)) {
                                $stockSector = $s;
                            }
                        }

                        $stock = Stock::where('ticker', $cleanedTicker)->first();
                        if (!$stock) {
                            $stock = Stock::create([
                                'ticker' => $cleanedTicker,
                                'name' => $stockName,
                                'bursa' => $stockBursa,
                                'sector' => $stockSector,
                                'is_active' => true,
                            ]);
                            $totalStocksImported++;
                        } else {
                            $dirty = false;
                            if ($stockName && $stock->name !== $stockName && $stockName !== str_replace('.JK', '', $cleanedTicker)) {
                                $stock->name = $stockName;
                                $dirty = true;
                            }
                            if ($stockSector && $stock->sector !== $stockSector) {
                                $stock->sector = $stockSector;
                                $dirty = true;
                            }
                            if ($dirty) {
                                $stock->save();
                            }
                        }

                        $tickerColumns[$col] = $stock->id;
                    }
                }

                if (empty($tickerColumns)) {
                    continue;
                }

                // Data rows: index $dataStartRow..N -> [YYYY-MM-DD, Price1, Price2, ...]
                for ($r = $dataStartRow; $r < count($rows); $r++) {
                    $row = $rows[$r];
                    $rawDate = $row[0] ?? null;

                    if (!$rawDate) {
                        continue;
                    }

                    // Parse Date correctly (handles numeric Excel serial dates and string dates)
                    try {
                        if (is_numeric($rawDate)) {
                            $parsedDate = ExcelDate::excelToDateTimeObject($rawDate)->format('Y-m-d');
                        } else {
                            $parsedDate = Carbon::parse($rawDate)->format('Y-m-d');
                        }
                    } catch (\Throwable $e) {
                        continue; // Skip invalid date row
                    }

                    foreach ($tickerColumns as $colIndex => $stockId) {
                        $rawPrice = $row[$colIndex] ?? null;

                        if ($rawPrice === null || $rawPrice === '') {
                            continue;
                        }

                        $cleanPrice = is_string($rawPrice) ? str_replace([',', ' '], '', $rawPrice) : $rawPrice;

                        if (!is_numeric($cleanPrice)) {
                            continue;
                        }

                        $closePrice = round((float) $cleanPrice, 2);

                        if ($closePrice <= 0) {
                            continue;
                        }

                        StockPrice::updateOrCreate(
                            [
                                'stock_id' => $stockId,
                                'date' => $parsedDate,
                            ],
                            [
                                'close_price' => $closePrice,
                            ]
                        );

                        $totalPricesImported++;
                    }
                }

                $sheetsProcessed[] = $sheetName;
            }

            DB::commit();

            if (empty($sheetsProcessed)) {
                return redirect()->back()->with('error', 'Tidak ditemukan sheet "IDX" atau "NYSE" yang valid dalam file Excel.');
            }

            return redirect()->back()->with('success', "Import berhasil! Diproses {$totalPricesImported} data harga untuk {$totalStocksImported} emiten dari sheet: " . implode(', ', $sheetsProcessed) . '.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Stock import failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Gagal memproses file Excel: ' . $e->getMessage());
        }
    }

    /**
     * Get recent historical price data and statistics for detail modal.
     */
    public function prices(Stock $stock)
    {
        $prices = StockPrice::where('stock_id', $stock->id)
            ->orderBy('date', 'desc')
            ->get(['id', 'date', 'close_price']);

        // Reverse to chronological order for charts
        $chartPrices = $prices->reverse()->values()->map(function ($item) {
            return [
                'date' => is_string($item->date) ? substr($item->date, 0, 10) : $item->date->format('Y-m-d'),
                'close_price' => (float) $item->close_price,
            ];
        });

        // Calculate highest, lowest, average
        $high = $prices->max('close_price');
        $low = $prices->min('close_price');
        $avg = $prices->avg('close_price');

        return response()->json([
            'success' => true,
            'stock' => [
                'id' => $stock->id,
                'ticker' => $stock->ticker,
                'name' => $stock->name,
                'bursa' => $stock->bursa,
                'sector' => $stock->sector,
                'is_active' => (bool) $stock->is_active,
                'created_at' => $stock->created_at,
                'updated_at' => $stock->updated_at,
                'prices_count' => $stock->prices()->count(),
            ],
            'prices' => $prices->map(function ($item) {
                return [
                    'id' => $item->id,
                    'date' => is_string($item->date) ? substr($item->date, 0, 10) : $item->date->format('Y-m-d'),
                    'close_price' => (float) $item->close_price,
                ];
            }),
            'chart_prices' => $chartPrices,
            'stats' => [
                'high' => $high ? (float) $high : null,
                'low' => $low ? (float) $low : null,
                'avg' => $avg ? round((float) $avg, 2) : null,
                'count' => $prices->count(),
            ],
        ]);
    }

    /**
     * Toggle the active status of a stock.
     */
    public function toggleActive(Stock $stock)
    {
        $stock->update([
            'is_active' => !$stock->is_active,
        ]);

        $status = $stock->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Status saham {$stock->ticker} berhasil {$status}.");
    }

    /**
     * Remove the specified stock and its price history.
     */
    public function destroy(Stock $stock)
    {
        $ticker = $stock->ticker;
        $stock->delete();

        return redirect()->back()->with('success', "Saham {$ticker} beserta seluruh data historisnya berhasil dihapus.");
    }
}
