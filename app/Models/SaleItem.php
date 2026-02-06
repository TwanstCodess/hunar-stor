<?php
// app/Models/SaleItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'total_price',
        'note',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2'
    ];

    /**
     * پەیوەندییەکان
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Accessor بۆ وەرگرتنی بڕی quantity وەک float
     */
    public function getQuantityAttribute($value)
    {
        return (float) $value;
    }

    /**
     * Helper Methods
     */
    public function getProfitAttribute(): float
    {
        $purchasePrice = $this->product->getPurchasePrice($this->sale->currency);
        return ($this->unit_price - $purchasePrice) * $this->quantity;
    }

    public function getProfitPercentageAttribute(): float
    {
        if ($this->total_price == 0) {
            return 0;
        }

        return ($this->profit / $this->total_price) * 100;
    }

    /**
     * بڕی فرۆشراو بە یەکەی بنەڕەت
     */
    public function getQuantityInBaseUnitAttribute(): float
    {
        return $this->product->convertSaleToBase($this->quantity);
    }

    /**
     * فۆرماتکردنی نرخی یەکە
     */
    public function getFormattedUnitPriceAttribute(): string
    {
        return number_format($this->unit_price, 2) . ' ' . $this->sale->currency;
    }

    /**
     * فۆرماتکردنی کۆی نرخ
     */
    public function getFormattedTotalPriceAttribute(): string
    {
        return number_format($this->total_price, 2) . ' ' . $this->sale->currency;
    }

    /**
     * گەڕاندنەوەی نرخی کڕینی بەرهەم
     */
    public function getPurchasePriceAttribute(): float
    {
        return $this->product->getPurchasePrice($this->sale->currency);
    }

    /**
     * گەڕاندنەوەی قازانجی ئەم ئایتمە
     */
    public function getProfitAmountAttribute(): float
    {
        return $this->profit;
    }

    /**
     * پشکنین ئەگەر ئەم ئایتمە قازانجی هەیە
     */
    public function getHasProfitAttribute(): bool
    {
        return $this->profit > 0;
    }
}
