<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBasket extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'user_baskets';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'stock_id',
        'timeframe_start',
        'timeframe_end',
        'timeframe_lookback_start',
        'timeframe_preset',
        'benchmark',
        'metrics',
        'prices',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'timeframe_start' => 'date:Y-m-d',
            'timeframe_end' => 'date:Y-m-d',
            'timeframe_lookback_start' => 'date:Y-m-d',
            'metrics' => 'array',
            'prices' => 'array',
        ];
    }

    /**
     * The user who owns this basket entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The stock associated with this basket entry.
     */
    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }
}
