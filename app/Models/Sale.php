<?php
// app/Models/Sale.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'customer_id',
        'user_id',
        'invoice_number',
        'sale_type',
        'currency',
        'payment_method',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'notes',
        'sale_date'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'sale_date' => 'datetime'
    ];

    /**
     * پەیوەندییەکان
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('remaining_amount', '>', 0);
    }

    public function scopeCompleted($query)
    {
        return $query->where('remaining_amount', '<=', 0);
    }

    public function scopeCredit($query)
    {
        return $query->where('sale_type', 'credit');
    }

    public function scopeCash($query)
    {
        return $query->where('sale_type', 'cash');
    }

    /**
     * Helper Methods
     */
    public function isPaid(): bool
    {
        return $this->remaining_amount <= 0;
    }

    public function isPartialPaid(): bool
    {
        return $this->paid_amount > 0 && $this->remaining_amount > 0;
    }

    public function isUnpaid(): bool
    {
        return $this->paid_amount == 0;
    }

    public function isCredit(): bool
    {
        return $this->sale_type === 'credit';
    }

    public function isCash(): bool
    {
        return $this->sale_type === 'cash';
    }

    /**
     * زیادکردنی پارەی دراو (لەگەڵ بەکارهێنانی زیادە ئەگەر بوونی هەبێت)
     */
    public function addPayment($amount, $customer = null, $applyAdvance = true): array
    {
        $result = [
            'debt_reduction' => 0,
            'excess_amount' => 0,
            'advance_applied' => 0
        ];

        // ئەگەر کڕیار زیادەی هەبێت و داوامان لێکراوە بەکاریبهێنین
        if ($applyAdvance && $customer && $customer->hasNegativeBalance()) {
            $advanceField = $this->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
            $availableAdvance = $customer->{$advanceField};

            if ($availableAdvance > 0) {
                $applicableAdvance = min($availableAdvance, $this->remaining_amount, $amount);

                if ($applicableAdvance > 0) {
                    // بەکارهێنانی زیادە
                    $customer->decrement($advanceField, $applicableAdvance);
                    $this->increment('paid_amount', $applicableAdvance);
                    $this->decrement('remaining_amount', $applicableAdvance);

                    $result['advance_applied'] = $applicableAdvance;
                    $amount -= $applicableAdvance;
                }
            }
        }

        // بەکارهێنانی پارەی ئاسایی
        if ($amount > 0) {
            $debtReduction = min($amount, $this->remaining_amount);
            $excessAmount = $amount - $debtReduction;

            $this->increment('paid_amount', $debtReduction);
            $this->decrement('remaining_amount', $debtReduction);

            $result['debt_reduction'] = $debtReduction;
            $result['excess_amount'] = $excessAmount;

            // ئەگەر پارە زیاتر بوو، زیادە زیاد بکە
            if ($excessAmount > 0 && $customer) {
                $negativeField = $this->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                $customer->increment($negativeField, $excessAmount);
            }
        }

        $this->save();
        return $result;
    }

    /**
     * دروستکردنی ژمارەی وەسڵ
     */
    public static function generateInvoiceNumber(): string
    {
        $latest = self::latest()->first();
        $number = $latest ? ((int) substr($latest->invoice_number, 4)) + 1 : 1;
        return 'SAL-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    /**
     * قازانجی فرۆشتن
     */
    public function getProfitAttribute(): float
    {
        $profit = 0;

        foreach ($this->items as $item) {
            $purchasePrice = $item->product->getPurchasePrice($this->currency);
            $profit += ($item->unit_price - $purchasePrice) * $item->quantity;
        }

        return $profit;
    }

    /**
     * ڕێژەی قازانج
     */
    public function getProfitPercentageAttribute(): float
    {
        if ($this->total_amount == 0) {
            return 0;
        }

        return ($this->profit / $this->total_amount) * 100;
    }

    /**
     * گەڕاندنەوەی بەکارهێنانی زیادە لەم فرۆشتنە
     */
    public function getAdvanceAppliedAttribute(): float
    {
        $advancePayments = $this->payments()
            ->where('payment_method', 'advance_application')
            ->sum('amount');

        return (float) $advancePayments;
    }

    /**
     * پشکنین ئەگەر زیادە بەکارهێنرابێت
     */
    public function getHasAdvanceAppliedAttribute(): bool
    {
        return $this->advance_applied > 0;
    }

    /**
     * گەڕاندنەوەی پارەدانەکانی زیادە
     */
    public function getAdvancePaymentsAttribute()
    {
        return $this->payments()
            ->where('payment_method', 'advance_application')
            ->get();
    }

    /**
     * گەڕاندنەوەی کۆی پارەدانەکان بێ زیادە
     */
    public function getRegularPaymentsAttribute()
    {
        return $this->payments()
            ->where('payment_method', '!=', 'advance_application')
            ->get();
    }
}
