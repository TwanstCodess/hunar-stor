<?php
// app/Models/Expense.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'currency',
        'amount',
        'expense_date'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date'
    ];

    /**
     * پەیوەندییەکان
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper Methods
     */
    public function isIqd(): bool
    {
        return $this->currency === 'IQD';
    }

    public function isUsd(): bool
    {
        return $this->currency === 'USD';
    }

    /**
     * بە شێوازێکی جوان پیشاندانی دراو
     */
    public function getCurrencyTextAttribute(): string
    {
        return $this->isIqd() ? 'دینار' : 'دۆلار';
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency_text;
    }

    /**
     * Scopes
     */
    public function scopeSearch($query, $search)
    {
        if ($search) {
            return $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        return $query;
    }

    public function scopeCurrency($query, $currency)
    {
        if ($currency && in_array($currency, ['IQD', 'USD'])) {
            return $query->where('currency', $currency);
        }
        return $query;
    }

    public function scopeDateRange($query, $from, $to)
    {
        if ($from) {
            $query->whereDate('expense_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('expense_date', '<=', $to);
        }
        return $query;
    }

    public function scopeToday($query)
    {
        return $query->whereDate('expense_date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereYear('expense_date', now()->year)
                    ->whereMonth('expense_date', now()->month);
    }
}
