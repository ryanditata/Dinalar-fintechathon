<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\PortfolioOptimization;
use App\Models\Stock;
use App\Models\StockPrice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();

        // 1. Fetch active stocks with calculated change and recent prices for sparkline
        $stocks = Stock::where('is_active', true)
            ->with(['latestPrice'])
            ->withCount('prices')
            ->orderBy('ticker', 'asc')
            ->get();

        $stockIds = $stocks->pluck('id');
        if ($stockIds->isNotEmpty()) {
            // Optimasi RAM: Hanya ambil maksimal 30 data harga terakhir per saham menggunakan window function
            $recentPrices = DB::select("
                SELECT stock_id, date, close_price 
                FROM (
                    SELECT stock_id, date, close_price,
                           ROW_NUMBER() OVER (PARTITION BY stock_id ORDER BY date DESC) as rn
                    FROM stock_prices
                    WHERE stock_id IN (" . $stockIds->implode(',') . ")
                ) ranked
                WHERE rn <= 30
                ORDER BY date DESC
            ");
            $pricesByStock = collect($recentPrices)->groupBy('stock_id');
        } else {
            $pricesByStock = collect();
        }

        // 2. Compute ticker analysis frequency from PortfolioOptimization
        $tickerAnalysisCounts = [];
        $allTickerArrays = PortfolioOptimization::pluck('tickers');
        foreach ($allTickerArrays as $tickerArray) {
            if (is_array($tickerArray)) {
                foreach ($tickerArray as $rawTicker) {
                    $cleanTicker = str_replace('.JK', '', strtoupper(trim($rawTicker)));
                    $tickerAnalysisCounts[$cleanTicker] = ($tickerAnalysisCounts[$cleanTicker] ?? 0) + 1;
                    $tickerAnalysisCounts[$rawTicker] = ($tickerAnalysisCounts[$rawTicker] ?? 0) + 1;
                }
            }
        }

        $stocks->transform(function ($stock) use ($pricesByStock, $tickerAnalysisCounts) {
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

            $cleanTicker = str_replace('.JK', '', strtoupper($stock->ticker));
            $stock->analysis_count = $tickerAnalysisCounts[$cleanTicker] ?? $tickerAnalysisCounts[$stock->ticker] ?? 0;
            $stock->change = $change;
            $stock->change_percent = $changePercent !== null ? round($changePercent, 2) : null;
            $stock->recent_prices = $prices->take(30)->pluck('close_price')->reverse()->values();

            return $stock;
        });

        // Top popular stocks / Saham Pilihan: Urutkan berdasarkan saham yang paling sering dianalisis (analysis_count DESC), lalu change_percent DESC
        $popularStocks = $stocks->sort(function ($a, $b) {
            $countA = $a->analysis_count ?? 0;
            $countB = $b->analysis_count ?? 0;
            if ($countA !== $countB) {
                return $countB <=> $countA; // Paling sering dianalisis di posisi teratas
            }
            return ($b->change_percent ?? 0) <=> ($a->change_percent ?? 0);
        })->take(12)->values();

        // Top Gainers & Losers
        $stocksWithChange = $stocks->filter(fn($s) => $s->change_percent !== null);
        $topGainers = $stocksWithChange->sortByDesc('change_percent')->take(12)->values();
        $topLosers = $stocksWithChange->sortBy('change_percent')->take(12)->values();

        // 2. Fetch Recent Optimizations for logged-in user
        $recentOptimizations = PortfolioOptimization::where('user_id', $userId)
            ->latest()
            ->take(5)
            ->get();

        // Total Counts
        $totalUserOptimizations = PortfolioOptimization::where('user_id', $userId)->count();
        $totalStocksCount = $stocks->count();
        $latestPortfolio = $recentOptimizations->first();

        $lastUpdated = StockPrice::max('created_at') ?: now()->toDateTimeString();

        return Inertia::render('user/dashboard/index', [
            'popular_stocks' => $popularStocks,
            'top_gainers' => $topGainers,
            'top_losers' => $topLosers,
            'recent_optimizations' => $recentOptimizations,
            'latest_portfolio' => $latestPortfolio,
            'total_user_optimizations' => $totalUserOptimizations,
            'total_stocks_count' => $totalStocksCount,
            'risk_free_rate' => 6.0,
            'last_updated' => $lastUpdated,
        ]);
    }
}
