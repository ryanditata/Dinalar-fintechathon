<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('portfolio_optimizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->decimal('initial_capital', 15, 2)->default(10000000);
            $table->decimal('risk_free_rate', 5, 2)->default(6.0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->json('tickers');
            $table->json('nsga_params')->nullable();
            $table->json('best_portfolios');
            $table->json('efficient_frontier')->nullable();
            $table->json('nsga_samples')->nullable();
            $table->json('quantile_analysis')->nullable();
            $table->json('individual_assets')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_optimizations');
    }
};
