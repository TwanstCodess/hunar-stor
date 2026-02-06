<?php
// app/Http/Controllers/CustomerController.php
namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::withCount(['sales', 'payments']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // قەرزدارەکان: ئەوانەی balance_iqd یان balance_usd لەسەروی 0ەوەن
        if ($request->has('has_debt')) {
            $query->where(function ($q) {
                $q->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
            });
        }

        // سەرمایەدارەکان: ئەوانەی negative_balance_iqd یان negative_balance_usd لەسەروی 0ەوەن
        if ($request->has('has_advance')) {
            $query->where(function ($q) {
                $q->where('negative_balance_iqd', '>', 0)
                  ->orWhere('negative_balance_usd', '>', 0);
            });
        }

        $customers = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'has_debt', 'has_advance']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Customer::create($validated);

        return redirect()->route('customers.index')
            ->with('success', 'کڕیار بە سەرکەوتوویی زیادکرا');
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'sales' => function ($query) {
                $query->with('user:id,name')
                      ->select('id', 'customer_id', 'user_id', 'invoice_number', 'sale_date', 'total_amount',
                               'paid_amount', 'remaining_amount', 'currency', 'sale_type', 'created_at')
                      ->latest()
                      ->take(10);
            },
            'payments' => function ($query) {
                $query->with('user:id,name')
                      ->select('id', 'customer_id', 'user_id', 'payment_date', 'amount', 'currency',
                               'payment_method', 'notes', 'created_at')
                      ->latest()
                      ->take(10);
            }
        ]);

        $stats = [
            'total_sales' => $customer->sales()->count(),
            'total_payments' => $customer->payments()->count(),
            'total_sales_amount' => [
                'iqd' => (float) $customer->sales()->where('currency', 'IQD')->sum('total_amount'),
                'usd' => (float) $customer->sales()->where('currency', 'USD')->sum('total_amount'),
            ],
            'total_payments_amount' => [
                'iqd' => (float) $customer->payments()->where('currency', 'IQD')->sum('amount'),
                'usd' => (float) $customer->payments()->where('currency', 'USD')->sum('amount'),
            ],
            'pending_invoices' => $customer->sales()->where('remaining_amount', '>', 0)->count(),
        ];

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'stats' => $stats,
        ]);
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);

        return redirect()->route('customers.index')
            ->with('success', 'کڕیار بە سەرکەوتوویی نوێکرایەوە');
    }

    public function destroy(Customer $customer)
    {
        if ($customer->sales()->exists() || $customer->payments()->exists()) {
            return back()->with('error', 'ناتوانرێت بسڕێتەوە، چونکە فرۆشتن یان پارەدانی تێدایە');
        }

        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'کڕیار بە سەرکەوتوویی سڕایەوە');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:customers,id',
        ]);

        $customers = Customer::whereIn('id', $request->ids)->get();

        $deletedCount = 0;
        $failedCount = 0;

        foreach ($customers as $customer) {
            if ($customer->sales()->exists() || $customer->payments()->exists()) {
                $failedCount++;
                continue;
            }

            $customer->delete();
            $deletedCount++;
        }

        $message = '';
        if ($deletedCount > 0) {
            $message .= $deletedCount . ' کڕیار بە سەرکەوتوویی سڕایەوە';
        }

        if ($failedCount > 0) {
            $message .= ($message ? '، ' : '') . $failedCount . ' کڕیار نەسڕدرایەوە چونکە فرۆشتن یان پارەدانی تێدایە';
        }

        return redirect()->route('customers.index')
            ->with($deletedCount > 0 ? 'success' : 'error', $message);
    }

public function debtStatement(Customer $customer)
{
    $sales = $customer->sales()
        ->with(['user:id,name', 'items.product:id,name'])
        ->select('id', 'customer_id', 'user_id', 'invoice_number', 'sale_date', 'total_amount', 'paid_amount',
                 'remaining_amount', 'currency', 'sale_type', 'notes', 'created_at')
        ->where('remaining_amount', '>', 0)
        ->orderBy('sale_date', 'desc')
        ->get();

    $payments = $customer->payments()
        ->with('user:id,name')
        ->select('id', 'customer_id', 'user_id', 'payment_date', 'amount', 'currency', 'payment_method', 'notes', 'created_at')
        ->orderBy('payment_date', 'desc')
        ->get();

    $totalDebt = [
        'iqd' => (float) $customer->balance_iqd,
        'usd' => (float) $customer->balance_usd,
        'total_iqd' => $customer->balance_iqd + ($customer->balance_usd * 1450),
    ];

    // زیادکردنی زانیارییەکانی سەرمایە
    $advanceBalance = [
        'iqd' => (float) $customer->negative_balance_iqd,
        'usd' => (float) $customer->negative_balance_usd,
        'total_iqd' => $customer->negative_balance_iqd + ($customer->negative_balance_usd * 1450),
    ];

    // کۆی تەواو
    $netBalance = [
        'iqd' => (float) ($customer->balance_iqd - $customer->negative_balance_iqd),
        'usd' => (float) ($customer->balance_usd - $customer->negative_balance_usd),
        'total_iqd' => ($customer->balance_iqd - $customer->negative_balance_iqd) +
                       (($customer->balance_usd - $customer->negative_balance_usd) * 1450),
    ];

    return Inertia::render('Customers/DebtStatement', [
        'customer' => $customer,
        'sales' => $sales,
        'payments' => $payments,
        'totalDebt' => $totalDebt,
        'advanceBalance' => $advanceBalance,
        'netBalance' => $netBalance,
    ]);
}

    public function debtStatementPrint(Customer $customer, Request $request)
{
    $currencyFilter = $request->get('currency', 'both');

    $query = $customer->sales()
        ->with(['user:id,name', 'items' => function($query) {
            $query->with(['product' => function($q) {
                $q->select('id', 'name', 'unit_type', 'unit_name');
            }])
            ->select('id', 'sale_id', 'product_id', 'quantity', 'unit_price', 'total_price','note');
        }])
        ->select('id', 'customer_id', 'user_id', 'invoice_number', 'sale_date', 'total_amount', 'paid_amount',
                 'remaining_amount', 'currency', 'sale_type', 'notes', 'created_at')
        ->where('remaining_amount', '>', 0);

    if ($currencyFilter === 'iqd') {
        $query->where('currency', 'IQD');
    } elseif ($currencyFilter === 'usd') {
        $query->where('currency', 'USD');
    }

    $sales = $query->orderBy('sale_date', 'desc')->get();

    // دروستکردنی زانیاری بۆ هەر فرۆشتێک
    $sales->each(function ($sale) {
        $productCount = 0;
        $productNames = [];

        foreach ($sale->items as $item) {
            $productCount += $item->quantity;

            if ($item->product) {
                // بەکارهێنانی unit_name یان unit_type بۆ یەکە
                $item->product->unit_display = $item->product->unit_name ?:
                    match($item->product->unit_type) {
                        'piece' => 'دانە',
                        'kg' => 'کیلۆ',
                        'meter' => 'مەتر',
                        'liter' => 'لیتر',
                        'box' => 'قوتو',
                        'carton' => 'کارتن',
                        'packet' => 'پاکێت',
                        'bundle' => 'بەندەڵ',
                        default => 'دانە'
                    };
                $productNames[] = $item->product->name;
            } else {
                $item->product = (object) ['name' => 'نادیار', 'unit_display' => 'دانە'];
                $productNames[] = 'نادیار';
            }
        }

        $sale->product_count = $productCount;
        $sale->product_names = implode('، ', array_slice($productNames, 0, 3));
        if (count($productNames) > 3) {
            $sale->product_names .= ' و ' . (count($productNames) - 3) . ' زیاتر';
        }
    });

    // زانیارییەکانی قەرز
    $totalDebt = [
        'iqd' => (float) $customer->balance_iqd,
        'usd' => (float) $customer->balance_usd,
        'total_iqd' => $customer->balance_iqd + ($customer->balance_usd * 1450),
    ];

    // زانیارییەکانی سەرمایە
    $advanceBalance = [
        'iqd' => (float) $customer->negative_balance_iqd,
        'usd' => (float) $customer->negative_balance_usd,
        'total_iqd' => $customer->negative_balance_iqd + ($customer->negative_balance_usd * 1450),
    ];

    // کۆی تەواو
    $netBalance = [
        'iqd' => (float) ($customer->balance_iqd - $customer->negative_balance_iqd),
        'usd' => (float) ($customer->balance_usd - $customer->negative_balance_usd),
        'total_iqd' => ($customer->balance_iqd - $customer->negative_balance_iqd) +
                       (($customer->balance_usd - $customer->negative_balance_usd) * 1450),
    ];

    $company = [
        'name' => config('app.company_name', 'بێگلاس'),
        'phone' => config('app.company_phone', '0770 157 8023 - 0750 112 7325'),
    ];

    return Inertia::render('Customers/DebtStatementPrint', [
        'customer' => $customer,
        'sales' => $sales,
        'totalDebt' => $totalDebt,
        'advanceBalance' => $advanceBalance,
        'netBalance' => $netBalance,
        'company' => $company,
        'currencyFilter' => $currencyFilter,
    ]);
}

   public function debtStatementPrint2(Customer $customer, Request $request)
{
    $currencyFilter = $request->get('currency', 'both');

    $query = $customer->sales()
        ->with(['user:id,name', 'items' => function($query) {
            $query->with(['product' => function($q) {
                $q->select('id', 'name', 'unit_type', 'unit_name');
            }])
            ->select('id', 'sale_id', 'product_id', 'quantity', 'unit_price', 'total_price');
        }])
        ->select('id', 'customer_id', 'user_id', 'invoice_number', 'sale_date', 'total_amount', 'paid_amount',
                 'remaining_amount', 'currency', 'sale_type', 'notes', 'created_at')
        ->where('remaining_amount', '>', 0);

    if ($currencyFilter === 'iqd') {
        $query->where('currency', 'IQD');
    } elseif ($currencyFilter === 'usd') {
        $query->where('currency', 'USD');
    }

    $sales = $query->orderBy('sale_date', 'desc')->get();

    // دروستکردنی زانیاری بۆ هەر فرۆشتێک
    $sales->each(function ($sale) {
        $productCount = 0;
        $productNames = [];

        foreach ($sale->items as $item) {
            $productCount += $item->quantity;

            if ($item->product) {
                // بەکارهێنانی unit_name یان unit_type بۆ یەکە
                $item->product->unit_display = $item->product->unit_name ?:
                    match($item->product->unit_type) {
                        'piece' => 'دانە',
                        'kg' => 'کیلۆ',
                        'meter' => 'مەتر',
                        'liter' => 'لیتر',
                        'box' => 'قوتو',
                        'carton' => 'کارتن',
                        'packet' => 'پاکێت',
                        'bundle' => 'بەندەڵ',
                        default => 'دانە'
                    };
                $productNames[] = $item->product->name;
            } else {
                $item->product = (object) ['name' => 'نادیار', 'unit_display' => 'دانە'];
                $productNames[] = 'نادیار';
            }
        }

        $sale->product_count = $productCount;
        $sale->product_names = implode('، ', array_slice($productNames, 0, 3));
        if (count($productNames) > 3) {
            $sale->product_names .= ' و ' . (count($productNames) - 3) . ' زیاتر';
        }
    });

    // زانیارییەکانی قەرز
    $totalDebt = [
        'iqd' => (float) $customer->balance_iqd,
        'usd' => (float) $customer->balance_usd,
        'total_iqd' => $customer->balance_iqd + ($customer->balance_usd * 1450),
    ];

    // زانیارییەکانی سەرمایە
    $advanceBalance = [
        'iqd' => (float) $customer->negative_balance_iqd,
        'usd' => (float) $customer->negative_balance_usd,
        'total_iqd' => $customer->negative_balance_iqd + ($customer->negative_balance_usd * 1450),
    ];

    // کۆی تەواو
    $netBalance = [
        'iqd' => (float) ($customer->balance_iqd - $customer->negative_balance_iqd),
        'usd' => (float) ($customer->balance_usd - $customer->negative_balance_usd),
        'total_iqd' => ($customer->balance_iqd - $customer->negative_balance_iqd) +
                       (($customer->balance_usd - $customer->negative_balance_usd) * 1450),
    ];

    $company = [
        'name' => config('app.company_name', 'بێگلاس'),
        'phone' => config('app.company_phone', '0770 157 8023 - 0750 112 7325'),
    ];

    return Inertia::render('Customers/DebtStatementinvoice', [
        'customer' => $customer,
        'sales' => $sales,
        'totalDebt' => $totalDebt,
        'advanceBalance' => $advanceBalance,
        'netBalance' => $netBalance,
        'company' => $company,
        'currencyFilter' => $currencyFilter,
    ]);
}

    public function report(Request $request)
    {
        $query = Customer::withCount(['sales', 'payments']);

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereHas('sales', function ($q) use ($request) {
                $q->whereBetween('sale_date', [$request->start_date, $request->end_date]);
            });
        }

        if ($request->has_debt) {
            $query->where(function ($q) {
                $q->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
            });
        }

        if ($request->has_advance) {
            $query->where(function ($q) {
                $q->where('negative_balance_iqd', '>', 0)
                  ->orWhere('negative_balance_usd', '>', 0);
            });
        }

        $customers = $query->orderBy('name')->get();

        return Inertia::render('Customers/Report', [
            'customers' => $customers,
            'filters' => $request->only(['start_date', 'end_date', 'has_debt', 'has_advance']),
        ]);
    }



public function allSales(Customer $customer, Request $request)
{
    // پشکنین بۆ بینینی ئەوەی کڕیار بوونی هەیە
    \Log::info('All Sales Request for Customer ID: ' . $customer->id);

    // وەرگرتنی پارامێتەرەکان
    $currency = $request->get('currency', 'both');
    $start_date = $request->get('start_date');
    $end_date = $request->get('end_date');

    $query = $customer->sales()
        ->with([
            'user:id,name',
            'items' => function($query) {
                $query->with(['product' => function($q) {
                    $q->select('id', 'name', 'unit_type', 'unit_name');
                }])
                ->select('id', 'sale_id', 'product_id', 'quantity', 'unit_price', 'total_price', 'note');
            }
        ])
        ->select('id', 'customer_id', 'user_id', 'invoice_number', 'sale_date', 'total_amount',
                 'paid_amount', 'remaining_amount', 'currency', 'sale_type', 'notes', 'created_at');

    // فلتەرکردن بەپێی دراو
    if ($currency === 'iqd') {
        $query->where('currency', 'IQD');
    } elseif ($currency === 'usd') {
        $query->where('currency', 'USD');
    }

    // فلتەرکردن بەپێی بەروار
    if ($start_date && $end_date) {
        $query->whereBetween('sale_date', [$start_date, $end_date]);
    }

    $sales = $query->orderBy('sale_date', 'desc')->get();

    // چاپکردن بۆ دیاریکردنی کێشە
    \Log::info('Sales count: ' . $sales->count());

    // پشکنینی ئایتمەکان
    foreach ($sales as $sale) {
        \Log::info('Sale ID: ' . $sale->id . ', Items count: ' . ($sale->items ? $sale->items->count() : 0));
    }

    // دروستکردنی زانیاری بۆ هەر فرۆشتێک
    $sales->each(function ($sale) {
        $productCount = 0;
        $productNames = [];

        if ($sale->items && $sale->items->count() > 0) {
            foreach ($sale->items as $item) {
                $productCount += $item->quantity;

                if ($item->product) {
                    $item->product->unit_display = $item->product->unit_name ?:
                        match($item->product->unit_type) {
                            'piece' => 'دانە',
                            'kg' => 'کیلۆ',
                            'meter' => 'مەتر',
                            'liter' => 'لیتر',
                            'box' => 'قوتو',
                            'carton' => 'کارتن',
                            'packet' => 'پاکێت',
                            'bundle' => 'بەندەڵ',
                            default => 'دانە'
                        };
                    $productNames[] = $item->product->name;
                } else {
                    $item->product = (object) ['name' => 'نادیار', 'unit_display' => 'دانە'];
                    $productNames[] = 'نادیار';
                }
            }
        }

        $sale->product_count = $productCount;
        $sale->product_names = count($productNames) > 0
            ? implode('، ', array_slice($productNames, 0, 3))
            : 'هیچ بەرهەمێک';

        if (count($productNames) > 3) {
            $sale->product_names .= ' و ' . (count($productNames) - 3) . ' زیاتر';
        }
    });

    // حیسابکردنی ئامارەکان
    $stats = [
        'total_sales_count' => $sales->count(),
        'total_sales_amount' => [
            'iqd' => $sales->where('currency', 'IQD')->sum('total_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('total_amount'),
        ],
        'total_paid_amount' => [
            'iqd' => $sales->where('currency', 'IQD')->sum('paid_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('paid_amount'),
        ],
        'total_remaining_amount' => [
            'iqd' => $sales->where('currency', 'IQD')->sum('remaining_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('remaining_amount'),
        ],
        'total_products_count' => $sales->sum(function($sale) {
            return $sale->product_count;
        }),
        'debt_sales_count' => $sales->where('remaining_amount', '>', 0)->count(),
    ];

    return Inertia::render('Customers/AllSales', [
        'customer' => $customer,
        'sales' => $sales,
        'stats' => $stats,
        'filters' => $request->only(['currency', 'start_date', 'end_date']),
        'auth' => [
            'user' => auth()->user()
        ]
    ]);
}

// لە CustomerController.php لە کۆتای کلاسەکە پێش } زیاد بکە:

/**
 * زیادکردنی سەرمایە بۆ کڕیار
 */
public function addAdvance(Request $request, Customer $customer)
{
    try {
        $amountIqd = $request->input('amount_iqd', 0);
        $amountUsd = $request->input('amount_usd', 0);

        // وەرگرتنی کاونتی کۆن
        $oldBalanceIQD = $customer->negative_balance_iqd;
        $oldBalanceUSD = $customer->negative_balance_usd;

        // کاونتی کۆن + زیادکراو
        if ($amountIqd > 0) {
            $customer->negative_balance_iqd = $oldBalanceIQD + $amountIqd;
        }

        if ($amountUsd > 0) {
            $customer->negative_balance_usd = $oldBalanceUSD + $amountUsd;
        }

        $customer->save();

        return response()->json([
            'success' => true,
            'message' => 'سەرمایە بە سەرکەوتوویی زیادکرا',
            'old_balance_iqd' => $oldBalanceIQD,
            'old_balance_usd' => $oldBalanceUSD,
            'added_iqd' => $amountIqd,
            'added_usd' => $amountUsd,
            'new_balance_iqd' => $customer->negative_balance_iqd,
            'new_balance_usd' => $customer->negative_balance_usd,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'هەڵە: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * دەستکاری سەرمایەی کڕیار
 */
public function editBalance(Request $request, Customer $customer)
{
    $validated = $request->validate([
        'negative_balance_iqd' => 'required|numeric|min:0',
        'negative_balance_usd' => 'required|numeric|min:0',
    ]);

    try {
        $customer->update([
            'negative_balance_iqd' => $validated['negative_balance_iqd'],
            'negative_balance_usd' => $validated['negative_balance_usd'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'سەرمایە بە سەرکەوتوویی دەستکاریکرا',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'هەڵە: ' . $e->getMessage()
        ], 500);
    }
}

public function allSalesPrint(Customer $customer, Request $request)
{
    // وەرگرتنی پارامێتەرەکان
    $currency = $request->get('currency', 'both');
    $start_date = $request->get('start_date');
    $end_date = $request->get('end_date');

    $query = $customer->sales()
        ->with([
            'user:id,name',
            'items' => function($query) {
                $query->with(['product' => function($q) {
                    $q->select('id', 'name', 'unit_type', 'unit_name');
                }])
                ->select('id', 'sale_id', 'product_id', 'quantity', 'unit_price', 'total_price', 'note');
            }
        ])
        ->select('id', 'customer_id', 'user_id', 'invoice_number', 'sale_date', 'total_amount',
                 'paid_amount', 'remaining_amount', 'currency', 'sale_type', 'notes', 'created_at');

    // فلتەرکردن بەپێی دراو
    if ($currency === 'iqd') {
        $query->where('currency', 'IQD');
    } elseif ($currency === 'usd') {
        $query->where('currency', 'USD');
    }

    // فلتەرکردن بەپێی بەروار
    if ($start_date && $end_date) {
        $query->whereBetween('sale_date', [$start_date, $end_date]);
    }

    $sales = $query->orderBy('sale_date', 'desc')->get();

    // دروستکردنی زانیاری بۆ هەر فرۆشتێک
    $sales->each(function ($sale) {
        $productCount = 0;
        $productNames = [];

        if ($sale->items && $sale->items->count() > 0) {
            foreach ($sale->items as $item) {
                $productCount += $item->quantity;

                if ($item->product) {
                    $item->product->unit_display = $item->product->unit_name ?:
                        match($item->product->unit_type) {
                            'piece' => 'دانە',
                            'kg' => 'کیلۆ',
                            'meter' => 'مەتر',
                            'liter' => 'لیتر',
                            'box' => 'قوتو',
                            'carton' => 'کارتن',
                            'packet' => 'پاکێت',
                            'bundle' => 'بەندەڵ',
                            default => 'دانە'
                        };
                    $productNames[] = $item->product->name;
                } else {
                    $item->product = (object) ['name' => 'نادیار', 'unit_display' => 'دانە'];
                    $productNames[] = 'نادیار';
                }
            }
        }

        $sale->product_count = $productCount;
        $sale->product_names = count($productNames) > 0
            ? implode('، ', array_slice($productNames, 0, 3))
            : 'هیچ بەرهەمێک';

        if (count($productNames) > 3) {
            $sale->product_names .= ' و ' . (count($productNames) - 3) . ' زیاتر';
        }
    });

    // حیسابکردنی ئامارەکان
    $stats = [
        'total_sales_count' => $sales->count(),
        'total_sales_amount' => [
            'iqd' => $sales->where('currency', 'IQD')->sum('total_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('total_amount'),
        ],
        'total_paid_amount' => [
            'iqd' => $sales->where('currency', 'IQD')->sum('paid_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('paid_amount'),
        ],
        'total_remaining_amount' => [
            'iqd' => $sales->where('currency', 'IQD')->sum('remaining_amount'),
            'usd' => $sales->where('currency', 'USD')->sum('remaining_amount'),
        ],
        'total_products_count' => $sales->sum(function($sale) {
            return $sale->product_count;
        }),
        'debt_sales_count' => $sales->where('remaining_amount', '>', 0)->count(),
    ];

    $company = [
        'name' => config('app.company_name', 'بێگلاس'),
        'phone' => config('app.company_phone', '0770 157 8023 - 0750 112 7325'),
    ];

    return Inertia::render('Customers/AllSalesPrint', [
        'customer' => $customer,
        'sales' => $sales,
        'stats' => $stats,
        'company' => $company,
        'auth' => [
            'user' => auth()->user()
        ],
        'filters' => $request->only(['currency', 'start_date', 'end_date']),
    ]);
}

}
