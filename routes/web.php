<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OptimizationHistoryController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\StockScraperController;
use App\Http\Controllers\Admin\UserController as AdminUserController;

use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\StockController as UserStockController;
use App\Http\Controllers\User\PortfolioController as UserPortfolioController;
use App\Http\Controllers\User\UserDashboardController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

Route::get('/', [UserController::class, 'index'])->name('home');

Route::get('dashboard', function (Request $request) {
    if ($request->user() && $request->user()->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('user.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::prefix('admin')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    Route::get('users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::post('users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::patch('users/{user}/role', [AdminUserController::class, 'updateRole'])->name('admin.users.updateRole');
    Route::delete('users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');

    Route::get('saham', [StockController::class, 'index'])->name('admin.saham.index');
    Route::post('saham', [StockController::class, 'store'])->name('admin.saham.store');
    Route::post('saham/import', [StockController::class, 'import'])->name('admin.saham.import');
    Route::get('saham/{stock}/prices', [StockController::class, 'prices'])->name('admin.saham.prices');
    Route::put('saham/{stock}', [StockController::class, 'update'])->name('admin.saham.update');
    Route::patch('saham/{stock}/toggle-active', [StockController::class, 'toggleActive'])->name('admin.saham.toggleActive');
    Route::delete('saham/{stock}', [StockController::class, 'destroy'])->name('admin.saham.destroy');

    Route::get('scraper', [StockScraperController::class, 'index'])->name('admin.scraper.index');
    Route::post('scraper/export', [StockScraperController::class, 'export'])->name('admin.scraper.export');

    Route::get('history', [OptimizationHistoryController::class, 'index'])->name('admin.history.index');
    Route::get('history/export', [OptimizationHistoryController::class, 'exportExcel'])->name('admin.history.export');
    Route::delete('history/{id}', [OptimizationHistoryController::class, 'destroy'])->name('admin.history.destroy');
});

Route::prefix('user')->middleware(['auth', 'verified', 'role:user'])->group(function () {
    Route::get('dashboard', [UserDashboardController::class, 'index'])->name('user.dashboard');

    Route::get('saham', [UserStockController::class, 'index'])->name('user.saham');
    Route::get('saham/{ticker}/historical', [UserStockController::class, 'getHistoricalData'])->name('user.saham.historical');
    Route::get('saham/{ticker}', [UserStockController::class, 'show'])->name('user.saham.show');

    Route::get('analyze/keranjang', [UserPortfolioController::class, 'setup'])->name('user.analyze.keranjang');
    Route::post('analyze/basket', [UserPortfolioController::class, 'addToBasket'])->name('user.analyze.basket.add');
    Route::post('analyze/basket/timeframe', [UserPortfolioController::class, 'bulkUpdateTimeframe'])->name('user.analyze.basket.timeframe');
    Route::delete('analyze/basket/{ticker}', [UserPortfolioController::class, 'removeFromBasket'])->name('user.analyze.basket.remove');
    Route::delete('analyze/basket', [UserPortfolioController::class, 'clearBasket'])->name('user.analyze.basket.clear');
    Route::post('analyze/optimize', [UserPortfolioController::class, 'optimize'])->name('user.analyze.optimize');
    Route::get('analyze/result/{id?}', [UserPortfolioController::class, 'result'])->name('user.analyze.result');
    Route::post('analyze/share/{id}', [UserPortfolioController::class, 'generateShareLink'])->name('user.analyze.share');
    Route::get('analyze/history', [UserPortfolioController::class, 'history'])->name('user.analyze.history');
    Route::get('analyze/history/{id}', [UserPortfolioController::class, 'result'])->name('user.analyze.history.show');
    Route::put('analyze/history/{id}', [UserPortfolioController::class, 'update'])->name('user.analyze.history.update');
    Route::delete('analyze/history/{id}', [UserPortfolioController::class, 'destroy'])->name('user.analyze.history.destroy');
});

// PUBLIC SHARED PORTFOLIO ROUTE
Route::get('shared/portfolio/{token}', [UserPortfolioController::class, 'showSharedPortfolio'])->name('shared.portfolio');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

// 404 FALLBACK ROUTE
Route::fallback(function () {
    return Inertia::render('errors/404');
});

// FETCH DAILY DATA SAHAM
Route::get('/run-stocks-cron', function () {
    try {
        Artisan::call('stocks:fetch-daily');
        return 'Cron stock fetch executed successfully!';
    } catch (\Throwable $e) {
        return 'Error: ' . $e->getMessage();
    }
});