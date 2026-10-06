<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jadwalkan pengambilan harga harian saham setiap hari bursa (Senin-Jumat) pukul 17:00 WIB (setelah bursa IDX tutup)
Schedule::command('stocks:fetch-daily')
    ->weekdays()
    ->at('17:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/stocks_fetch_daily.log'));
