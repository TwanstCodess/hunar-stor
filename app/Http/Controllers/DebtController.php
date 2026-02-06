<?php
namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class DebtController extends Controller
{
    /**
     * پیشاندانی لیستی هەموو قەرز یان سەرمایەکان (تەنها کڕیار)
     */
    public function index(Request $request)
    {
        Log::info('DebtController@index called', $request->all());

        $showType = $request->get('show_type', 'debt'); // 'debt' or 'advance'

        if ($showType === 'debt') {
            // قەرزەکان - کڕیارانی قەرزدار
            $customersQuery = Customer::query()
                ->where(function ($q) {
                    $q->where('balance_iqd', '>', 0)
                      ->orWhere('balance_usd', '>', 0);
                });
        } else {
            // سەرمایەکان - کڕیارانی سەرمایەدار
            $customersQuery = Customer::query()
                ->where(function ($q) {
                    $q->where('negative_balance_iqd', '>', 0)
                      ->orWhere('negative_balance_usd', '>', 0);
                });
        }

        // فلتەرکردن بەپێی گەڕان
        if ($request->search) {
            $search = $request->search;
            $customersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // فلتەرکردن بەپێی دراو
        if ($request->currency && $request->currency !== 'all') {
            $currency = $request->currency;
            if ($currency === 'IQD') {
                if ($showType === 'debt') {
                    $customersQuery->where('balance_iqd', '>', 0);
                } else {
                    $customersQuery->where('negative_balance_iqd', '>', 0);
                }
            } elseif ($currency === 'USD') {
                if ($showType === 'debt') {
                    $customersQuery->where('balance_usd', '>', 0);
                } else {
                    $customersQuery->where('negative_balance_usd', '>', 0);
                }
            }
        }

        $customers = $customersQuery->get()->map(function ($customer) use ($showType) {
            $lastTransactionDate = null;

            if ($showType === 'debt') {
                // بۆ قەرز: دۆزینەوەی کۆتا فرۆشتن (قەرز)
                $lastSale = Sale::where('customer_id', $customer->id)
                    ->where('sale_type', 'credit')
                    ->orderBy('sale_date', 'desc')
                    ->first();

                $lastPayment = Payment::where('customer_id', $customer->id)
                    ->orderBy('payment_date', 'desc')
                    ->first();

                if ($lastSale && $lastPayment) {
                    $lastTransactionDate = $lastSale->sale_date > $lastPayment->payment_date
                        ? $lastSale->sale_date
                        : $lastPayment->payment_date;
                } elseif ($lastSale) {
                    $lastTransactionDate = $lastSale->sale_date;
                } elseif ($lastPayment) {
                    $lastTransactionDate = $lastPayment->payment_date;
                }
            } else {
                // بۆ سەرمایە: دۆزینەوەی کۆتا پارەدان
                // چونکە payment_type نییە، هەموو پارەدانەکان بگەڕێنەوە
                $lastPayment = Payment::where('customer_id', $customer->id)
                    ->orderBy('payment_date', 'desc')
                    ->first();

                if ($lastPayment) {
                    $lastTransactionDate = $lastPayment->payment_date;
                }
            }

            // پێوانەی کاتی بە زمانی کوردی
            $lastTransactionHuman = $this->getHumanTimeDiff($lastTransactionDate);

            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'address' => $customer->address,
                'balance_iqd' => (float) $customer->balance_iqd,
                'balance_usd' => (float) $customer->balance_usd,
                'negative_balance_iqd' => (float) $customer->negative_balance_iqd,
                'negative_balance_usd' => (float) $customer->negative_balance_usd,
                'last_transaction_date' => $lastTransactionDate ? Carbon::parse($lastTransactionDate)->format('Y-m-d') : null,
                'last_transaction_human' => $lastTransactionHuman,
                'is_creditor' => $customer->balance_iqd > 0 || $customer->balance_usd > 0,
                'is_debtor' => $customer->balance_iqd < 0 || $customer->balance_usd < 0,
                'has_advance' => $customer->negative_balance_iqd > 0 || $customer->negative_balance_usd > 0,
            ];
        });

        // سەرنووسین بەپێی کۆتا مامەڵە
        $customers = $customers->sortByDesc('last_transaction_date')->values();

        // حیسابکردنی ئامارەکان
        if ($showType === 'debt') {
            $totalIQD = $customers->sum('balance_iqd');
            $totalUSD = $customers->sum('balance_usd');
        } else {
            $totalIQD = $customers->sum('negative_balance_iqd');
            $totalUSD = $customers->sum('negative_balance_usd');
        }

        $statistics = [
            'total_iqd' => $totalIQD,
            'total_usd' => $totalUSD,
            'customers_count' => $customers->count(),
            'show_type' => $showType,
        ];

        return Inertia::render('Debts/Index', [
            'customers' => $customers,
            'statistics' => $statistics,
            'filters' => $request->only(['search', 'currency', 'show_type']),
            'showAdvance' => $showType === 'advance',
        ]);
    }

    /**
     * Helper method to get human readable time difference in Kurdish
     */
    private function getHumanTimeDiff($dateString)
    {
        if (!$dateString) return null;

        $diffInDays = Carbon::parse($dateString)->diffInDays(Carbon::now());
        if ($diffInDays === 0) {
            return 'ئەمڕۆ';
        } elseif ($diffInDays === 1) {
            return 'دوێنێ';
        } elseif ($diffInDays < 7) {
            return $diffInDays . ' ڕۆژ لەمەوپێش';
        } elseif ($diffInDays < 30) {
            $weeks = floor($diffInDays / 7);
            return $weeks . ' هەفتە لەمەوپێش';
        } elseif ($diffInDays < 365) {
            $months = floor($diffInDays / 30);
            return $months . ' مانگ لەمەوپێش';
        } else {
            $years = floor($diffInDays / 365);
            return $years . ' ساڵ لەمەوپێش';
        }
    }

    /**
     * وردەکاری قەرز/سەرمایەی کڕیارێک
     */
    public function customerDetail(Customer $customer, Request $request)
    {
        $showType = $request->get('type', 'debt'); // 'debt' or 'advance'

        if ($showType === 'debt') {
            // قەرزەکان
            $sales = Sale::where('customer_id', $customer->id)
                ->where('sale_type', 'credit')
                ->with('user:id,name')
                ->orderBy('sale_date', 'desc')
                ->get()
                ->map(function ($sale) {
                    return [
                        'id' => $sale->id,
                        'invoice_number' => $sale->invoice_number,
                        'sale_date' => $sale->sale_date,
                        'total_amount' => (float) $sale->total_amount,
                        'paid_amount' => (float) $sale->paid_amount,
                        'remaining_amount' => (float) $sale->remaining_amount,
                        'currency' => $sale->currency,
                        'user' => $sale->user,
                        'items_count' => $sale->items->count(),
                    ];
                });

            $payments = $customer->payments()
                ->with('sale:id,invoice_number', 'user:id,name')
                ->orderBy('payment_date', 'desc')
                ->take(20)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'payment_date' => $payment->payment_date,
                        'amount' => (float) $payment->amount,
                        'currency' => $payment->currency,
                        'payment_method' => $payment->payment_method,
                        'notes' => $payment->notes,
                        'user' => $payment->user,
                        'sale' => $payment->sale,
                    ];
                });

            $totalIQD = $sales->where('currency', 'IQD')->sum('remaining_amount');
            $totalUSD = $sales->where('currency', 'USD')->sum('remaining_amount');
        } else {
            // سەرمایەکان
            $sales = collect(); // فرۆشتنی سەرمایە نییە

            $payments = $customer->payments()
                ->with('user:id,name')
                ->orderBy('payment_date', 'desc')
                ->take(20)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'payment_date' => $payment->payment_date,
                        'amount' => (float) $payment->amount,
                        'currency' => $payment->currency,
                        'payment_method' => $payment->payment_method,
                        'notes' => $payment->notes,
                        'user' => $payment->user,
                    ];
                });

            $totalIQD = (float) $customer->negative_balance_iqd;
            $totalUSD = (float) $customer->negative_balance_usd;
        }

        $customerData = [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'address' => $customer->address,
            'balance_iqd' => (float) $customer->balance_iqd,
            'balance_usd' => (float) $customer->balance_usd,
            'negative_balance_iqd' => (float) $customer->negative_balance_iqd,
            'negative_balance_usd' => (float) $customer->negative_balance_usd,
            'notes' => $customer->notes,
            'is_creditor' => $customer->balance_iqd > 0 || $customer->balance_usd > 0,
            'is_debtor' => $customer->balance_iqd < 0 || $customer->balance_usd < 0,
            'has_advance' => $customer->negative_balance_iqd > 0 || $customer->negative_balance_usd > 0,
        ];

        $totalSalesIQD = $sales->where('currency', 'IQD')->sum('total_amount');
        $totalSalesUSD = $sales->where('currency', 'USD')->sum('total_amount');
        $totalPaymentsIQD = $payments->where('currency', 'IQD')->sum('amount');
        $totalPaymentsUSD = $payments->where('currency', 'USD')->sum('amount');

        $statistics = [
            'total_iqd' => $totalIQD,
            'total_usd' => $totalUSD,
            'total_sales_iqd' => $totalSalesIQD,
            'total_sales_usd' => $totalSalesUSD,
            'total_payments_iqd' => $totalPaymentsIQD,
            'total_payments_usd' => $totalPaymentsUSD,
            'sales_count' => $sales->count(),
            'payments_count' => $payments->count(),
            'show_type' => $showType,
        ];

        return Inertia::render('Debts/CustomerDetail', [
            'customer' => $customerData,
            'sales' => $sales,
            'payments' => $payments,
            'statistics' => $statistics,
            'showAdvance' => $showType === 'advance',
        ]);
    }

    /**
     * لیستی سەرمایەکان (لینکی تایبەت)
     */
    public function advanceIndex(Request $request)
    {
        $request->merge(['show_type' => 'advance']);
        return $this->index($request);
    }

    /**
     * چاپکردنی بارنامەی قەرز/سەرمایە
     */
    public function printStatement(Customer $customer, Request $request)
    {
        $showType = $request->get('type', 'debt'); // 'debt' or 'advance'
        $currency = $request->get('currency', 'all');

        if ($showType === 'debt') {
            // قەرزەکان
            $query = Sale::where('customer_id', $customer->id)
                ->where('sale_type', 'credit')
                ->where('remaining_amount', '>', 0)
                ->with('user:id,name')
                ->orderBy('sale_date', 'desc');

            if ($currency !== 'all') {
                $query->where('currency', $currency);
            }

            $sales = $query->get();

            $totalIQD = (float) ($currency === 'all' || $currency === 'IQD' ? $customer->balance_iqd : 0);
            $totalUSD = (float) ($currency === 'all' || $currency === 'USD' ? $customer->balance_usd : 0);
        } else {
            // سەرمایەکان
            $sales = collect();
            $totalIQD = (float) ($currency === 'all' || $currency === 'IQD' ? $customer->negative_balance_iqd : 0);
            $totalUSD = (float) ($currency === 'all' || $currency === 'USD' ? $customer->negative_balance_usd : 0);
        }

        $company = [
            'name' => config('app.company_name', 'بێگلاس'),
            'phone' => config('app.company_phone', '0770 157 8023 - 0750 112 7325'),
        ];

        return Inertia::render('Debts/PrintStatement', [
            'customer' => $customer,
            'sales' => $sales,
            'total_iqd' => $totalIQD,
            'total_usd' => $totalUSD,
            'company' => $company,
            'currency' => $currency,
            'show_type' => $showType,
        ]);
    }
}
