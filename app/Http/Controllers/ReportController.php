<?php
// app/Http/Controllers/ReportController.php
namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index');
    }

// app/Http/Controllers/ReportController.php
public function sales(Request $request)
{
    $query = Sale::with(['customer:id,name', 'user:id,name']);

    // فیلتەرەکان
    if ($request->filled('from_date')) {
        $query->whereDate('sale_date', '>=', $request->from_date);
    }
    if ($request->filled('to_date')) {
        $query->whereDate('sale_date', '<=', $request->to_date);
    }
    if ($request->filled('currency')) {
        $query->where('currency', $request->currency);
    }
    if ($request->filled('sale_type')) {
        $query->where('sale_type', $request->sale_type);
    }
    if ($request->filled('customer_id')) {
        $query->where('customer_id', $request->customer_id);
    }

    $sales = $query->latest('sale_date')->get();

    // ئامارەکان
    $stats = [
        'total_sales_iqd' => $sales->where('currency', 'IQD')->sum('total_amount') ?? 0,
        'total_sales_usd' => $sales->where('currency', 'USD')->sum('total_amount') ?? 0,
        'total_paid_iqd' => $sales->where('currency', 'IQD')->sum('paid_amount') ?? 0,
        'total_paid_usd' => $sales->where('currency', 'USD')->sum('paid_amount') ?? 0,
        'total_remaining_iqd' => $sales->where('currency', 'IQD')->sum('remaining_amount') ?? 0,
        'total_remaining_usd' => $sales->where('currency', 'USD')->sum('remaining_amount') ?? 0,
        'cash_sales_iqd' => $sales->where('currency', 'IQD')->where('sale_type', 'cash')->sum('total_amount') ?? 0,
        'cash_sales_usd' => $sales->where('currency', 'USD')->where('sale_type', 'cash')->sum('total_amount') ?? 0,
        'credit_sales_iqd' => $sales->where('currency', 'IQD')->where('sale_type', 'credit')->sum('total_amount') ?? 0,
        'credit_sales_usd' => $sales->where('currency', 'USD')->where('sale_type', 'credit')->sum('total_amount') ?? 0,
        'count' => $sales->count(),
        'cash_count' => $sales->where('sale_type', 'cash')->count(),
        'credit_count' => $sales->where('sale_type', 'credit')->count(),
    ];

    return Inertia::render('Reports/Sales', [
        'sales' => $sales,
        'stats' => $stats,
        'customers' => Customer::select('id', 'name')->get(),
        'filters' => $request->only(['from_date', 'to_date', 'currency', 'sale_type', 'customer_id']),
    ]);
}

    public function purchases(Request $request)
    {
        $query = Purchase::with(['supplier:id,name', 'user:id,name']);

        if ($request->from_date) {
            $query->whereDate('purchase_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->whereDate('purchase_date', '<=', $request->to_date);
        }

        if ($request->currency) {
            $query->where('currency', $request->currency);
        }

        if ($request->purchase_type) {
            $query->where('purchase_type', $request->purchase_type);
        }

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $purchases = $query->latest('purchase_date')->get();

        $stats = [
            'total_purchases_iqd' => $purchases->where('currency', 'IQD')->sum('total_amount'),
            'total_purchases_usd' => $purchases->where('currency', 'USD')->sum('total_amount'),
            'total_paid_iqd' => $purchases->where('currency', 'IQD')->sum('paid_amount'),
            'total_paid_usd' => $purchases->where('currency', 'USD')->sum('paid_amount'),
            'total_remaining_iqd' => $purchases->where('currency', 'IQD')->sum('remaining_amount'),
            'total_remaining_usd' => $purchases->where('currency', 'USD')->sum('remaining_amount'),
            'cash_purchases_iqd' => $purchases->where('currency', 'IQD')->where('purchase_type', 'cash')->sum('total_amount'),
            'cash_purchases_usd' => $purchases->where('currency', 'USD')->where('purchase_type', 'cash')->sum('total_amount'),
            'credit_purchases_iqd' => $purchases->where('currency', 'IQD')->where('purchase_type', 'credit')->sum('total_amount'),
            'credit_purchases_usd' => $purchases->where('currency', 'USD')->where('purchase_type', 'credit')->sum('total_amount'),
            'count' => $purchases->count(),
            'cash_count' => $purchases->where('purchase_type', 'cash')->count(),
            'credit_count' => $purchases->where('purchase_type', 'credit')->count(),
        ];

        $suppliers = Supplier::select('id', 'name')->get();

        return Inertia::render('Reports/Purchases', [
            'purchases' => $purchases,
            'stats' => $stats,
            'suppliers' => $suppliers,
            'filters' => $request->only([
                'from_date', 'to_date', 'currency', 'purchase_type', 'supplier_id'
            ]),
        ]);
    }

    public function debts()
    {
        $customers = Customer::where(function ($query) {
            $query->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
        })
        ->with(['sales' => function ($q) {
            $q->where('remaining_amount', '>', 0)
              ->select('id', 'customer_id', 'invoice_number', 'total_amount', 'remaining_amount', 'currency');
        }])
        ->select('id', 'name', 'phone', 'balance_iqd', 'balance_usd')
        ->get();

        $suppliers = Supplier::where(function ($query) {
            $query->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
        })
        ->with(['purchases' => function ($q) {
            $q->where('remaining_amount', '>', 0)
              ->select('id', 'supplier_id', 'invoice_number', 'total_amount', 'remaining_amount', 'currency');
        }])
        ->select('id', 'name', 'phone', 'balance_iqd', 'balance_usd')
        ->get();

        $stats = [
            'customer_debt_iqd' => $customers->sum('balance_iqd'),
            'customer_debt_usd' => $customers->sum('balance_usd'),
            'supplier_debt_iqd' => $suppliers->sum('balance_iqd'),
            'supplier_debt_usd' => $suppliers->sum('balance_usd'),
            'customers_count' => $customers->count(),
            'suppliers_count' => $suppliers->count(),
            'total_debt_iqd' => $customers->sum('balance_iqd') + $suppliers->sum('balance_iqd'),
            'total_debt_usd' => $customers->sum('balance_usd') + $suppliers->sum('balance_usd'),
        ];

        return Inertia::render('Reports/Debts', [
            'customers' => $customers,
            'suppliers' => $suppliers,
            'stats' => $stats,
        ]);
    }

    public function statement(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);

        $salesQuery = Sale::where('customer_id', $customer->id);
        $paymentsQuery = Payment::where('customer_id', $customer->id);

        if ($request->from_date) {
            $salesQuery->whereDate('sale_date', '>=', $request->from_date);
            $paymentsQuery->whereDate('payment_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $salesQuery->whereDate('sale_date', '<=', $request->to_date);
            $paymentsQuery->whereDate('payment_date', '<=', $request->to_date);
        }

        $sales = $salesQuery->with(['items.product', 'user:id,name'])->latest('sale_date')->get();
        $payments = $paymentsQuery->with(['user:id,name'])->latest('payment_date')->get();

        $openingBalance = [
            'iqd' => $customer->balance_iqd,
            'usd' => $customer->balance_usd,
        ];

        $transactions = collect();

        foreach ($sales as $sale) {
            $transactions->push([
                'date' => $sale->sale_date,
                'type' => 'sale',
                'description' => 'فرۆشتن: ' . $sale->invoice_number,
                'debit_iqd' => $sale->currency === 'IQD' ? $sale->total_amount : 0,
                'debit_usd' => $sale->currency === 'USD' ? $sale->total_amount : 0,
                'credit_iqd' => 0,
                'credit_usd' => 0,
                'balance_iqd' => 0,
                'balance_usd' => 0,
                'details' => $sale,
            ]);
        }

        foreach ($payments as $payment) {
            $transactions->push([
                'date' => $payment->payment_date,
                'type' => 'payment',
                'description' => 'پارەدان: ' . ($payment->sale ? $payment->sale->invoice_number : ''),
                'debit_iqd' => 0,
                'debit_usd' => 0,
                'credit_iqd' => $payment->currency === 'IQD' ? $payment->amount : 0,
                'credit_usd' => $payment->currency === 'USD' ? $payment->amount : 0,
                'balance_iqd' => 0,
                'balance_usd' => 0,
                'details' => $payment,
            ]);
        }

        $transactions = $transactions->sortBy('date');

        $runningBalanceIQD = $openingBalance['iqd'];
        $runningBalanceUSD = $openingBalance['usd'];

        foreach ($transactions as &$transaction) {
            $runningBalanceIQD += $transaction['debit_iqd'] - $transaction['credit_iqd'];
            $runningBalanceUSD += $transaction['debit_usd'] - $transaction['credit_usd'];

            $transaction['balance_iqd'] = $runningBalanceIQD;
            $transaction['balance_usd'] = $runningBalanceUSD;
        }

        $summary = [
            'opening_balance' => $openingBalance,
            'total_sales_iqd' => $sales->where('currency', 'IQD')->sum('total_amount'),
            'total_sales_usd' => $sales->where('currency', 'USD')->sum('total_amount'),
            'total_payments_iqd' => $payments->where('currency', 'IQD')->sum('amount'),
            'total_payments_usd' => $payments->where('currency', 'USD')->sum('amount'),
            'closing_balance_iqd' => $runningBalanceIQD,
            'closing_balance_usd' => $runningBalanceUSD,
        ];

        $customers = Customer::select('id', 'name', 'phone', 'balance_iqd', 'balance_usd')->get();

        return Inertia::render('Reports/Statement', [
            'customer' => $customer,
            'transactions' => $transactions->values(),
            'summary' => $summary,
            'customers' => $customers,
            'filters' => $request->only(['customer_id', 'from_date', 'to_date']),
        ]);
    }

    public function expenses(Request $request)
    {
        $query = Expense::with('user:id,name');

        if ($request->from_date) {
            $query->whereDate('expense_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->whereDate('expense_date', '<=', $request->to_date);
        }

        if ($request->currency) {
            $query->where('currency', $request->currency);
        }

        if ($request->expense_type) {
            $query->where('expense_type', $request->expense_type);
        }

        $expenses = $query->latest('expense_date')->get();

        $stats = [
            'total_iqd' => $expenses->where('currency', 'IQD')->sum('amount'),
            'total_usd' => $expenses->where('currency', 'USD')->sum('amount'),
            'count' => $expenses->count(),
            'daily_avg_iqd' => $expenses->where('currency', 'IQD')->avg('amount'),
            'daily_avg_usd' => $expenses->where('currency', 'USD')->avg('amount'),
            'by_type' => $expenses->groupBy('expense_type')->map(function ($items) {
                return [
                    'count' => $items->count(),
                    'total_iqd' => $items->where('currency', 'IQD')->sum('amount'),
                    'total_usd' => $items->where('currency', 'USD')->sum('amount'),
                ];
            }),
        ];

        return Inertia::render('Reports/Expenses', [
            'expenses' => $expenses,
            'stats' => $stats,
            'filters' => $request->only(['from_date', 'to_date', 'currency', 'expense_type']),
        ]);
    }

    public function profitLoss(Request $request)
    {
        $fromDate = $request->from_date;
        $toDate = $request->to_date;

        $salesQuery = Sale::query();
        if ($fromDate) $salesQuery->whereDate('sale_date', '>=', $fromDate);
        if ($toDate) $salesQuery->whereDate('sale_date', '<=', $toDate);

        $salesIQD = (clone $salesQuery)->where('currency', 'IQD')->sum('total_amount');
        $salesUSD = (clone $salesQuery)->where('currency', 'USD')->sum('total_amount');

        $purchasesQuery = Purchase::query();
        if ($fromDate) $purchasesQuery->whereDate('purchase_date', '>=', $fromDate);
        if ($toDate) $purchasesQuery->whereDate('purchase_date', '<=', $toDate);

        $purchasesIQD = (clone $purchasesQuery)->where('currency', 'IQD')->sum('total_amount');
        $purchasesUSD = (clone $purchasesQuery)->where('currency', 'USD')->sum('total_amount');

        $expensesQuery = Expense::query();
        if ($fromDate) $expensesQuery->whereDate('expense_date', '>=', $fromDate);
        if ($toDate) $expensesQuery->whereDate('expense_date', '<=', $toDate);

        $expensesIQD = (clone $expensesQuery)->where('currency', 'IQD')->sum('amount');
        $expensesUSD = (clone $expensesQuery)->where('currency', 'USD')->sum('amount');

        $actualProfitIQD = $salesIQD - $purchasesIQD - $expensesIQD;
        $actualProfitUSD = $salesUSD - $purchasesUSD - $expensesUSD;

        $expectedProfitIQD = 0;
        $expectedProfitUSD = 0;

        $salesItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->when($fromDate, function ($q) use ($fromDate) {
                $q->whereDate('sales.sale_date', '>=', $fromDate);
            })
            ->when($toDate, function ($q) use ($toDate) {
                $q->whereDate('sales.sale_date', '<=', $toDate);
            })
            ->select(
                'sale_items.quantity',
                'sale_items.unit_price',
                'sales.currency',
                'products.purchase_price_iqd',
                'products.purchase_price_usd'
            )
            ->get();

        foreach ($salesItems as $item) {
            if ($item->currency === 'IQD') {
                $purchasePrice = $item->purchase_price_iqd;
                $expectedProfitIQD += ($item->unit_price - $purchasePrice) * $item->quantity;
            } else {
                $purchasePrice = $item->purchase_price_usd;
                $expectedProfitUSD += ($item->unit_price - $purchasePrice) * $item->quantity;
            }
        }

        $totalSales = $salesIQD + $salesUSD;
        $totalPurchases = $purchasesIQD + $purchasesUSD;
        $totalExpenses = $expensesIQD + $expensesUSD;
        $totalActualProfit = $actualProfitIQD + $actualProfitUSD;
        $totalExpectedProfit = $expectedProfitIQD + $expectedProfitUSD;

        $grossMargin = $totalSales > 0 ? (($totalSales - $totalPurchases) / $totalSales) * 100 : 0;
        $netMargin = $totalSales > 0 ? ($totalActualProfit / $totalSales) * 100 : 0;
        $expenseRatio = $totalSales > 0 ? ($totalExpenses / $totalSales) * 100 : 0;
        $achievementRate = $totalExpectedProfit > 0 ? ($totalActualProfit / $totalExpectedProfit) * 100 : 0;

        $stats = [
            'sales' => [
                'iqd' => $salesIQD,
                'usd' => $salesUSD,
                'total' => $totalSales,
            ],
            'purchases' => [
                'iqd' => $purchasesIQD,
                'usd' => $purchasesUSD,
                'total' => $totalPurchases,
            ],
            'expenses' => [
                'iqd' => $expensesIQD,
                'usd' => $expensesUSD,
                'total' => $totalExpenses,
            ],
            'actual_profit' => [
                'iqd' => $actualProfitIQD,
                'usd' => $actualProfitUSD,
                'total' => $totalActualProfit,
            ],
            'expected_profit' => [
                'iqd' => $expectedProfitIQD,
                'usd' => $expectedProfitUSD,
                'total' => $totalExpectedProfit,
            ],
            'profit_difference' => [
                'iqd' => $actualProfitIQD - $expectedProfitIQD,
                'usd' => $actualProfitUSD - $expectedProfitUSD,
                'total' => $totalActualProfit - $totalExpectedProfit,
            ],
            'margins' => [
                'gross_margin' => $grossMargin,
                'net_margin' => $netMargin,
                'expense_ratio' => $expenseRatio,
                'achievement_rate' => $achievementRate,
            ],
        ];

        return Inertia::render('Reports/ProfitLoss', [
            'stats' => $stats,
            'filters' => $request->only(['from_date', 'to_date']),
        ]);
    }

    public function inventory()
    {
        $products = Product::with(['category:id,name', 'baseUnit:id,name'])
            ->where('track_stock', true)
            ->orderBy('quantity', 'asc')
            ->get();

        $outOfStock = $products->where('quantity', 0);
        $lowStock = $products->where('quantity', '>', 0)
                            ->where('quantity', '<=', DB::raw('min_stock_level'));
        $inStock = $products->where('quantity', '>', DB::raw('min_stock_level'));

        $totalValueIQD = $products->sum(function ($product) {
            return $product->quantity * $product->purchase_price_iqd;
        });

        $totalValueUSD = $products->sum(function ($product) {
            return $product->quantity * $product->purchase_price_usd;
        });

        $stats = [
            'total_products' => $products->count(),
            'total_value_iqd' => $totalValueIQD,
            'total_value_usd' => $totalValueUSD,
            'total_value' => $totalValueIQD + $totalValueUSD,
            'low_stock_products' => $lowStock->count(),
            'out_of_stock_products' => $outOfStock->count(),
            'in_stock_products' => $inStock->count(),
            'by_category' => $products->groupBy('category.name')->map(function ($items) {
                return [
                    'count' => $items->count(),
                    'value_iqd' => $items->sum(function ($p) {
                        return $p->quantity * $p->purchase_price_iqd;
                    }),
                    'value_usd' => $items->sum(function ($p) {
                        return $p->quantity * $p->purchase_price_usd;
                    }),
                ];
            }),
        ];

        return Inertia::render('Reports/Inventory', [
            'products' => $products,
            'stats' => $stats,
        ]);
    }

    public function general(Request $request)
    {
        $fromDate = $request->from_date ?? Carbon::now()->subMonth()->format('Y-m-d');
        $toDate = $request->to_date ?? Carbon::now()->format('Y-m-d');

        $salesIQD = Sale::whereBetween('sale_date', [$fromDate, $toDate])
            ->where('currency', 'IQD')->sum('total_amount');
        $salesUSD = Sale::whereBetween('sale_date', [$fromDate, $toDate])
            ->where('currency', 'USD')->sum('total_amount');

        $purchasesIQD = Purchase::whereBetween('purchase_date', [$fromDate, $toDate])
            ->where('currency', 'IQD')->sum('total_amount');
        $purchasesUSD = Purchase::whereBetween('purchase_date', [$fromDate, $toDate])
            ->where('currency', 'USD')->sum('total_amount');

        $expensesIQD = Expense::whereBetween('expense_date', [$fromDate, $toDate])
            ->where('currency', 'IQD')->sum('amount');
        $expensesUSD = Expense::whereBetween('expense_date', [$fromDate, $toDate])
            ->where('currency', 'USD')->sum('amount');

        $customerDebtIQD = Customer::sum('balance_iqd');
        $customerDebtUSD = Customer::sum('balance_usd');
        $supplierDebtIQD = Supplier::sum('balance_iqd');
        $supplierDebtUSD = Supplier::sum('balance_usd');

        $inventoryValue = Product::where('track_stock', true)
            ->sum(DB::raw('quantity * purchase_price_iqd'));

        $cashSalesCount = Sale::whereBetween('sale_date', [$fromDate, $toDate])
            ->where('sale_type', 'cash')->count();
        $creditSalesCount = Sale::whereBetween('sale_date', [$fromDate, $toDate])
            ->where('sale_type', 'credit')->count();

        $totalSales = $salesIQD + $salesUSD;
        $totalPurchases = $purchasesIQD + $purchasesUSD;
        $totalExpenses = $expensesIQD + $expensesUSD;
        $netProfit = $totalSales - $totalPurchases - $totalExpenses;
        $days = max(Carbon::parse($fromDate)->diffInDays(Carbon::parse($toDate)), 1);

        $stats = [
            'sales' => [
                'iqd' => $salesIQD,
                'usd' => $salesUSD,
                'total' => $totalSales,
            ],
            'purchases' => [
                'iqd' => $purchasesIQD,
                'usd' => $purchasesUSD,
                'total' => $totalPurchases,
            ],
            'expenses' => [
                'iqd' => $expensesIQD,
                'usd' => $expensesUSD,
                'total' => $totalExpenses,
            ],
            'customer_debt' => [
                'iqd' => $customerDebtIQD,
                'usd' => $customerDebtUSD,
                'total' => $customerDebtIQD + $customerDebtUSD,
            ],
            'supplier_debt' => [
                'iqd' => $supplierDebtIQD,
                'usd' => $supplierDebtUSD,
                'total' => $supplierDebtIQD + $supplierDebtUSD,
            ],
            'inventory' => [
                'value' => $inventoryValue,
                'products_count' => Product::count(),
                'tracked_products' => Product::where('track_stock', true)->count(),
            ],
            'net_profit' => $netProfit,
            'daily_average' => $totalSales / $days,
            'transactions' => [
                'total' => $cashSalesCount + $creditSalesCount,
                'cash' => $cashSalesCount,
                'credit' => $creditSalesCount,
            ],
            'margins' => [
                'gross_margin' => $totalSales > 0 ? (($totalSales - $totalPurchases) / $totalSales) * 100 : 0,
                'net_margin' => $totalSales > 0 ? ($netProfit / $totalSales) * 100 : 0,
                'expense_ratio' => $totalSales > 0 ? ($totalExpenses / $totalSales) * 100 : 0,
            ],
        ];

        $recommendations = [];

        if ($stats['customer_debt']['total'] > ($totalSales * 0.3)) {
            $recommendations[] = 'قەرزی کڕیاران زۆرە (' . number_format(($stats['customer_debt']['total'] / $totalSales) * 100, 1) . '%)، پێویستە پارەی ماوە کۆبکەرەوە';
        }

        if ($stats['margins']['net_margin'] < 10) {
            $recommendations[] = 'قازانجی کەمە (' . number_format($stats['margins']['net_margin'], 1) . '%)، پێویستە نرخی کڕین کەم بکەیەوە یان نرخی فرۆشتن زیاد بکە';
        }

        if ($stats['margins']['expense_ratio'] > 30) {
            $recommendations[] = 'خەرجیەکان زۆرن (' . number_format($stats['margins']['expense_ratio'], 1) . '%)، پێویستە کەم بکرێنەوە';
        }

        if ($stats['inventory']['tracked_products'] > 0 &&
            $stats['inventory']['value'] < ($totalSales * 0.1)) {
            $recommendations[] = 'کۆگاکە کەمە، پێویستە کاڵای زیاتر بکڕدرێت';
        }

        return Inertia::render('Reports/General', [
            'stats' => $stats,
            'recommendations' => $recommendations,
            'filters' => ['from_date' => $fromDate, 'to_date' => $toDate],
        ]);
    }

    public function exportPdf($report, Request $request)
    {
        $data = [];
        $filename = 'report-' . $report . '-' . Carbon::now()->format('Y-m-d') . '.pdf';
        $view = '';

        switch ($report) {
            case 'sales':
                $query = Sale::with(['customer', 'user']);
                if ($request->from_date) $query->whereDate('sale_date', '>=', $request->from_date);
                if ($request->to_date) $query->whereDate('sale_date', '<=', $request->to_date);
                if ($request->currency) $query->where('currency', $request->currency);
                if ($request->sale_type) $query->where('sale_type', $request->sale_type);
                if ($request->customer_id) $query->where('customer_id', $request->customer_id);

                $sales = $query->get();

                $stats = [
                    'total_sales_iqd' => $sales->where('currency', 'IQD')->sum('total_amount'),
                    'total_sales_usd' => $sales->where('currency', 'USD')->sum('total_amount'),
                    'total_paid_iqd' => $sales->where('currency', 'IQD')->sum('paid_amount'),
                    'total_paid_usd' => $sales->where('currency', 'USD')->sum('paid_amount'),
                    'total_remaining_iqd' => $sales->where('currency', 'IQD')->sum('remaining_amount'),
                    'total_remaining_usd' => $sales->where('currency', 'USD')->sum('remaining_amount'),
                    'cash_sales_iqd' => $sales->where('currency', 'IQD')->where('sale_type', 'cash')->sum('total_amount'),
                    'cash_sales_usd' => $sales->where('currency', 'USD')->where('sale_type', 'cash')->sum('total_amount'),
                    'credit_sales_iqd' => $sales->where('currency', 'IQD')->where('sale_type', 'credit')->sum('total_amount'),
                    'credit_sales_usd' => $sales->where('currency', 'USD')->where('sale_type', 'credit')->sum('total_amount'),
                    'count' => $sales->count(),
                    'cash_count' => $sales->where('sale_type', 'cash')->count(),
                    'credit_count' => $sales->where('sale_type', 'credit')->count(),
                ];

                $data['sales'] = $sales;
                $data['stats'] = $stats;
                $data['filters'] = $request->all();
                $data['type'] = 'فرۆشتن';
                $data['report_title'] = 'ڕاپۆرتی فرۆشتن';
                $view = 'reports.sales-pdf';
                break;

            case 'purchases':
                $query = Purchase::with(['supplier', 'user']);
                if ($request->from_date) $query->whereDate('purchase_date', '>=', $request->from_date);
                if ($request->to_date) $query->whereDate('purchase_date', '<=', $request->to_date);
                if ($request->currency) $query->where('currency', $request->currency);
                if ($request->purchase_type) $query->where('purchase_type', $request->purchase_type);
                if ($request->supplier_id) $query->where('supplier_id', $request->supplier_id);

                $purchases = $query->get();

                $stats = [
                    'total_purchases_iqd' => $purchases->where('currency', 'IQD')->sum('total_amount'),
                    'total_purchases_usd' => $purchases->where('currency', 'USD')->sum('total_amount'),
                    'total_paid_iqd' => $purchases->where('currency', 'IQD')->sum('paid_amount'),
                    'total_paid_usd' => $purchases->where('currency', 'USD')->sum('paid_amount'),
                    'total_remaining_iqd' => $purchases->where('currency', 'IQD')->sum('remaining_amount'),
                    'total_remaining_usd' => $purchases->where('currency', 'USD')->sum('remaining_amount'),
                    'cash_purchases_iqd' => $purchases->where('currency', 'IQD')->where('purchase_type', 'cash')->sum('total_amount'),
                    'cash_purchases_usd' => $purchases->where('currency', 'USD')->where('purchase_type', 'cash')->sum('total_amount'),
                    'credit_purchases_iqd' => $purchases->where('currency', 'IQD')->where('purchase_type', 'credit')->sum('total_amount'),
                    'credit_purchases_usd' => $purchases->where('currency', 'USD')->where('purchase_type', 'credit')->sum('total_amount'),
                    'count' => $purchases->count(),
                    'cash_count' => $purchases->where('purchase_type', 'cash')->count(),
                    'credit_count' => $purchases->where('purchase_type', 'credit')->count(),
                ];

                $data['purchases'] = $purchases;
                $data['stats'] = $stats;
                $data['filters'] = $request->all();
                $data['type'] = 'کڕین';
                $data['report_title'] = 'ڕاپۆرتی کڕین';
                $view = 'reports.purchases-pdf';
                break;

            case 'debts':
                $customers = Customer::where(function ($q) {
                    $q->where('balance_iqd', '>', 0)->orWhere('balance_usd', '>', 0);
                })->get();

                $suppliers = Supplier::where(function ($q) {
                    $q->where('balance_iqd', '>', 0)->orWhere('balance_usd', '>', 0);
                })->get();

                $stats = [
                    'customer_debt_iqd' => $customers->sum('balance_iqd'),
                    'customer_debt_usd' => $customers->sum('balance_usd'),
                    'supplier_debt_iqd' => $suppliers->sum('balance_iqd'),
                    'supplier_debt_usd' => $suppliers->sum('balance_usd'),
                    'customers_count' => $customers->count(),
                    'suppliers_count' => $suppliers->count(),
                    'total_debt_iqd' => $customers->sum('balance_iqd') + $suppliers->sum('balance_iqd'),
                    'total_debt_usd' => $customers->sum('balance_usd') + $suppliers->sum('balance_usd'),
                ];

                $data['customers'] = $customers;
                $data['suppliers'] = $suppliers;
                $data['stats'] = $stats;
                $data['type'] = 'قەرز';
                $data['report_title'] = 'ڕاپۆرتی قەرزەکان';
                $view = 'reports.debts-pdf';
                break;

            case 'expenses':
                $query = Expense::with('user');
                if ($request->from_date) $query->whereDate('expense_date', '>=', $request->from_date);
                if ($request->to_date) $query->whereDate('expense_date', '<=', $request->to_date);
                if ($request->currency) $query->where('currency', $request->currency);
                if ($request->expense_type) $query->where('expense_type', $request->expense_type);

                $expenses = $query->get();

                $stats = [
                    'total_iqd' => $expenses->where('currency', 'IQD')->sum('amount'),
                    'total_usd' => $expenses->where('currency', 'USD')->sum('amount'),
                    'count' => $expenses->count(),
                    'daily_avg_iqd' => $expenses->where('currency', 'IQD')->avg('amount'),
                    'daily_avg_usd' => $expenses->where('currency', 'USD')->avg('amount'),
                    'by_type' => $expenses->groupBy('expense_type')->map(function ($items) {
                        return [
                            'count' => $items->count(),
                            'total_iqd' => $items->where('currency', 'IQD')->sum('amount'),
                            'total_usd' => $items->where('currency', 'USD')->sum('amount'),
                        ];
                    }),
                ];

                $data['expenses'] = $expenses;
                $data['stats'] = $stats;
                $data['filters'] = $request->all();
                $data['type'] = 'خەرجی';
                $data['report_title'] = 'ڕاپۆرتی خەرجی';
                $view = 'reports.expenses-pdf';
                break;

            case 'profit-loss':
                $fromDate = $request->from_date;
                $toDate = $request->to_date;

                $salesQuery = Sale::query();
                if ($fromDate) $salesQuery->whereDate('sale_date', '>=', $fromDate);
                if ($toDate) $salesQuery->whereDate('sale_date', '<=', $toDate);

                $salesIQD = (clone $salesQuery)->where('currency', 'IQD')->sum('total_amount');
                $salesUSD = (clone $salesQuery)->where('currency', 'USD')->sum('total_amount');

                $purchasesQuery = Purchase::query();
                if ($fromDate) $purchasesQuery->whereDate('purchase_date', '>=', $fromDate);
                if ($toDate) $purchasesQuery->whereDate('purchase_date', '<=', $toDate);

                $purchasesIQD = (clone $purchasesQuery)->where('currency', 'IQD')->sum('total_amount');
                $purchasesUSD = (clone $purchasesQuery)->where('currency', 'USD')->sum('total_amount');

                $expensesQuery = Expense::query();
                if ($fromDate) $expensesQuery->whereDate('expense_date', '>=', $fromDate);
                if ($toDate) $expensesQuery->whereDate('expense_date', '<=', $toDate);

                $expensesIQD = (clone $expensesQuery)->where('currency', 'IQD')->sum('amount');
                $expensesUSD = (clone $expensesQuery)->where('currency', 'USD')->sum('amount');

                $actualProfitIQD = $salesIQD - $purchasesIQD - $expensesIQD;
                $actualProfitUSD = $salesUSD - $purchasesUSD - $expensesUSD;

                $expectedProfitIQD = 0;
                $expectedProfitUSD = 0;

                $salesItems = DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('products', 'sale_items.product_id', '=', 'products.id')
                    ->when($fromDate, function ($q) use ($fromDate) {
                        $q->whereDate('sales.sale_date', '>=', $fromDate);
                    })
                    ->when($toDate, function ($q) use ($toDate) {
                        $q->whereDate('sales.sale_date', '<=', $toDate);
                    })
                    ->select(
                        'sale_items.quantity',
                        'sale_items.unit_price',
                        'sales.currency',
                        'products.purchase_price_iqd',
                        'products.purchase_price_usd'
                    )
                    ->get();

                foreach ($salesItems as $item) {
                    if ($item->currency === 'IQD') {
                        $purchasePrice = $item->purchase_price_iqd;
                        $expectedProfitIQD += ($item->unit_price - $purchasePrice) * $item->quantity;
                    } else {
                        $purchasePrice = $item->purchase_price_usd;
                        $expectedProfitUSD += ($item->unit_price - $purchasePrice) * $item->quantity;
                    }
                }

                $totalSales = $salesIQD + $salesUSD;
                $totalPurchases = $purchasesIQD + $purchasesUSD;
                $totalExpenses = $expensesIQD + $expensesUSD;
                $totalActualProfit = $actualProfitIQD + $actualProfitUSD;
                $totalExpectedProfit = $expectedProfitIQD + $expectedProfitUSD;

                $grossMargin = $totalSales > 0 ? (($totalSales - $totalPurchases) / $totalSales) * 100 : 0;
                $netMargin = $totalSales > 0 ? ($totalActualProfit / $totalSales) * 100 : 0;
                $expenseRatio = $totalSales > 0 ? ($totalExpenses / $totalSales) * 100 : 0;
                $achievementRate = $totalExpectedProfit > 0 ? ($totalActualProfit / $totalExpectedProfit) * 100 : 0;

                $stats = [
                    'sales' => [
                        'iqd' => $salesIQD,
                        'usd' => $salesUSD,
                        'total' => $totalSales,
                    ],
                    'purchases' => [
                        'iqd' => $purchasesIQD,
                        'usd' => $purchasesUSD,
                        'total' => $totalPurchases,
                    ],
                    'expenses' => [
                        'iqd' => $expensesIQD,
                        'usd' => $expensesUSD,
                        'total' => $totalExpenses,
                    ],
                    'actual_profit' => [
                        'iqd' => $actualProfitIQD,
                        'usd' => $actualProfitUSD,
                        'total' => $totalActualProfit,
                    ],
                    'expected_profit' => [
                        'iqd' => $expectedProfitIQD,
                        'usd' => $expectedProfitUSD,
                        'total' => $totalExpectedProfit,
                    ],
                    'profit_difference' => [
                        'iqd' => $actualProfitIQD - $expectedProfitIQD,
                        'usd' => $actualProfitUSD - $expectedProfitUSD,
                        'total' => $totalActualProfit - $totalExpectedProfit,
                    ],
                    'margins' => [
                        'gross_margin' => $grossMargin,
                        'net_margin' => $netMargin,
                        'expense_ratio' => $expenseRatio,
                        'achievement_rate' => $achievementRate,
                    ],
                ];

                $data['stats'] = $stats;
                $data['filters'] = $request->all();
                $data['type'] = 'قازانج و زیان';
                $data['report_title'] = 'ڕاپۆرتی قازانج و زیان';
                $view = 'reports.profit-loss-pdf';
                break;

            case 'inventory':
                $products = Product::with(['category', 'baseUnit'])
                    ->where('track_stock', true)
                    ->orderBy('quantity', 'asc')
                    ->get();

                $outOfStock = $products->where('quantity', 0);
                $lowStock = $products->where('quantity', '>', 0)
                                    ->where('quantity', '<=', DB::raw('min_stock_level'));
                $inStock = $products->where('quantity', '>', DB::raw('min_stock_level'));

                $totalValueIQD = $products->sum(function ($product) {
                    return $product->quantity * $product->purchase_price_iqd;
                });

                $totalValueUSD = $products->sum(function ($product) {
                    return $product->quantity * $product->purchase_price_usd;
                });

                $stats = [
                    'total_products' => $products->count(),
                    'total_value_iqd' => $totalValueIQD,
                    'total_value_usd' => $totalValueUSD,
                    'total_value' => $totalValueIQD + $totalValueUSD,
                    'low_stock_products' => $lowStock->count(),
                    'out_of_stock_products' => $outOfStock->count(),
                    'in_stock_products' => $inStock->count(),
                    'by_category' => $products->groupBy('category.name')->map(function ($items) {
                        return [
                            'count' => $items->count(),
                            'value_iqd' => $items->sum(function ($p) {
                                return $p->quantity * $p->purchase_price_iqd;
                            }),
                            'value_usd' => $items->sum(function ($p) {
                                return $p->quantity * $p->purchase_price_usd;
                            }),
                        ];
                    }),
                ];

                $data['products'] = $products;
                $data['stats'] = $stats;
                $data['type'] = 'کۆگا';
                $data['report_title'] = 'ڕاپۆرتی کۆگا';
                $view = 'reports.inventory-pdf';
                break;

            case 'customer-statement':
                $validated = $request->validate([
                    'customer_id' => 'required|exists:customers,id',
                    'from_date' => 'nullable|date',
                    'to_date' => 'nullable|date',
                ]);

                $customer = Customer::findOrFail($validated['customer_id']);

                $salesQuery = Sale::where('customer_id', $customer->id);
                $paymentsQuery = Payment::where('customer_id', $customer->id);

                if ($request->from_date) {
                    $salesQuery->whereDate('sale_date', '>=', $request->from_date);
                    $paymentsQuery->whereDate('payment_date', '>=', $request->from_date);
                }

                if ($request->to_date) {
                    $salesQuery->whereDate('sale_date', '<=', $request->to_date);
                    $paymentsQuery->whereDate('payment_date', '<=', $request->to_date);
                }

                $sales = $salesQuery->with('items.product')->latest('sale_date')->get();
                $payments = $paymentsQuery->latest('payment_date')->get();

                $openingBalance = [
                    'iqd' => $customer->balance_iqd,
                    'usd' => $customer->balance_usd,
                ];

                $transactions = collect();

                foreach ($sales as $sale) {
                    $transactions->push([
                        'date' => $sale->sale_date,
                        'type' => 'sale',
                        'description' => 'فرۆشتن: ' . $sale->invoice_number,
                        'debit_iqd' => $sale->currency === 'IQD' ? $sale->total_amount : 0,
                        'debit_usd' => $sale->currency === 'USD' ? $sale->total_amount : 0,
                        'credit_iqd' => 0,
                        'credit_usd' => 0,
                        'balance_iqd' => 0,
                        'balance_usd' => 0,
                        'details' => $sale,
                    ]);
                }

                foreach ($payments as $payment) {
                    $transactions->push([
                        'date' => $payment->payment_date,
                        'type' => 'payment',
                        'description' => 'پارەدان: ' . ($payment->sale ? $payment->sale->invoice_number : ''),
                        'debit_iqd' => 0,
                        'debit_usd' => 0,
                        'credit_iqd' => $payment->currency === 'IQD' ? $payment->amount : 0,
                        'credit_usd' => $payment->currency === 'USD' ? $payment->amount : 0,
                        'balance_iqd' => 0,
                        'balance_usd' => 0,
                        'details' => $payment,
                    ]);
                }

                $transactions = $transactions->sortBy('date');

                $runningBalanceIQD = $openingBalance['iqd'];
                $runningBalanceUSD = $openingBalance['usd'];

                foreach ($transactions as &$transaction) {
                    $runningBalanceIQD += $transaction['debit_iqd'] - $transaction['credit_iqd'];
                    $runningBalanceUSD += $transaction['debit_usd'] - $transaction['credit_usd'];

                    $transaction['balance_iqd'] = $runningBalanceIQD;
                    $transaction['balance_usd'] = $runningBalanceUSD;
                }

                $summary = [
                    'opening_balance' => $openingBalance,
                    'total_sales_iqd' => $sales->where('currency', 'IQD')->sum('total_amount'),
                    'total_sales_usd' => $sales->where('currency', 'USD')->sum('total_amount'),
                    'total_payments_iqd' => $payments->where('currency', 'IQD')->sum('amount'),
                    'total_payments_usd' => $payments->where('currency', 'USD')->sum('amount'),
                    'closing_balance_iqd' => $runningBalanceIQD,
                    'closing_balance_usd' => $runningBalanceUSD,
                ];

                $data['customer'] = $customer;
                $data['transactions'] = $transactions->values();
                $data['summary'] = $summary;
                $data['filters'] = $request->all();
                $data['type'] = 'کەشفی حساب';
                $data['report_title'] = 'ڕاپۆرتی کەشفی حساب';
                $view = 'reports.statement-pdf';
                break;

            case 'general':
                $fromDate = $request->from_date ?? Carbon::now()->subMonth()->format('Y-m-d');
                $toDate = $request->to_date ?? Carbon::now()->format('Y-m-d');

                $salesIQD = Sale::whereBetween('sale_date', [$fromDate, $toDate])
                    ->where('currency', 'IQD')->sum('total_amount');
                $salesUSD = Sale::whereBetween('sale_date', [$fromDate, $toDate])
                    ->where('currency', 'USD')->sum('total_amount');

                $purchasesIQD = Purchase::whereBetween('purchase_date', [$fromDate, $toDate])
                    ->where('currency', 'IQD')->sum('total_amount');
                $purchasesUSD = Purchase::whereBetween('purchase_date', [$fromDate, $toDate])
                    ->where('currency', 'USD')->sum('total_amount');

                $expensesIQD = Expense::whereBetween('expense_date', [$fromDate, $toDate])
                    ->where('currency', 'IQD')->sum('amount');
                $expensesUSD = Expense::whereBetween('expense_date', [$fromDate, $toDate])
                    ->where('currency', 'USD')->sum('amount');

                $customerDebtIQD = Customer::sum('balance_iqd');
                $customerDebtUSD = Customer::sum('balance_usd');
                $supplierDebtIQD = Supplier::sum('balance_iqd');
                $supplierDebtUSD = Supplier::sum('balance_usd');

                $inventoryValue = Product::where('track_stock', true)
                    ->sum(DB::raw('quantity * purchase_price_iqd'));

                $cashSalesCount = Sale::whereBetween('sale_date', [$fromDate, $toDate])
                    ->where('sale_type', 'cash')->count();
                $creditSalesCount = Sale::whereBetween('sale_date', [$fromDate, $toDate])
                    ->where('sale_type', 'credit')->count();

                $totalSales = $salesIQD + $salesUSD;
                $totalPurchases = $purchasesIQD + $purchasesUSD;
                $totalExpenses = $expensesIQD + $expensesUSD;
                $netProfit = $totalSales - $totalPurchases - $totalExpenses;
                $days = max(Carbon::parse($fromDate)->diffInDays(Carbon::parse($toDate)), 1);

                $stats = [
                    'sales' => [
                        'iqd' => $salesIQD,
                        'usd' => $salesUSD,
                        'total' => $totalSales,
                    ],
                    'purchases' => [
                        'iqd' => $purchasesIQD,
                        'usd' => $purchasesUSD,
                        'total' => $totalPurchases,
                    ],
                    'expenses' => [
                        'iqd' => $expensesIQD,
                        'usd' => $expensesUSD,
                        'total' => $totalExpenses,
                    ],
                    'customer_debt' => [
                        'iqd' => $customerDebtIQD,
                        'usd' => $customerDebtUSD,
                        'total' => $customerDebtIQD + $customerDebtUSD,
                    ],
                    'supplier_debt' => [
                        'iqd' => $supplierDebtIQD,
                        'usd' => $supplierDebtUSD,
                        'total' => $supplierDebtIQD + $supplierDebtUSD,
                    ],
                    'inventory' => [
                        'value' => $inventoryValue,
                        'products_count' => Product::count(),
                        'tracked_products' => Product::where('track_stock', true)->count(),
                    ],
                    'net_profit' => $netProfit,
                    'daily_average' => $totalSales / $days,
                    'transactions' => [
                        'total' => $cashSalesCount + $creditSalesCount,
                        'cash' => $cashSalesCount,
                        'credit' => $creditSalesCount,
                    ],
                    'margins' => [
                        'gross_margin' => $totalSales > 0 ? (($totalSales - $totalPurchases) / $totalSales) * 100 : 0,
                        'net_margin' => $totalSales > 0 ? ($netProfit / $totalSales) * 100 : 0,
                        'expense_ratio' => $totalSales > 0 ? ($totalExpenses / $totalSales) * 100 : 0,
                    ],
                ];

                $recommendations = [];

                if ($stats['customer_debt']['total'] > ($totalSales * 0.3)) {
                    $recommendations[] = 'قەرزی کڕیاران زۆرە، پێویستە پارەی ماوە کۆبکەرەوە';
                }

                if ($stats['margins']['net_margin'] < 10) {
                    $recommendations[] = 'قازانجی کەمە، پێویستە نرخی کڕین کەم بکەیەوە یان نرخی فرۆشتن زیاد بکە';
                }

                if ($stats['margins']['expense_ratio'] > 30) {
                    $recommendations[] = 'خەرجیەکان زۆرن، پێویستە کەم بکرێنەوە';
                }

                $data['stats'] = $stats;
                $data['recommendations'] = $recommendations;
                $data['filters'] = $request->all();
                $data['type'] = 'گشتی';
                $data['report_title'] = 'ڕاپۆرتی گشتی';
                $view = 'reports.general-pdf';
                break;

            default:
                abort(404, 'ڕاپۆرت نەدۆزرایەوە');
        }

        $data['report_date'] = Carbon::now()->format('Y-m-d H:i:s');
        $data['generated_by'] = auth()->user()->name ?? 'سیستەم';

        // Generate PDF
        $pdf = Pdf::loadView($view, $data);

        // Set paper size and orientation
        $orientation = in_array($report, ['inventory', 'debts']) ? 'landscape' : 'portrait';
        $pdf->setPaper('A4', $orientation);

        // Stream the PDF for download
        return $pdf->stream($filename);
    }
}
