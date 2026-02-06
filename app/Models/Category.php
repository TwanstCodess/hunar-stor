<?php

// app/Models/Category.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    protected $fillable = [
        'name',
        'description',
        'image',
    ];

    protected $appends = ['image_url', 'products_count'];

    /**
     * پەیوەندی بە بەرهەمەکانەوە
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * ژمارەی بەرهەمەکان
     */
    public function getProductsCountAttribute(): int
    {
        if (! array_key_exists('products_count', $this->attributes)) {
            return $this->products()->count();
        }

        return $this->attributes['products_count'];
    }

    /**
     * وێنەی پێشگریمان (چارەسەرکراو)
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        // چێککردن بۆ ئەوەی پاتەکە لە سەرەتاوە URLـێکی تەواوە
        if (str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        // چێککردن بۆ ئەوەی پاتەکە بە /storage/ دەستپێک ببێت
        if (str_starts_with($this->image, '/storage/')) {
            return asset($this->image);
        }

        // چێککردن بۆ ئەوەی پاتەکە بە storage/ دەستپێک ببێت
        if (str_starts_with($this->image, 'storage/')) {
            return asset($this->image);
        }

        // چێککردن بۆ ئەوەی پاتەکە بە categories/ دەستپێک ببێت
        if (str_starts_with($this->image, 'categories/')) {
            return Storage::disk('public')->url($this->image);
        }

        // بۆ پاتەکانی ئاسایی
        return Storage::disk('public')->url('categories/'.$this->image);
    }
}
