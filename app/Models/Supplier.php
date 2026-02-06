<?php
// app/Models/Supplier.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'company_name',
        'phone',
        'email',
        'address',
        'balance_iqd',
        'balance_usd',
        'notes'
    ];

    protected $casts = [
        'balance_iqd' => 'decimal:2',
        'balance_usd' => 'decimal:2'
    ];

    /**
     * پەیوەندییەکان
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'supplier_id');
    }

    /**
     * Helper Methods
     */
    public function getTotalBalanceAttribute(): array
    {
        return [
            'iqd' => $this->balance_iqd,
            'usd' => $this->balance_usd,
        ];
    }

    public function getTotalPurchasesAttribute(): array
    {
        $purchases = $this->purchases;

        return [
            'iqd' => $purchases->where('currency', 'IQD')->sum('total_amount'),
            'usd' => $purchases->where('currency', 'USD')->sum('total_amount'),
        ];
    }

    public function hasDebt(): bool
    {
        return $this->balance_iqd > 0 || $this->balance_usd > 0;
    }

    /**
     * زیادکردنی قەرز
     */
    public function addDebt($amount, $currency = 'IQD'): void
    {
        if ($currency === 'IQD') {
            $this->increment('balance_iqd', $amount);
        } else {
            $this->increment('balance_usd', $amount);
        }
    }

    /**
     * کەمکردنەوەی قەرز
     */
    public function reduceDebt($amount, $currency = 'IQD'): void
    {
        if ($currency === 'IQD') {
            $this->decrement('balance_iqd', $amount);
        } else {
            $this->decrement('balance_usd', $amount);
        }
    }

    /**
     * کۆی گشتی کڕینەکان
     */
    public function getTotalPurchasesCountAttribute(): int
    {
        return $this->purchases()->count();
    }
    /**
     * دوایین کڕینەکان
     */
    public function getRecentPurchases($limit = 10)
    {
        return $this->purchases()
            ->with(['items.product'])
            ->latest()
            ->take($limit)
            ->get();
    }
}
