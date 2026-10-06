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
        Schema::create('user_baskets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->date('timeframe_start')->nullable();
            $table->date('timeframe_end')->nullable();
            $table->date('timeframe_lookback_start')->nullable();
            $table->string('timeframe_preset', 20)->nullable();
            $table->string('benchmark', 50)->nullable();
            $table->json('metrics')->nullable();
            $table->json('prices')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'stock_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_baskets');
    }
};
