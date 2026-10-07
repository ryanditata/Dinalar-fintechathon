<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\PortfolioOptimization;
use App\Models\Stock;
use App\Models\StockPrice;
use App\Models\UserBasket;
use App\Services\DeviceViewResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\Process\Process;

class PortfolioController extends Controller
{
    /**
     * Display the portfolio basket setup and optimization preparation page.
     * Only loads stocks that exist in the user's persistent basket.
     */
    public function setup(Request $request)
    {
        $userId = Auth::id();

        // Ambil hanya saham yang disimpan di keranjang user
        $basketItems = UserBasket::where('user_id', $userId)
            ->with(['stock.latestPrice'])
            ->orderBy('created_at', 'desc')
            ->get();

        $minDate = StockPrice::min('date');
        $maxDate = StockPrice::max('date');

        // Riwayat optimasi tersimpan milik user yang sedang login
        $recentOptimizations = PortfolioOptimization::where('user_id', $userId)
            ->latest()
            ->take(5)
            ->get(['id', 'user_id', 'title', 'initial_capital', 'tickers', 'created_at']);

        // Jika keranjang kosong, kembalikan data kosong tanpa memuat histori harga apapun
        if ($basketItems->isEmpty()) {
            return Inertia::render(DeviceViewResolver::resolve('user/analyze/keranjang', $request), [
                'available_stocks' => [],
                'basket_items' => [],
                'basket_tickers' => [],
                'detailed_basket_stocks' => (object) [],
                'global_timeframe' => [
                    'min_date' => $minDate,
                    'max_date' => $maxDate,
                ],
                'recent_optimizations' => $recentOptimizations,
            ]);
        }

        $stockIds = $basketItems->pluck('stock_id')->filter()->unique();

        // Ambil hanya 15 harga penutupan terakhir KHUSUS saham yang ada di keranjang menggunakan Window Function
        $pricesByStock = collect();
        if ($stockIds->isNotEmpty()) {
            $rawPrices = DB::select("
                WITH ranked_prices AS (
                    SELECT 
                        stock_id,
                        date,
                        close_price,
                        ROW_NUMBER() OVER (PARTITION BY stock_id ORDER BY date DESC) as rn
                    FROM stock_prices
                    WHERE stock_id IN (" . $stockIds->implode(',') . ")
                )
                SELECT stock_id, date, close_price
                FROM ranked_prices
                WHERE rn <= 15
                ORDER BY stock_id ASC, date DESC
            ");
            $pricesByStock = collect($rawPrices)->groupBy('stock_id');
        }

        $detailedBasketStocks = [];
        $stocks = $basketItems->map(function ($basketItem) use ($pricesByStock, &$detailedBasketStocks) {
            $stock = $basketItem->stock;
            if (!$stock) {
                return null;
            }

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
            $stock->recent_prices = $prices->take(15)->pluck('close_price')->reverse()->values();

            // Format payload data detail untuk frontend
            $ticker = $stock->ticker;
            $clean = str_replace('.JK', '', $ticker);
            $payload = [
                'ticker' => $ticker,
                'stock' => $stock,
                'timeframe' => [
                    'start' => $basketItem->timeframe_start ? $basketItem->timeframe_start->format('Y-m-d') : null,
                    'end' => $basketItem->timeframe_end ? $basketItem->timeframe_end->format('Y-m-d') : null,
                    'lookback_start' => $basketItem->timeframe_lookback_start ? $basketItem->timeframe_lookback_start->format('Y-m-d') : null,
                    'preset' => $basketItem->timeframe_preset,
                ],
                'benchmark' => $basketItem->benchmark,
                'metrics' => $basketItem->metrics ?? [],
                'prices' => $basketItem->prices ?? [],
            ];

            $detailedBasketStocks[$ticker] = $payload;
            $detailedBasketStocks[$clean] = $payload;

            return $stock;
        })->filter()->values();

        $basketTickers = $basketItems->map(fn($item) => $item->stock?->ticker)->filter()->values();

        return Inertia::render(DeviceViewResolver::resolve('user/analyze/keranjang', $request), [
            'available_stocks' => $stocks,
            'basket_items' => $basketItems,
            'basket_tickers' => $basketTickers,
            'detailed_basket_stocks' => $detailedBasketStocks,
            'global_timeframe' => [
                'min_date' => $minDate,
                'max_date' => $maxDate,
            ],
            'recent_optimizations' => $recentOptimizations,
        ]);
    }

    /**
     * Add or update a stock in the user's database basket.
     */
    public function addToBasket(Request $request)
    {
        $validated = $request->validate([
            'ticker' => 'required|string',
            'timeframe' => 'nullable|array',
            'timeframe.start' => 'nullable|string',
            'timeframe.end' => 'nullable|string',
            'timeframe.lookback_start' => 'nullable|string',
            'timeframe.preset' => 'nullable|string',
            'benchmark' => 'nullable|string',
            'metrics' => 'nullable|array',
            'prices' => 'nullable|array',
        ]);

        $ticker = $validated['ticker'];
        $cleanTicker = str_replace('.JK', '', $ticker);

        $stock = Stock::where('ticker', $ticker)
            ->orWhere('ticker', $cleanTicker)
            ->orWhere('ticker', $cleanTicker . '.JK')
            ->first();

        if (!$stock) {
            return back()->withErrors(['ticker' => "Saham {$ticker} tidak ditemukan."]);
        }

        $timeframe = $validated['timeframe'] ?? [];

        UserBasket::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'stock_id' => $stock->id,
            ],
            [
                'timeframe_start' => !empty($timeframe['start']) ? substr($timeframe['start'], 0, 10) : null,
                'timeframe_end' => !empty($timeframe['end']) ? substr($timeframe['end'], 0, 10) : null,
                'timeframe_lookback_start' => !empty($timeframe['lookback_start']) ? substr($timeframe['lookback_start'], 0, 10) : null,
                'timeframe_preset' => $timeframe['preset'] ?? null,
                'benchmark' => $validated['benchmark'] ?? null,
                'metrics' => $validated['metrics'] ?? null,
                'prices' => $validated['prices'] ?? null,
            ]
        );

        return back()->with('success', "Saham {$cleanTicker} berhasil disimpan di keranjang.");
    }

    /**
     * Remove a stock from the user's database basket.
     */
    public function removeFromBasket($ticker)
    {
        $cleanTicker = str_replace('.JK', '', $ticker);

        $stock = Stock::where('ticker', $ticker)
            ->orWhere('ticker', $cleanTicker)
            ->orWhere('ticker', $cleanTicker . '.JK')
            ->first();

        if ($stock) {
            UserBasket::where('user_id', Auth::id())
                ->where('stock_id', $stock->id)
                ->delete();
        }

        return back()->with('success', "Saham {$cleanTicker} berhasil dihapus dari keranjang.");
    }

    /**
     * Clear all stocks from the user's database basket.
     */
    public function clearBasket()
    {
        UserBasket::where('user_id', Auth::id())->delete();

        return back()->with('success', "Seluruh saham di keranjang berhasil dihapus.");
    }

    /**
     * Bulk update timeframe (preset or custom date range) for all stocks in the user's basket.
     */
    public function bulkUpdateTimeframe(Request $request)
    {
        $validated = $request->validate([
            'preset' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $preset = $validated['preset'] ?? null;
        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        $userId = Auth::id();
        $basketItems = UserBasket::where('user_id', $userId)->with('stock')->get();

        if ($basketItems->isEmpty()) {
            return back()->with('info', 'Keranjang masih kosong.');
        }

        foreach ($basketItems as $basketItem) {
            $stock = $basketItem->stock;
            if (!$stock) {
                continue;
            }

            $analysis = StockController::calculateHistoricalAnalysis($stock, $preset, $startDate, $endDate);

            $basketItem->update([
                'timeframe_start' => $analysis['timeframe']['horizon_start_date'] ?? $analysis['timeframe']['start_date'],
                'timeframe_end' => $analysis['timeframe']['end_date'],
                'timeframe_lookback_start' => $analysis['timeframe']['start_date'],
                'timeframe_preset' => $preset,
                'metrics' => $analysis['metrics'],
                'prices' => $analysis['prices'],
            ]);
        }

        $label = $preset ? ($preset === 'all' ? 'All' : strtoupper($preset)) : 'kustom';
        return back()->with('success', "Seluruh saham di keranjang berhasil diperbarui ke horison {$label}.");
    }

    /**
     * Execute portfolio optimization via Python engine and save to database.
     */
    public function optimize(Request $request)
    {
        $validated = $request->validate([
            'tickers' => 'required|array|min:2',
            'tickers.*' => 'required|string',
            'initial_capital' => 'nullable|numeric|min:100000',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'horizon_preset' => 'nullable|string',
            'risk_free_rate' => 'nullable|numeric',
            'nsga_params' => 'nullable|array',
        ]);

        $tickers = $validated['tickers'];
        $initialCapital = (float) ($validated['initial_capital'] ?? 10000000);
        $riskFreeRate = (float) ($validated['risk_free_rate'] ?? 6.0);
        $nsgaParams = $validated['nsga_params'] ?? [
            'population_size' => 200,
            'generations' => 100,
            'crossover_rate' => 0.9,
            'mutation_rate' => 0.1,
        ];

        // Fetch stocks
        $stocks = Stock::whereIn('ticker', $tickers)
            ->orWhereIn('ticker', array_map(fn($t) => str_replace('.JK', '', $t), $tickers))
            ->with(['latestPrice'])
            ->get();

        if ($stocks->count() < 2) {
            return back()->withErrors(['tickers' => 'Minimal 2 saham yang valid diperlukan untuk optimasi.']);
        }

        // Fetch historical prices aligned within date range
        $stockIds = $stocks->pluck('id');
        $priceQuery = StockPrice::whereIn('stock_id', $stockIds);

        if (!empty($validated['start_date'])) {
            $priceQuery->where('date', '>=', $validated['start_date']);
        }
        if (!empty($validated['end_date'])) {
            $priceQuery->where('date', '<=', $validated['end_date']);
        }

        $allPrices = $priceQuery->orderBy('date', 'asc')->get();

        // Build price matrix by ticker and date
        $stockMap = $stocks->keyBy('id');
        $pricesDict = [];
        foreach ($stocks as $s) {
            $pricesDict[$s->ticker] = [];
        }

        foreach ($allPrices as $p) {
            $stk = $stockMap->get($p->stock_id);
            if ($stk) {
                $dateKey = is_string($p->date) ? substr($p->date, 0, 10) : $p->date->format('Y-m-d');
                $pricesDict[$stk->ticker][$dateKey] = (float) $p->close_price;
            }
        }

        $payload = [
            'tickers' => $stocks->pluck('ticker')->values()->toArray(),
            'initial_capital' => $initialCapital,
            'risk_free_rate' => $riskFreeRate,
            'nsga_params' => $nsgaParams,
            'prices' => $pricesDict,
        ];

        // Eksekusi kalkulasi model Python dengan multi-tier fallback (proc_open -> exec -> shell_exec -> WSGI API)
        $scriptPath = env('PYTHON_SCRIPT_PATH', base_path('model/optimize_portfolio.py'));
        $pythonBinary = env('PYTHON_PATH', 'python');

        try {
            $result = $this->executeOptimization($payload, $pythonBinary, $scriptPath);

            if (!$result || ($result['status'] ?? '') !== 'success') {
                $errMsg = $result['message'] ?? 'Gagal memproses kalkulasi optimasi.';
                return back()->withErrors(['optimization' => $errMsg]);
            }

            // Normalisasi best_portfolios untuk frontend & database
            $bestPortfolios = $result['best_portfolios'] ?? [];
            $latestPriceByTicker = [];
            foreach ($stocks as $s) {
                $clean = str_replace('.JK', '', $s->ticker);
                $price = $s->latestPrice ? (float) $s->latestPrice->close_price : 0;
                $latestPriceByTicker[$s->ticker] = $price;
                $latestPriceByTicker[$clean] = $price;
            }

            foreach ($bestPortfolios as $profileKey => &$profileData) {
                $weights = $profileData['weights'] ?? [];
                $weightsPercent = [];
                $allocationIdr = [];
                $lotEstimation = [];

                foreach ($weights as $t => $w) {
                    $clean = str_replace('.JK', '', $t);
                    $wVal = (float) $w;
                    $percent = $wVal <= 1.0 ? round($wVal * 100, 2) : round($wVal, 2);
                    $nominal = round(($percent / 100) * $initialCapital, 2);

                    $weightsPercent[$t] = $percent;
                    $weightsPercent[$clean] = $percent;
                    $allocationIdr[$t] = $nominal;
                    $allocationIdr[$clean] = $nominal;

                    $pClose = $latestPriceByTicker[$t] ?? ($latestPriceByTicker[$clean] ?? 0);
                    $lot = $pClose > 0 ? (int) floor($nominal / ($pClose * 100)) : 0;
                    $lotEstimation[$t] = $lot;
                    $lotEstimation[$clean] = $lot;
                }

                $profileData['weights'] = $weightsPercent;
                $profileData['allocation_idr'] = $allocationIdr;
                $profileData['lot_estimation'] = $lotEstimation;
            }
            unset($profileData);

            $cleanTickers = $stocks->pluck('ticker')->map(fn($t) => str_replace('.JK', '', $t))->values()->toArray();
            $title = 'Optimasi ' . implode(', ', $cleanTickers) . ' (' . now()->format('d/m/Y H:i') . ')';

            // Simpan permanen ke database dengan user_id user yang sedang login
            $optimization = PortfolioOptimization::create([
                'user_id' => Auth::id(),
                'title' => $title,
                'initial_capital' => $initialCapital,
                'risk_free_rate' => $riskFreeRate,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'horizon_preset' => $validated['horizon_preset'] ?? null,
                'tickers' => $stocks->pluck('ticker')->values()->toArray(),
                'nsga_params' => $nsgaParams,
                'best_portfolios' => $bestPortfolios,
                'efficient_frontier' => $result['efficient_frontier'] ?? [],
                'nsga_samples' => $result['nsga_pareto_samples'] ?? [],
                'quantile_analysis' => $result['quantile_analysis'] ?? [],
                'individual_assets' => $result['individual_assets'] ?? [],
            ]);

            return redirect()->route('user.analyze.result', ['id' => $optimization->id]);
        } catch (\Throwable $e) {
            Log::error('Portfolio Optimization Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withErrors(['optimization' => 'Terjadi kesalahan saat menjalankan kalkulasi model: ' . $e->getMessage()]);
        }
    }

    /**
     * Jalankan optimasi portofolio via HTTP WSGI Microservice (PythonAnywhere).
     */
    protected function executeOptimization(array $payload, string $pythonBinary, string $scriptPath): array
    {
        // Menggunakan URL PythonAnywhere yang sudah kita deploy sebelumnya
        $wsgiUrl = env('PYTHON_API_URL', 'https://ryanditata.pythonanywhere.com/optimize');
        
        $allErrors = [];

        try {
            $httpResponse = Http::timeout(600)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($wsgiUrl, $payload);

            if ($httpResponse->successful()) {
                $decoded = $httpResponse->json();
                if (is_array($decoded) && isset($decoded['status'])) {
                    return $decoded;
                }
                $allErrors[] = 'API response format invalid (missing status)';
            } else {
                $allErrors[] = 'HTTP Response ' . $httpResponse->status() . ': ' . substr($httpResponse->body(), 0, 200);
            }
        } catch (\Throwable $e) {
            $allErrors[] = 'HTTP Error: ' . $e->getMessage();
        }

        $errorSummary = implode(' | ', $allErrors);
        Log::error('Portfolio Optimization Execution Failure: ' . $errorSummary);

        throw new \RuntimeException(
            'Gagal menjalankan kalkulasi portofolio. Rincian: ' . $errorSummary
        );
    }

    /**
     * Display the optimization result page by ID or latest record.
     */
    public function result(Request $request, $id = null)
    {
        $userId = Auth::id();

        if ($id) {
            $optimization = PortfolioOptimization::where('user_id', $userId)->findOrFail($id);
        } else {
            $optimization = PortfolioOptimization::where('user_id', $userId)->latest()->first();
        }

        if (!$optimization) {
            return redirect()->route('user.analyze.keranjang')->with('error', 'Belum ada hasil analisis portofolio. Silakan jalankan optimasi terlebih dahulu.');
        }

        $tickers = $optimization->tickers ?? [];
        $cleanTickers = array_map(fn($t) => str_replace('.JK', '', $t), $tickers);

        $stocks = Stock::whereIn('ticker', $tickers)
            ->orWhereIn('ticker', $cleanTickers)
            ->with(['latestPrice'])
            ->get();

        $stocksMap = [];
        foreach ($stocks as $s) {
            $stocksMap[$s->ticker] = $s;
            $stocksMap[str_replace('.JK', '', $s->ticker)] = $s;
        }

        $recentHistory = PortfolioOptimization::where('user_id', $userId)
            ->latest()
            ->take(5)
            ->get(['id', 'user_id', 'title', 'initial_capital', 'created_at'])
            ->toArray();

        return Inertia::render(DeviceViewResolver::resolve('user/analyze/result', $request), [
            'optimization' => $optimization,
            'stocks' => $stocksMap,
            'history' => $recentHistory,
        ]);
    }

    /**
     * Display the user's saved optimization history list.
     */
    public function history(Request $request)
    {
        $history = PortfolioOptimization::where('user_id', Auth::id())
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render(DeviceViewResolver::resolve('user/analyze/history', $request), [
            'history' => $history,
        ]);
    }

    /**
     * Update a saved optimization history record (e.g. title / deskripsi).
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $optimization = PortfolioOptimization::where('user_id', Auth::id())->findOrFail($id);
        $optimization->update([
            'title' => $validated['title'],
        ]);

        return redirect()->route('user.analyze.history')->with('success', 'Judul portofolio berhasil diperbarui.');
    }

    /**
     * Delete a saved optimization history record.
     */
    public function destroy($id)
    {
        $optimization = PortfolioOptimization::where('user_id', Auth::id())->findOrFail($id);
        $optimization->delete();

        return redirect()->route('user.analyze.history')->with('success', 'Riwayat optimasi portofolio berhasil dihapus.');
    }

    /**
     * Generate or retrieve public share link for a portfolio optimization.
     */
    public function generateShareLink(Request $request, $id)
    {
        $optimization = PortfolioOptimization::where('user_id', Auth::id())->findOrFail($id);
        $token = $optimization->generateShareToken();
        $shareUrl = route('shared.portfolio', ['token' => $token]);

        return response()->json([
            'success' => true,
            'token' => $token,
            'url' => $shareUrl,
        ]);
    }

    /**
     * Display a shared portfolio publicly (No Authentication Required).
     */
    public function showSharedPortfolio(Request $request, $token)
    {
        $optimization = PortfolioOptimization::where('share_token', $token)->firstOrFail();

        $tickers = $optimization->tickers ?? [];
        $cleanTickers = array_map(fn($t) => str_replace('.JK', '', $t), $tickers);

        $stocks = Stock::whereIn('ticker', $tickers)
            ->orWhereIn('ticker', $cleanTickers)
            ->with(['latestPrice'])
            ->get();

        $stocksMap = [];
        foreach ($stocks as $s) {
            $stocksMap[$s->ticker] = $s;
            $stocksMap[str_replace('.JK', '', $s->ticker)] = $s;
        }

        return Inertia::render('user/analyze/result', [
            'optimization' => $optimization,
            'stocks' => $stocksMap,
            'history' => [],
            'isPublic' => true,
            'shareUrl' => route('shared.portfolio', ['token' => $token]),
        ]);
    }
}
