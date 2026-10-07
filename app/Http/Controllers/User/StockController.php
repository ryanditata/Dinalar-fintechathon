<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\PortfolioOptimization;
use App\Models\Stock;
use App\Models\StockPrice;
use App\Services\DeviceViewResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockController extends Controller
{
    /**
     * Display a listing of stocks for users from database without pagination.
     * Optimized for high concurrency, minimal memory footprint, and fast querying.
     */
    public function index(Request $request)
    {
        $query = Stock::query()
            ->with(['latestPrice'])
            ->withCount('prices')
            ->where('is_active', true);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('ticker', 'like', '%' . $search . '%')
                  ->orWhere('name', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('bursa') && $request->bursa !== 'all') {
            $query->where('bursa', $request->bursa);
        }

        if ($request->filled('sector') && $request->sector !== 'all') {
            $query->where('sector', $request->sector);
        }

        $stocks = $query->orderBy('ticker', 'asc')->get();
        $stockIds = $stocks->pluck('id')->toArray();

        // 1. Dapatkan batas tanggal global
        $minDate = StockPrice::min('date');
        $maxDate = StockPrice::max('date');

        // 2. Optimasi Memory: Hanya ambil harga penutupan rentang 45 hari terakhir untuk sparkline & kalkulasi change
        // Mencegah memory exhaustion akibat memuat ratusan ribu baris data historis ke RAM PHP
        $recentPricesByStock = collect();
        if ($maxDate && !empty($stockIds)) {
            $maxDateStr = is_string($maxDate) ? substr($maxDate, 0, 10) : $maxDate->format('Y-m-d');
            $cutoffDate = date('Y-m-d', strtotime($maxDateStr . ' -45 days'));

            $recentPricesByStock = StockPrice::whereIn('stock_id', $stockIds)
                ->where('date', '>=', $cutoffDate)
                ->orderBy('date', 'desc')
                ->get(['stock_id', 'date', 'close_price'])
                ->groupBy('stock_id');
        }

        // 3. Hitung frekuensi analisis tiap kode saham dari tabel portfolio_optimizations
        $tickerAnalysisCounts = [];
        $allTickerArrays = PortfolioOptimization::pluck('tickers');
        foreach ($allTickerArrays as $tickerArray) {
            if (is_array($tickerArray)) {
                foreach ($tickerArray as $rawTicker) {
                    $clean = str_replace('.JK', '', strtoupper(trim($rawTicker)));
                    $tickerAnalysisCounts[$clean] = ($tickerAnalysisCounts[$clean] ?? 0) + 1;
                    $tickerAnalysisCounts[$rawTicker] = ($tickerAnalysisCounts[$rawTicker] ?? 0) + 1;
                }
            }
        }

        // 4. Transformasi atribut saham sesuai kontrak frontend
        $stocks->transform(function ($stock) use ($recentPricesByStock, $tickerAnalysisCounts) {
            $prices = $recentPricesByStock->get($stock->id, collect());

            // Fallback jika saham tertentu tidak memiliki transaksi dalam 45 hari terakhir
            if ($prices->isEmpty() && $stock->prices_count > 0) {
                $prices = StockPrice::where('stock_id', $stock->id)
                    ->orderBy('date', 'desc')
                    ->take(7)
                    ->get(['stock_id', 'date', 'close_price']);
            }

            $latest = $prices->first() ?? $stock->latestPrice;
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

            $cleanTicker = str_replace('.JK', '', strtoupper(trim($stock->ticker)));
            $stock->analysis_count = $tickerAnalysisCounts[$cleanTicker] ?? $tickerAnalysisCounts[$stock->ticker] ?? 0;
            $stock->change = $change !== null ? round($change, 2) : null;
            $stock->change_percent = $changePercent !== null ? round($changePercent, 2) : null;
            $stock->previous_price = $previous ? (float) $previous->close_price : null;
            
            // 7 data penutupan terakhir secara kronologis (kiri ke kanan / terlama ke terbaru) untuk sparkline
            $stock->recent_prices = $prices->take(7)
                ->pluck('close_price')
                ->reverse()
                ->values()
                ->map(fn($p) => (float) $p)
                ->toArray();

            return $stock;
        });

        // 5. Dynamic Sorting: Prioritaskan saham yang paling sering dianalisis (analysis_count DESC), lalu performa change_percent DESC
        $stocks = $stocks->sort(function ($a, $b) {
            $countA = $a->analysis_count ?? 0;
            $countB = $b->analysis_count ?? 0;
            if ($countA !== $countB) {
                return $countB <=> $countA;
            }
            return ($b->change_percent ?? 0) <=> ($a->change_percent ?? 0);
        })->values();

        // 6. Bursa yang tersedia
        $bursaList = Stock::where('is_active', true)
            ->whereNotNull('bursa')
            ->where('bursa', '!=', '')
            ->distinct()
            ->orderBy('bursa', 'asc')
            ->pluck('bursa')
            ->values()
            ->toArray();

        return Inertia::render(DeviceViewResolver::resolve('user/saham/index', $request), [
            'stocks' => $stocks,
            'filters' => [
                'search' => $request->search ?? '',
                'bursa' => $request->bursa ?? 'all',
                'sector' => $request->sector ?? 'all',
            ],
            'bursa_list' => $bursaList,
            'availableSectors' => \App\Http\Controllers\Admin\StockController::SECTORS,
            'total_count' => Stock::where('is_active', true)->count(),
            'timeframe_limits' => [
                'min_date' => $minDate ? (is_string($minDate) ? substr($minDate, 0, 10) : $minDate->format('Y-m-d')) : null,
                'max_date' => $maxDate ? (is_string($maxDate) ? substr($maxDate, 0, 10) : $maxDate->format('Y-m-d')) : null,
            ],
        ]);
    }

    /**
     * Get historical price data and quantitative metrics for modal analysis dialog.
     * Includes base price offset resolution to ensure accurate daily returns on short windows (e.g., 1D / 5D).
     * Calculates both Total Period Return (Capital Gain) and Annualized Expected Return / Volatility.
     */
    public function getHistoricalData(Request $request, $ticker)
    {
        $cleanTicker = str_replace('.JK', '', strtoupper(trim($ticker)));
        $stock = Stock::where('ticker', $ticker)
            ->orWhere('ticker', $cleanTicker)
            ->orWhere('ticker', $cleanTicker . '.JK')
            ->firstOrFail();

        $data = self::calculateHistoricalAnalysis(
            $stock,
            $request->preset,
            $request->start_date,
            $request->end_date
        );

        return response()->json($data);
    }

    /**
     * Compute quantitative analysis and historical metrics for a given stock.
     */
    public static function calculateHistoricalAnalysis(Stock $stock, ?string $preset = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $priceQuery = StockPrice::where('stock_id', $stock->id);

        $minDate = (clone $priceQuery)->min('date');
        $maxDate = (clone $priceQuery)->max('date');

        $minDateStr = $minDate ? (is_string($minDate) ? substr($minDate, 0, 10) : $minDate->format('Y-m-d')) : null;
        $maxDateStr = $maxDate ? (is_string($maxDate) ? substr($maxDate, 0, 10) : $maxDate->format('Y-m-d')) : null;

        $resolvedEndDate = !empty($endDate) ? $endDate : ($maxDateStr ?? date('Y-m-d'));
        $resolvedStartDate = !empty($startDate) ? $startDate : ($minDateStr ?? '2023-01-01');
        $horizonStartDate = null;

        // 1. Resolusi Trading Sessions Presets (Bursa Efek Indonesia: Lookback Multiplier 3x)
        if (!empty($preset)) {
            $normalizedPreset = strtoupper(trim($preset));

            $presetMap = [
                '1D'  => ['lookback' => 5,    'horizon' => 2],
                '5D'  => ['lookback' => 15,   'horizon' => 5],
                '1M'  => ['lookback' => 63,   'horizon' => 21],
                '3M'  => ['lookback' => 189,  'horizon' => 63],
                '6M'  => ['lookback' => 252,  'horizon' => 126],
                '1Y'  => ['lookback' => 504,  'horizon' => 252],
                '3Y'  => ['lookback' => null, 'horizon' => 756],
                '5Y'  => ['lookback' => null, 'horizon' => 1260],
                'ALL' => ['lookback' => null, 'horizon' => null],
            ];

            if (isset($presetMap[$normalizedPreset])) {
                $map = $presetMap[$normalizedPreset];

                // startDate = lookback 3x (untuk estimasi E(R) dan sigma)
                if ($map['lookback'] === null) {
                    $resolvedStartDate = $minDateStr ?? '2023-01-01';
                } else {
                    $lookbackRows = StockPrice::where('stock_id', $stock->id)
                        ->where('date', '<=', $resolvedEndDate)
                        ->orderBy('date', 'desc')
                        ->take($map['lookback'])
                        ->get(['date']);
                    if ($lookbackRows->isNotEmpty()) {
                        $pDate = $lookbackRows->last()->date;
                        $resolvedStartDate = is_string($pDate) ? substr($pDate, 0, 10) : $pDate->format('Y-m-d');
                    }
                }

                // horizonStartDate = horison asli (untuk Period Return)
                if ($map['horizon'] === null || $normalizedPreset === 'ALL') {
                    $horizonStartDate = $resolvedStartDate;
                } else {
                    $horizonRows = StockPrice::where('stock_id', $stock->id)
                        ->where('date', '<=', $resolvedEndDate)
                        ->orderBy('date', 'desc')
                        ->take($map['horizon'])
                        ->get(['date']);
                    if ($horizonRows->isNotEmpty()) {
                        $pDate2 = $horizonRows->last()->date;
                        $horizonStartDate = is_string($pDate2) ? substr($pDate2, 0, 10) : $pDate2->format('Y-m-d');
                    } else {
                        $horizonStartDate = $resolvedStartDate;
                    }
                }
            }
        }

        // 2. Ambil data historis harga dalam rentang tanggal
        $prices = StockPrice::where('stock_id', $stock->id)
            ->where('date', '>=', $resolvedStartDate)
            ->where('date', '<=', $resolvedEndDate)
            ->orderBy('date', 'asc')
            ->get(['date', 'close_price']);

        // 3. Base Anchor Price (Quant Fix):
        // a. Anchor price untuk daily returns loop (tepat sebelum startDate)
        $lookbackAnchor = StockPrice::where('stock_id', $stock->id)
            ->where('date', '<', $resolvedStartDate)
            ->orderBy('date', 'desc')
            ->first(['date', 'close_price']);
        $prevClose = $lookbackAnchor ? (float) $lookbackAnchor->close_price : null;

        // b. Base Anchor Price untuk Period Return (tepat sebelum horizonStartDate)
        $horizonAnchor = StockPrice::where('stock_id', $stock->id)
            ->where('date', '<', $horizonStartDate ?? $resolvedStartDate)
            ->orderBy('date', 'desc')
            ->first(['date', 'close_price']);
        $basePrice = $horizonAnchor ? (float) $horizonAnchor->close_price : null;

        $priceList = [];
        $dailyReturns = [];

        foreach ($prices as $p) {
            $close = (float) $p->close_price;
            $dailyReturn = null;

            if ($prevClose !== null && $prevClose > 0) {
                $dailyReturn = ($close - $prevClose) / $prevClose;
                $dailyReturns[] = $dailyReturn;
            }

            $dateStr = is_string($p->date) ? substr($p->date, 0, 10) : $p->date->format('Y-m-d');
            $priceList[] = [
                'date' => $dateStr,
                'close_price' => $close,
                'daily_return' => $dailyReturn !== null ? round($dailyReturn * 100, 2) : 0,
            ];

            $prevClose = $close;
        }

        // Fallback untuk $basePrice jika tidak ada data sebelum horizonStartDate (misal hari IPO atau data awal)
        if ($basePrice === null) {
            $effectiveHorizonStart = $horizonStartDate ?? $resolvedStartDate;
            $horizonFirst = $prices->first(function ($p) use ($effectiveHorizonStart) {
                $d = is_string($p->date) ? substr($p->date, 0, 10) : $p->date->format('Y-m-d');
                return $d >= $effectiveHorizonStart;
            });
            $basePrice = $horizonFirst ? (float) $horizonFirst->close_price : ($prices->isNotEmpty() ? (float) $prices->first()->close_price : null);
        }

        // 4. Kalkulasi Metrik Finansial Kuantitatif
        $latestClose = $prices->isNotEmpty() ? (float) $prices->last()->close_price : 0;

        // a. Total Window / Period Return (Capital Gain riil selama periode horison)
        $periodReturn = 0;
        if ($basePrice !== null && $basePrice > 0 && $latestClose > 0) {
            $periodReturn = round((($latestClose - $basePrice) / $basePrice) * 100, 2);
        }

        // b. Annualized Expected Return E(R) (Disetahunkan 252 Hari Bursa berbasis lookback 3x)
        $expectedReturn = 0;
        $volatility = 0;

        if (count($dailyReturns) >= 1) {
            $mean = array_sum($dailyReturns) / count($dailyReturns);
            $expectedReturn = round($mean * 252 * 100, 2);

            // c. Annualized Volatility (sqrt(252)) dengan sample standard deviation (N-1)
            if (count($dailyReturns) > 1) {
                $variance = 0;
                foreach ($dailyReturns as $r) {
                    $variance += pow($r - $mean, 2);
                }
                $stdDev = sqrt($variance / (count($dailyReturns) - 1));
                $volatility = round($stdDev * sqrt(252) * 100, 2);
            }
        }

        $closePrices = array_column($priceList, 'close_price');
        $minPrice = count($closePrices) > 0 ? min($closePrices) : 0;
        $maxPrice = count($closePrices) > 0 ? max($closePrices) : 0;

        // Hitung jumlah hari bursa dalam horison asli (untuk display Return Periode)
        $horizonDataPoints = 0;
        if ($horizonStartDate) {
            $horizonDataPoints = (int) StockPrice::where('stock_id', $stock->id)
                ->where('date', '>=', $horizonStartDate)
                ->where('date', '<=', $resolvedEndDate)
                ->count();
        } else {
            $horizonDataPoints = count($priceList);
        }

        return [
            'stock' => $stock,
            'timeframe' => [
                'min_date'           => $minDateStr,
                'max_date'           => $maxDateStr,
                'start_date'         => $resolvedStartDate,
                'end_date'           => $resolvedEndDate,
                'horizon_start_date' => $horizonStartDate ?? $resolvedStartDate,
            ],
            'metrics' => [
                'period_return'       => $periodReturn,
                'expected_return'     => $expectedReturn,
                'volatility'          => $volatility,
                'min_price'           => $minPrice,
                'max_price'           => $maxPrice,
                'data_points'         => count($priceList),
                'horizon_data_points' => $horizonDataPoints,
                'base_price'          => $basePrice,
                'latest_price'        => $latestClose,
            ],
            'prices' => $priceList,
        ];
    }

    /**
     * Show single stock detail page.
     */
    public function show($ticker)
    {
        $cleanTicker = str_replace('.JK', '', strtoupper(trim($ticker)));
        $stock = Stock::where('ticker', $ticker)
            ->orWhere('ticker', $cleanTicker)
            ->orWhere('ticker', $cleanTicker . '.JK')
            ->with(['latestPrice'])
            ->firstOrFail();

        $minDate = StockPrice::where('stock_id', $stock->id)->min('date');
        $maxDate = StockPrice::where('stock_id', $stock->id)->max('date');

        return Inertia::render('user/saham/show', [
            'stock' => $stock,
            'timeframe_limit' => [
                'min_date' => $minDate ? (is_string($minDate) ? substr($minDate, 0, 10) : $minDate->format('Y-m-d')) : null,
                'max_date' => $maxDate ? (is_string($maxDate) ? substr($maxDate, 0, 10) : $maxDate->format('Y-m-d')) : null,
            ],
        ]);
    }
}
