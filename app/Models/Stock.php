<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Stock extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'ticker',
        'name',
        'bursa',
        'sector',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get all price records for the stock.
     */
    public function prices(): HasMany
    {
        return $this->hasMany(StockPrice::class);
    }

    /**
     * Get the latest price record for the stock.
     */
    public function latestPrice(): HasOne
    {
        return $this->hasOne(StockPrice::class)->latestOfMany('date');
    }

    /**
     * Get user baskets containing this stock.
     */
    public function userBaskets(): HasMany
    {
        return $this->hasMany(UserBasket::class);
    }
}
