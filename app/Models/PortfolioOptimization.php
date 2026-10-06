<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioOptimization extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'share_token',
        'title',
        'initial_capital',
        'risk_free_rate',
        'start_date',
        'end_date',
        'horizon_preset',
        'tickers',
        'nsga_params',
        'best_portfolios',
        'efficient_frontier',
        'nsga_samples',
        'quantile_analysis',
        'individual_assets',
    ];

    protected $casts = [
        'initial_capital' => 'float',
        'risk_free_rate' => 'float',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'tickers' => 'array',
        'nsga_params' => 'array',
        'best_portfolios' => 'array',
        'efficient_frontier' => 'array',
        'nsga_samples' => 'array',
        'quantile_analysis' => 'array',
        'individual_assets' => 'array',
    ];

    protected $appends = [
        'reference_code',
    ];

    /**
     * Get the formatted professional reference code (e.g. DNL3-1).
     */
    public function getReferenceCodeAttribute(): string
    {
        return 'DNL' . $this->user_id . '-' . $this->id;
    }

    /**
     * Generate or retrieve unique share token for public sharing.
     */
    public function generateShareToken(): string
    {
        if (empty($this->share_token)) {
            $this->share_token = \Illuminate\Support\Str::random(24);
            $this->save();
        }

        return $this->share_token;
    }

    /**
     * User who owns this portfolio optimization.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
