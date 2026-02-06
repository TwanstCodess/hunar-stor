<?php
// app/Models/Unit.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Unit extends Model
{
    protected $fillable = [
        'name',
        'name_en',
        'symbol',
        'type',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    /**
     * پەیوەندییەکان
     */
    public function conversionsFrom(): HasMany
    {
        return $this->hasMany(UnitConversion::class, 'from_unit_id');
    }

    public function conversionsTo(): HasMany
    {
        return $this->hasMany(UnitConversion::class, 'to_unit_id');
    }

    public function productsAsBase(): HasMany
    {
        return $this->hasMany(Product::class, 'base_unit_id');
    }

    public function productsAsPurchase(): HasMany
    {
        return $this->hasMany(Product::class, 'purchase_unit_id');
    }

    public function productsAsSale(): HasMany
    {
        return $this->hasMany(Product::class, 'sale_unit_id');
    }

    /**
     * هەموو گۆڕینەکان (لە و بۆ)
     */
    public function getAllConversions()
    {
        return $this->conversionsFrom->merge($this->conversionsTo);
    }

    /**
     * دۆزینەوەی کۆنڤێرشن فاکتەر بۆ یەکەیەکی تر
     */
    public function getConversionFactorTo($toUnitId): ?float
    {
        $conversion = $this->conversionsFrom()
            ->where('to_unit_id', $toUnitId)
            ->first();

        return $conversion ? (float) $conversion->conversion_factor : null;
    }

    /**
     * گۆڕینی بڕێک بۆ یەکەیەکی تر
     */
    public function convertTo($amount, $toUnitId): ?float
    {
        $factor = $this->getConversionFactorTo($toUnitId);

        if ($factor === null) {
            // هەوڵ بدە بە گۆڕینی پێچەوانە
            $reverseConversion = UnitConversion::where('from_unit_id', $toUnitId)
                ->where('to_unit_id', $this->id)
                ->first();

            if ($reverseConversion) {
                return $amount / $reverseConversion->conversion_factor;
            }

            return null;
        }

        return $amount * $factor;
    }

    /**
     * چێککردن ئەگەر یەکەی بنەڕەتە
     */
    public function isBaseUnit(): bool
    {
        return $this->type === 'base';
    }

    /**
     * چێککردن ئەگەر یەکەی پاکەجکراوە
     */
    public function isPackedUnit(): bool
    {
        return $this->type === 'packed';
    }

    /**
     * یەکەکانی تر کە دەتوانێت بۆیان بگۆڕێت
     */
    public function getConvertibleUnits()
    {
        $fromUnits = $this->conversionsFrom->pluck('toUnit');
        $toUnits = $this->conversionsTo->pluck('fromUnit');

        return $fromUnits->merge($toUnits)->unique('id');
    }

    /**
     * چێککردن ئەگەر دەتوانرێت بسڕێتەوە
     */
    public function canBeDeleted(): bool
    {
        return !$this->productsAsBase()->exists() &&
               !$this->productsAsPurchase()->exists() &&
               !$this->productsAsSale()->exists();
    }
}
