<?php
// app/Models/PurchaseItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'unit_price',
        'selling_price',
        'total_price'
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'total_price' => 'decimal:2'
    ];

    protected $appends = [
        'expected_profit',
        'expected_profit_percentage'
    ];

    /**
     * پەیوەندییەکان
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     |----------------------------------------------------------------------
     | Attributes
     |----------------------------------------------------------------------
     */
    public function getExpectedProfitAttribute(): float
    {
        return ($this->selling_price - $this->unit_price) * $this->quantity;
    }

    public function getExpectedProfitPercentageAttribute(): float
    {
        if ($this->total_price == 0) {
            return 0;
        }
        return ($this->expected_profit / $this->total_price) * 100;
    }
}
