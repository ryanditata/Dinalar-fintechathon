<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioOptimization;
use App\Models\Stock;
use App\Models\StockPrice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $statistics = [
            'online_users_count' => User::where('last_seen_at', '>=', now()->subMinutes(5))->count(),
            'today_optimizations_count' => PortfolioOptimization::whereDate('created_at', today())->count(),
            'total_optimizations_count' => PortfolioOptimization::count(),
            'total_stocks' => Stock::count(),
            'total_prices' => StockPrice::count(),
            'idx_conventional_count' => Stock::where('bursa', 'IDX')
                ->orWhere('bursa', 'IDX Conventional')
                ->count(),
            'nyse_count' => Stock::where('bursa', 'NYSE')
                ->orWhere('bursa', 'New York Stock Exchange')
                ->count(),
            'jii_count' => Stock::where('bursa', 'NYSE')
                ->orWhere('bursa', 'New York Stock Exchange')
                ->count(),
            'active_stocks_count' => Stock::where('is_active', true)->count(),
            'last_price_date' => StockPrice::max('date') ?: (StockPrice::max('created_at') ?: now()->toDateString()),
        ];

        $recentStocks = Stock::with('latestPrice')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        $stockIds = $recentStocks->pluck('id');
        $pricesByStock = StockPrice::whereIn('stock_id', $stockIds)
            ->orderBy('date', 'desc')
            ->get()
            ->groupBy('stock_id');

        $recentStocks->transform(function ($stock) use ($pricesByStock) {
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

        // Month and Year filtering for Optimization Trend Chart
        $inputMonth = $request->input('month');
        $inputYear = $request->input('year');

        // Default to latest optimization date or current date
        $latestOptDate = PortfolioOptimization::latest('created_at')->value('created_at');
        $defaultDate = $latestOptDate ? Carbon::parse($latestOptDate) : now();

        $targetYear = (int) $defaultDate->year;
        $targetMonth = (int) $defaultDate->month;

        if ($inputMonth) {
            if (preg_match('/^(\d{4})-(\d{1,2})$/', $inputMonth, $matches)) {
                $targetYear = (int) $matches[1];
                $targetMonth = (int) $matches[2];
            } elseif (is_numeric($inputMonth) && (int) $inputMonth >= 1 && (int) $inputMonth <= 12) {
                $targetMonth = (int) $inputMonth;
            }
        }

        if ($inputYear && is_numeric($inputYear) && (int) $inputYear >= 2000 && (int) $inputYear <= 2100) {
            $targetYear = (int) $inputYear;
        }

        $targetMonth = max(1, min(12, $targetMonth));
        $targetDate = Carbon::create($targetYear, $targetMonth, 1)->locale('id')->startOfMonth();
        $daysInMonth = $targetDate->daysInMonth;

        // Fetch daily counts efficiently in one query
        $countsByDay = PortfolioOptimization::whereYear('created_at', $targetYear)
            ->whereMonth('created_at', $targetMonth)
            ->selectRaw('DAY(created_at) as day_num, count(*) as count')
            ->groupBy('day_num')
            ->pluck('count', 'day_num');

        $trendDays = collect(range(1, $daysInMonth))->map(function ($day) use ($targetDate, $countsByDay) {
            $currentDate = $targetDate->copy()->day($day)->locale('id');
            $dateStr = $currentDate->toDateString();
            $count = (int) ($countsByDay->get($day) ?? 0);
            return [
                'date' => $dateStr,
                'day' => $day,
                'label' => $currentDate->translatedFormat('d M'),
                'count' => $count,
            ];
        });

        $optimizationTrendPrices = $trendDays->pluck('count')->map(fn($v) => (float) $v)->toArray();
        $selectedMonthTotal = $trendDays->sum('count');
        $selectedMonthAvg = $daysInMonth > 0 ? round($selectedMonthTotal / $daysInMonth, 1) : 0;
        $selectedMonthPeak = $trendDays->max('count') ?? 0;

        // Month names in Indonesian
        $monthsName = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        // Available years (distinct years in DB + current year +- 2)
        $dbYears = PortfolioOptimization::selectRaw('DISTINCT YEAR(created_at) as yr')
            ->pluck('yr')
            ->filter()
            ->map(fn($y) => (int) $y);

        $currentYear = (int) now()->year;
        $yearsList = $dbYears->push($currentYear)
            ->push($targetYear)
            ->push($currentYear - 1)
            ->push($currentYear - 2)
            ->unique()
            ->sortDesc()
            ->values();

        // Build unified list of month-year options (e.g. "Agustus 2026", "Juli 2026", ...)
        $availableMonths = [];
        foreach ($yearsList as $yr) {
            for ($m = 12; $m >= 1; $m--) {
                $mKey = sprintf('%04d-%02d', $yr, $m);
                $availableMonths[] = [
                    'value' => $mKey,
                    'label' => $monthsName[$m] . ' ' . $yr,
                    'year' => (string) $yr,
                    'month' => sprintf('%02d', $m),
                ];
            }
        }

        $recentOptimizations = PortfolioOptimization::with(['user'])
            ->latest()
            ->take(6)
            ->get();

        $weekOptimizationsCount = PortfolioOptimization::where('created_at', '>=', now()->subDays(7))->count();
        $monthOptimizationsCount = PortfolioOptimization::where('created_at', '>=', now()->subDays(30))->count();

        $statistics['week_optimizations_count'] = $weekOptimizationsCount;
        $statistics['month_optimizations_count'] = $monthOptimizationsCount;

        $selectedMonthKey = sprintf('%04d-%02d', $targetYear, $targetMonth);

        return Inertia::render('admin/dashboard/index', [
            'statistics' => $statistics,
            'recentStocks' => $recentStocks,
            'selectedMonth' => $selectedMonthKey,
            'selectedMonthLabel' => $targetDate->translatedFormat('F Y'),
            'selectedMonthTotal' => $selectedMonthTotal,
            'selectedMonthAvg' => $selectedMonthAvg,
            'selectedMonthPeak' => $selectedMonthPeak,
            'availableMonths' => $availableMonths,
            'optimizationTrendPrices' => $optimizationTrendPrices,
            'optimizationTrendDays' => $trendDays,
            'recentOptimizations' => $recentOptimizations,
        ]);
    }
}
