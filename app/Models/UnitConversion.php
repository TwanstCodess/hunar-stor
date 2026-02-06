<?php
// app/Models/UnitConversion.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitConversion extends Model
{
    protected $fillable = [
        'from_unit_id',
        'to_unit_id',
        'conversion_factor',
        'notes'
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:6'
    ];

    /**
     * پەیوەندییەکان
     */
    public function fromUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }

    public function toUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'to_unit_id');
    }

    /**
     * گۆڕینی بڕێک
     */
    public function convert($amount): float
    {
        return $amount * $this->conversion_factor;
    }

    /**
     * گۆڕینی پێچەوانە
     */
    public function reverseConvert($amount): float
    {
        return $amount / $this->conversion_factor;
    }

    /**
     * دۆزینەوەی گۆڕینی پێچەوانە
     */
    public function getReverseConversion()
    {
        return self::where('from_unit_id', $this->to_unit_id)
            ->where('to_unit_id', $this->from_unit_id)
            ->first();
    }

    /**
     * ڕێژەی پێچەوانە
     */
    public function getReverseFactorAttribute(): float
    {
        if ($this->conversion_factor == 0) {
            return 0;
        }
        return 1 / $this->conversion_factor;
    }

    /**
     * بە شێوازێکی جوان پیشاندانی گۆڕین
     */
    public function getFormattedConversionAttribute(): string
    {
        return sprintf(
            '1 %s = %s %s',
            $this->fromUnit->name,
            number_format($this->conversion_factor, 6),
            $this->toUnit->name
        );
    }

    /**
     * بە شێوازێکی جوان پیشاندانی گۆڕینی پێچەوانە
     */
    public function getFormattedReverseConversionAttribute(): string
    {
        return sprintf(
            '1 %s = %s %s',
            $this->toUnit->name,
            number_format($this->reverse_factor, 6),
            $this->fromUnit->name
        );
    }
}
