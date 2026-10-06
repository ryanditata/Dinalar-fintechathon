<?php

namespace App\Console\Commands;

use App\Models\Stock;
use App\Models\StockPrice;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchDailyStockPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stocks:fetch-daily 
                            {--ticker= : Specific stock ticker to fetch (e.g. BBCA.JK)}
                            {--bursa= : Filter stocks by bursa (e.g. IDX, NYSE)}
                            {--range=5d : Yahoo finance range (1d, 5d, 1mo)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch latest daily closing stock prices from Yahoo Finance for active stocks';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tickerOption = $this->option('ticker');
        $bursaOption = $this->option('bursa');
        $range = $this->option('range') ?: '5d';

        $query = Stock::query()->where('is_active', true);

        if ($tickerOption) {
            $query->where('ticker', strtoupper(trim($tickerOption)));
        }

        if ($bursaOption && strtolower($bursaOption) !== 'all') {
            $query->where('bursa', strtoupper(trim($bursaOption)));
        }

        $stocks = $query->get();

        if ($stocks->isEmpty()) {
            $this->warn('Tidak ada saham aktif yang ditemukan untuk di-scrape.');
            return self::SUCCESS;
        }

        $this->info("Memulai pengambilan data harga harian untuk {$stocks->count()} emiten saham...");
        $this->output->progressStart($stocks->count());

        $successCount = 0;
        $failedCount = 0;

        foreach ($stocks as $stock) {
            try {
                $ticker = $stock->ticker;
                if (($stock->bursa === 'IDX' || empty($stock->bursa)) && !str_contains($ticker, '.')) {
                    $ticker .= '.JK';
                }

                $url = "https://query1.finance.yahoo.com/v8/finance/chart/{$ticker}?interval=1d&range={$range}";

                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'application/json',
                ])->timeout(10)->get($url);

                if (!$response->successful()) {
                    $this->newLine();
                    $this->error("Gagal mengambil data untuk {$stock->ticker}: HTTP {$response->status()}");
                    Log::warning("Yahoo Finance HTTP error for {$stock->ticker}: {$response->status()}");
                    $failedCount++;
                    $this->output->progressAdvance();
                    continue;
                }

                $data = $response->json();
                $result = $data['chart']['result'][0] ?? null;

                if (!$result) {
                    $this->newLine();
                    $this->warn("Data kosong untuk {$stock->ticker}");
                    $failedCount++;
                    $this->output->progressAdvance();
                    continue;
                }

                $timestamps = $result['timestamp'] ?? [];
                $quotes = $result['indicators']['quote'][0]['close'] ?? [];

                if (empty($timestamps) || empty($quotes)) {
                    $this->newLine();
                    $this->warn("Tidak ada record harga untuk {$stock->ticker}");
                    $failedCount++;
                    $this->output->progressAdvance();
                    continue;
                }

                $savedAny = false;
                // Loop backwards or through all returned daily quotes
                for ($i = 0; $i < count($timestamps); $i++) {
                    $timestamp = $timestamps[$i] ?? null;
                    $closeVal = $quotes[$i] ?? null;

                    if ($timestamp === null || $closeVal === null || !is_numeric($closeVal)) {
                        continue;
                    }

                    $closePrice = round((float)$closeVal, 2);
                    if ($closePrice <= 0) {
                        continue;
                    }

                    $date = Carbon::createFromTimestamp($timestamp, 'Asia/Jakarta')->format('Y-m-d');

                    StockPrice::updateOrCreate(
                        [
                            'stock_id' => $stock->id,
                            'date' => $date,
                        ],
                        [
                            'close_price' => $closePrice,
                        ]
                    );

                    $savedAny = true;
                }

                if ($savedAny) {
                    $successCount++;
                } else {
                    $failedCount++;
                }

                // Friendly rate-limiting pause
                usleep(150000); // 150ms
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("Error saat memproses {$stock->ticker}: {$e->getMessage()}");
                Log::error("Scraper error for {$stock->ticker}: " . $e->getMessage());
                $failedCount++;
            }

            $this->output->progressAdvance();
        }

        $this->output->progressFinish();
        $this->newLine();

        $this->info("Proses selesai! Berhasil: {$successCount} emiten | Gagal/Dilewati: {$failedCount} emiten.");
        Log::info("Daily stock scraper completed: {$successCount} succeeded, {$failedCount} failed.");

        return self::SUCCESS;
    }
}
