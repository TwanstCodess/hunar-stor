<?php
// app/Models/Customer.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'balance_iqd',
        'balance_usd',
        'negative_balance_iqd',  // زیادەی دینار
        'negative_balance_usd',  // زیادەی دۆلار
        'notes'
    ];

    protected $casts = [
        'balance_iqd' => 'decimal:2',
        'balance_usd' => 'decimal:2',
        'negative_balance_iqd' => 'decimal:2',  // زیادکراو
        'negative_balance_usd' => 'decimal:2'   // زیادکراو
    ];

    /**
     * پەیوەندییەکان
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Helper Methods - زیادکراو
     */

    /**
     * گەڕاندنەوەی کۆی قەرزەکان بە پێی دراو
     */
    public function getTotalBalanceAttribute(): array
    {
        return [
            'iqd' => $this->balance_iqd,
            'usd' => $this->balance_usd,
        ];
    }

    /**
     * گەڕاندنەوەی کۆی زیادە
     */
    public function getTotalNegativeBalanceAttribute(): array
    {
        return [
            'iqd' => $this->negative_balance_iqd,
            'usd' => $this->negative_balance_usd,
        ];
    }

    /**
     * گەڕاندنەوەی کۆی هەموو پارەکان (قەرز + زیادە)
     */
    public function getAllBalancesAttribute(): array
    {
        return [
            'debt_iqd' => $this->balance_iqd,
            'debt_usd' => $this->balance_usd,
            'advance_iqd' => $this->negative_balance_iqd,
            'advance_usd' => $this->negative_balance_usd,
            'net_iqd' => $this->balance_iqd - $this->negative_balance_iqd,
            'net_usd' => $this->balance_usd - $this->negative_balance_usd,
        ];
    }

    /**
     * حیسابکردنی قەرز بە پێی دۆلار
     */
    public function getTotalDebt(): float
    {
        return $this->balance_iqd + ($this->balance_usd * 1450);
    }

    /**
     * پشکنین بۆ قەرز
     */
    public function hasDebt(): bool
    {
        return $this->balance_iqd > 0 || $this->balance_usd > 0;
    }

    /**
     * پشکنین بۆ زیادە
     */
    public function hasNegativeBalance(): bool
    {
        return $this->negative_balance_iqd > 0 || $this->negative_balance_usd > 0;
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
     * زیادکردنی زیادەی پارە (Negative Balance)
     */
    public function addNegativeBalance($amount, $currency = 'IQD'): void
    {
        if ($currency === 'IQD') {
            $this->increment('negative_balance_iqd', $amount);
        } else {
            $this->increment('negative_balance_usd', $amount);
        }
    }

    /**
     * کەمکردنەوەی زیادەی پارە
     */
    public function reduceNegativeBalance($amount, $currency = 'IQD'): void
    {
        if ($currency === 'IQD') {
            $this->decrement('negative_balance_iqd', $amount);
        } else {
            $this->decrement('negative_balance_usd', $amount);
        }
    }

    /**
     * بەکارهێنانی زیادە بۆ قەرز (تەواوکردنی فرۆشتن)
     */
    public function applyNegativeBalanceToDebt($currency = 'IQD'): float
    {
        if ($currency === 'IQD') {
            $advanceAmount = $this->negative_balance_iqd;
            $debtAmount = $this->balance_iqd;

            if ($advanceAmount > 0 && $debtAmount > 0) {
                $applicableAmount = min($advanceAmount, $debtAmount);
                $this->decrement('negative_balance_iqd', $applicableAmount);
                $this->decrement('balance_iqd', $applicableAmount);
                return $applicableAmount;
            }
        } else {
            $advanceAmount = $this->negative_balance_usd;
            $debtAmount = $this->balance_usd;

            if ($advanceAmount > 0 && $debtAmount > 0) {
                $applicableAmount = min($advanceAmount, $debtAmount);
                $this->decrement('negative_balance_usd', $applicableAmount);
                $this->decrement('balance_usd', $applicableAmount);
                return $applicableAmount;
            }
        }

        return 0;
    }

    /**
     * پشکنین ئەگەر پارە زیاتری بدات
     */
    public function getPaymentStatus($paymentAmount, $currency = 'IQD'): array
    {
        $debt = $currency === 'IQD' ? $this->balance_iqd : $this->balance_usd;

        if ($paymentAmount > $debt) {
            $excess = $paymentAmount - $debt;
            return [
                'is_excess' => true,
                'excess_amount' => $excess,
                'debt_cleared' => $debt,
                'remaining_debt' => 0
            ];
        } else {
            return [
                'is_excess' => false,
                'excess_amount' => 0,
                'debt_cleared' => $paymentAmount,
                'remaining_debt' => $debt - $paymentAmount
            ];
        }
    }

    /**
     * کۆی گشتی فرۆشتنەکان
     */
    public function getTotalSalesAttribute(): array
    {
        $sales = $this->sales;
        return [
            'iqd' => $sales->where('currency', 'IQD')->sum('total_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('total_amount'),
        ];
    }

    /**
     * کۆی گشتی پارەدانەکان
     */
    public function getTotalPaymentsAttribute(): array
    {
        $payments = $this->payments;
        return [
            'iqd' => $payments->where('currency', 'IQD')->sum('amount'),
            'usd' => $payments->where('currency', 'USD')->sum('amount'),
        ];
    }

    /**
     * گەڕاندنەوەی ستاتیستی پارەکان
     */
    public function getBalanceStatsAttribute(): array
    {
        return [
            'total_debt' => [
                'iqd' => $this->balance_iqd,
                'usd' => $this->balance_usd,
            ],
            'total_advance' => [
                'iqd' => $this->negative_balance_iqd,
                'usd' => $this->negative_balance_usd,
            ],
            'net_balance' => [
                'iqd' => $this->balance_iqd - $this->negative_balance_iqd,
                'usd' => $this->balance_usd - $this->negative_balance_usd,
            ]
        ];
    }
}
