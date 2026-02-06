<?php
// app/Models/Purchase.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    protected $fillable = [
        'supplier_id',
        'user_id',
        'invoice_number',
        'purchase_type',
        'currency',
        'payment_method',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'notes',
        'purchase_date'
    ];

    protected $casts = [
        'purchase_date' => 'datetime',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2'
    ];

    protected $appends = [
        'is_paid',
        'is_credit',
        'is_cash',
        'expected_profit',
        'expected_profit_percentage',
        'status'
    ];

    /**
     * پەیوەندییەکان
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     |----------------------------------------------------------------------
     | Attributes
     |----------------------------------------------------------------------
     */
    public function getIsPaidAttribute(): bool
    {
        return $this->remaining_amount <= 0;
    }

    public function getIsCreditAttribute(): bool
    {
        return $this->purchase_type === 'credit';
    }

    public function getIsCashAttribute(): bool
    {
        return $this->purchase_type === 'cash';
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_paid) {
            return 'پارەدراو';
        }
        return 'ماوە';
    }

    public function getExpectedProfitAttribute(): float
    {
        return $this->items->sum(function ($item) {
            return ($item->selling_price - $item->unit_price) * $item->quantity;
        });
    }

    public function getExpectedProfitPercentageAttribute(): float
    {
        if ($this->total_amount == 0) {
            return 0;
        }
        return ($this->expected_profit / $this->total_amount) * 100;
    }

    /**
     |----------------------------------------------------------------------
     | Methods
     |----------------------------------------------------------------------
     */
    public function addPayment(float $amount): void
    {
        if ($amount <= 0 || $amount > $this->remaining_amount) {
            throw new \Exception('بڕی پارە نادروستە');
        }

        $this->paid_amount += $amount;
        $this->remaining_amount -= $amount;
        $this->save();
    }

    public static function generateInvoiceNumber(): string
    {
        $latest = self::latest()->first();
        $number = $latest ? intval(substr($latest->invoice_number, 4)) + 1 : 1;
        return 'PUR-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    /**
     |----------------------------------------------------------------------
     | Scopes
     |----------------------------------------------------------------------
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('invoice_number', 'like', "%{$search}%")
            ->orWhereHas('supplier', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
    }

    public function scopeFilterByType($query, $type)
    {
        if ($type) {
            return $query->where('purchase_type', $type);
        }
        return $query;
    }

    public function scopeFilterByCurrency($query, $currency)
    {
        if ($currency) {
            return $query->where('currency', $currency);
        }
        return $query;
    }

    public function scopeFilterBySupplier($query, $supplierId)
    {
        if ($supplierId) {
            return $query->where('supplier_id', $supplierId);
        }
        return $query;
    }

    public function scopeFilterByDate($query, $fromDate, $toDate)
    {
        if ($fromDate) {
            $query->whereDate('purchase_date', '>=', $fromDate);
        }
        if ($toDate) {
            $query->whereDate('purchase_date', '<=', $toDate);
        }
        return $query;
    }

    public function scopeUnpaid($query)
    {
        return $query->where('remaining_amount', '>', 0);
    }
}
