<?php
// app/Models/Payment.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'supplier_id',
        'sale_id',
        'purchase_id',
        'user_id',
        'currency',
        'payment_method',
        'type',
        'amount',
        'notes',
        'payment_date',
        'reference_number',
        'invoice_number',
        'bank_name',
        'account_number',
        'transaction_id',
        'status',
        'attachment',
        'excess_amount',     // زیادەی پارە
        'debt_reduction'     // کەمکردنەوەی قەرز
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'excess_amount' => 'decimal:2',
        'debt_reduction' => 'decimal:2',
        'payment_date' => 'datetime'
    ];

    /**
     * پەیوەندییەکان
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scopes
     */
    public function scopeCustomerPayments($query)
    {
        return $query->where('type', 'customer');
    }

    public function scopeSupplierPayments($query)
    {
        return $query->where('type', 'supplier');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeHasExcess($query)
    {
        return $query->where('excess_amount', '>', 0);
    }

    /**
     * Helper Methods
     */
    public function isCash(): bool
    {
        return $this->payment_method === 'cash';
    }

    public function isPos(): bool
    {
        return $this->payment_method === 'pos';
    }

    public function isTransfer(): bool
    {
        return $this->payment_method === 'transfer';
    }

    public function isCheque(): bool
    {
        return $this->payment_method === 'cheque';
    }

    public function isAdvanceApplication(): bool
    {
        return $this->payment_method === 'advance_application';
    }

    public function isCustomerPayment(): bool
    {
        return $this->type === 'customer';
    }

    public function isSupplierPayment(): bool
    {
        return $this->type === 'supplier';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    public function hasExcess(): bool
    {
        return $this->excess_amount > 0;
    }

    /**
     * بە شێوازێکی جوان پیشاندانی شێوازی پارەدان
     */
    public function getPaymentMethodTextAttribute(): string
    {
        return match($this->payment_method) {
            'cash' => 'کاش',
            'pos' => 'پۆس',
            'transfer' => 'گواستنەوە',
            'cheque' => 'چێک',
            'advance_application' => 'بەکارهێنانی زیادە',
            'other' => 'ئەوانی تر',
            default => $this->payment_method
        };
    }

    /**
     * بە شێوازێکی جوان پیشاندانی دۆخ
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'completed' => 'تەواوبوو',
            'pending' => 'چاوەڕوانی',
            'cancelled' => 'هەڵوەشاوە',
            'refunded' => 'گەڕاوەتەوە',
            default => $this->status
        };
    }

    /**
     * بە شێوازێکی جوان پیشاندانی جۆری پارەدان
     */
    public function getTypeTextAttribute(): string
    {
        return $this->type === 'customer' ? 'کڕیار' : 'دابینکەر';
    }

    /**
     * وەرگرتنی ناوی لایەنی پەیوەندیدار
     */
    public function getEntityNameAttribute(): string
    {
        if ($this->isCustomerPayment()) {
            return $this->customer?->name ?? 'کڕیاری نەزانراو';
        }
        return $this->supplier?->name ?? 'دابینکەری نەزانراو';
    }

    /**
     * فۆرماتکردنی بڕی پارە
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }

    /**
     * فۆرماتکردنی زیادەی پارە
     */
    public function getFormattedExcessAmountAttribute(): string
    {
        return $this->excess_amount > 0 ?
               number_format($this->excess_amount, 2) . ' ' . $this->currency :
               '0.00 ' . $this->currency;
    }

    /**
     * فۆرماتکردنی کەمکردنەوەی قەرز
     */
    public function getFormattedDebtReductionAttribute(): string
    {
        return $this->debt_reduction > 0 ?
               number_format($this->debt_reduction, 2) . ' ' . $this->currency :
               '0.00 ' . $this->currency;
    }

    /**
     * پشکنین ئەگەر ئەم پارەدانە زیادەی پارە هەیە
     */
    public function getIsExcessPaymentAttribute(): bool
    {
        return $this->excess_amount > 0;
    }

    /**
     * گەڕاندنەوەی بڕی ڕاستەقینەی قەرزکەمکردنەوە
     */
    public function getEffectiveDebtReductionAttribute(): float
    {
        return $this->debt_reduction ?? $this->amount;
    }

    /**
     * گەڕاندنەوەی بڕی ڕاستەقینەی زیادە
     */
    public function getEffectiveExcessAmountAttribute(): float
    {
        return $this->excess_amount ?? 0;
    }

    /**
     * پشکنین ئەگەر ئەم پارەدانە بۆ زیادەی پارە بێت
     */
    public function getIsAdvancePaymentAttribute(): bool
    {
        return $this->isAdvanceApplication() ||
               ($this->isCustomerPayment() && $this->hasExcess());
    }
}
