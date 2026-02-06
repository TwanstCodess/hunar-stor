<?php
// app/Models/Product.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'code',
        'barcode',
        'base_unit_id',
        'purchase_unit_id',
        'sale_unit_id',
        'purchase_to_base_factor',
        'sale_to_base_factor',
        'purchase_price_iqd',
        'purchase_price_usd',
        'selling_price_iqd',
        'selling_price_usd',
        'quantity',
        'min_stock_level',
        'track_stock',
        'image',
        'description'
    ];

    protected $casts = [
        'purchase_price_iqd' => 'decimal:2',
        'purchase_price_usd' => 'decimal:2',
        'selling_price_iqd' => 'decimal:2',
        'selling_price_usd' => 'decimal:2',
        'quantity' => 'decimal:3',
        'min_stock_level' => 'decimal:3',
        'purchase_to_base_factor' => 'decimal:6',
        'sale_to_base_factor' => 'decimal:6',
        'track_stock' => 'boolean',
    ];

    /**
     * Accessor بۆ پەنجە
     */
    protected $appends = ['image_url'];

    /**
     * پەیوەندییەکان
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function purchaseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Helper Methods - گۆڕینی یەکەکان
     */
    public function convertPurchaseToBase($quantity): float
    {
        return $quantity * $this->purchase_to_base_factor;
    }

    public function convertSaleToBase($quantity): float
    {
        return $quantity * $this->sale_to_base_factor;
    }

    public function convertBaseToPurchase($quantity): float
    {
        if ($this->purchase_to_base_factor == 0) {
            return 0;
        }
        return $quantity / $this->purchase_to_base_factor;
    }

    public function convertBaseToSale($quantity): float
    {
        if ($this->sale_to_base_factor == 0) {
            return 0;
        }
        return $quantity / $this->sale_to_base_factor;
    }

    /**
     * زیادکردنی بڕ لە ستۆک
     */
    public function addStock($quantity, $inPurchaseUnit = true): void
    {
        if ($inPurchaseUnit) {
            $quantity = $this->convertPurchaseToBase($quantity);
        }

        $this->increment('quantity', $quantity);
    }

    /**
     * کەمکردنەوەی بڕ لە ستۆک
     */
    public function reduceStock($quantity, $inSaleUnit = true): void
    {
        if ($inSaleUnit) {
            $quantity = $this->convertSaleToBase($quantity);
        }

        $this->decrement('quantity', $quantity);
    }

    /**
     * نرخی کڕین و فرۆشتن بەپێی دراو
     */
    public function getPurchasePrice($currency = 'IQD'): float
    {
        $field = 'purchase_price_' . strtolower($currency);
        return (float) $this->$field;
    }

    public function getSellingPrice($currency = 'IQD'): float
    {
        $field = 'selling_price_' . strtolower($currency);
        return (float) $this->$field;
    }

    /**
     * چێککردنی بڕی کەم
     */
    public function isLowStock(): bool
    {
        return $this->track_stock && $this->quantity <= $this->min_stock_level;
    }

    /**
     * وێنەی بەرهەم - ڕاستکراوە بۆ پاتەکان
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        // چێککردن ئەگەر پاتەکە پێشتر URLـێکی تەواوە
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        // چێککردن ئەگەر پاتەکە پێشتر /storage/ دەستپێک بووبێت
        if (str_starts_with($this->image, '/storage/')) {
            return asset($this->image);
        }

        // چێککردن ئەگەر پاتەکە پێشتر storage/ دەستپێک بووبێت
        if (str_starts_with($this->image, 'storage/')) {
            return asset($this->image);
        }

        // چێککردن ئەگەر پاتەکە پێشتر products/ دەستپێک بووبێت
        if (str_starts_with($this->image, 'products/')) {
            return asset('storage/' . $this->image);
        }

        // بۆ پاتەکان کە تەواون وەک: /Users/suhaib/Desktop/beglas/public/storage/products/...
        if (str_contains($this->image, 'public/storage/')) {
            $path = str_replace('public/storage/', 'storage/', $this->image);
            return asset($path);
        }

        // بۆ پاتەکان کە تەواون وەک: storage/products/...
        if (str_starts_with($this->image, 'storage/products/')) {
            return asset($this->image);
        }

        // بۆ پاتەکانی ئاسایی
        return asset('storage/' . $this->image);
    }

    /**
     * بڕی بەردەست بە یەکەی فرۆشتن
     */
    public function getAvailableInSaleUnit(): float
    {
        return $this->convertBaseToSale($this->quantity);
    }

    /**
     * بڕی بەردەست بە یەکەی کڕین
     */
    public function getAvailableInPurchaseUnit(): float
    {
        return $this->convertBaseToPurchase($this->quantity);
    }
}
