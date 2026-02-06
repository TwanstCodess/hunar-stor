<?php
// app/Http/Controllers/DashboardController.php
namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // فلتەرەکان
        $currency = $request->input('currency', 'all');
        $dateRange = $request->input('date_range', 'today');
        $dateFilter = $this->getDateFilter($dateRange);

        // 1. ئاماری سەرەکی
        $stats = $this->getMainStats($dateFilter, $currency);

        // 2. گرافیکی فرۆشتن
        $salesChart = $this->getSalesChart($dateFilter, $currency);

        // 3. فرۆشتنە دوایینەکان
        $recentSales = $this->getRecentSales($dateFilter, $currency);

        // 4. بەرهەمە کەمەکان
        $lowStockProducts = $this->getLowStockProducts();

        // 5. کڕیارانی زۆرترین قەرز
        $topDebtors = $this->getTopDebtors($currency);

        // 6. پڕفرۆشترین بەرهەمەکان
        $topProducts = $this->getTopProducts($dateFilter, $currency);

        // 7. باشترین کڕیاران
        $topCustomers = $this->getTopCustomers($dateFilter, $currency);

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'salesChart' => $salesChart,
            'recentSales' => $recentSales,
            'lowStockProducts' => $lowStockProducts,
            'topDebtors' => $topDebtors,
            'topProducts' => $topProducts,
            'topCustomers' => $topCustomers,
            'initialFilters' => [
                'currency' => $currency,
                'date_range' => $dateRange,
            ]
        ]);
    }

    private function getDateFilter(string $dateRange): array
    {
        $now = Carbon::now();

        switch ($dateRange) {
            case 'today':
                return [
                    'start' => $now->format('Y-m-d'),
                    'end' => $now->format('Y-m-d'),
                ];

            case 'yesterday':
                $yesterday = $now->copy()->subDay();
                return [
                    'start' => $yesterday->format('Y-m-d'),
                    'end' => $yesterday->format('Y-m-d'),
                ];

            case '7days':
                return [
                    'start' => $now->copy()->subDays(6)->format('Y-m-d'),
                    'end' => $now->format('Y-m-d'),
                ];

            case '30days':
                return [
                    'start' => $now->copy()->subDays(29)->format('Y-m-d'),
                    'end' => $now->format('Y-m-d'),
                ];

            case 'month':
                return [
                    'start' => $now->copy()->startOfMonth()->format('Y-m-d'),
                    'end' => $now->copy()->endOfMonth()->format('Y-m-d'),
                ];

            case 'last_month':
                $lastMonth = $now->copy()->subMonth();
                return [
                    'start' => $lastMonth->startOfMonth()->format('Y-m-d'),
                    'end' => $lastMonth->endOfMonth()->format('Y-m-d'),
                ];

            case 'all':
                return [
                    'start' => null,
                    'end' => null,
                ];

            default:
                return [
                    'start' => $now->copy()->subDays(6)->format('Y-m-d'),
                    'end' => $now->format('Y-m-d'),
                ];
        }
    }

    private function getMainStats(array $dateFilter, string $currency): array
    {
        // فرۆشتن
        $salesQuery = Sale::query();
        if ($dateFilter['start']) {
            $salesQuery->whereDate('sale_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $salesQuery->whereDate('sale_date', '<=', $dateFilter['end']);
        }

        $salesIQD = $currency === 'all' || $currency === 'iqd'
            ? (clone $salesQuery)->where('currency', 'IQD')->sum('total_amount') : 0;
        $salesUSD = $currency === 'all' || $currency === 'usd'
            ? (clone $salesQuery)->where('currency', 'USD')->sum('total_amount') : 0;

        // کڕین
        $purchasesQuery = Purchase::query();
        if ($dateFilter['start']) {
            $purchasesQuery->whereDate('purchase_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $purchasesQuery->whereDate('purchase_date', '<=', $dateFilter['end']);
        }

        $purchasesIQD = $currency === 'all' || $currency === 'iqd'
            ? (clone $purchasesQuery)->where('currency', 'IQD')->sum('total_amount') : 0;
        $purchasesUSD = $currency === 'all' || $currency === 'usd'
            ? (clone $purchasesQuery)->where('currency', 'USD')->sum('total_amount') : 0;

        // خەرجی
        $expensesQuery = Expense::query();
        if ($dateFilter['start']) {
            $expensesQuery->whereDate('expense_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $expensesQuery->whereDate('expense_date', '<=', $dateFilter['end']);
        }

        $expensesIQD = $currency === 'all' || $currency === 'iqd'
            ? (clone $expensesQuery)->where('currency', 'IQD')->sum('amount') : 0;
        $expensesUSD = $currency === 'all' || $currency === 'usd'
            ? (clone $expensesQuery)->where('currency', 'USD')->sum('amount') : 0;

        // قەرزەکان
        $debtIQD = $currency === 'all' || $currency === 'iqd'
            ? Customer::sum('balance_iqd') : 0;
        $debtUSD = $currency === 'all' || $currency === 'usd'
            ? Customer::sum('balance_usd') : 0;

        // ژمارەی کڕیار و بەرهەم
        $customersCount = Customer::count();
        $productsCount = Product::count();

        // فرۆشتی ئەمڕۆ
        $today = Carbon::today();
        $todaySalesIQD = Sale::whereDate('sale_date', $today)
            ->where('currency', 'IQD')
            ->sum('total_amount');
        $todaySalesUSD = Sale::whereDate('sale_date', $today)
            ->where('currency', 'USD')
            ->sum('total_amount');

        // فرۆشتی مانگ
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $monthlySalesIQD = Sale::whereBetween('sale_date', [$monthStart, $monthEnd])
            ->where('currency', 'IQD')
            ->sum('total_amount');
        $monthlySalesUSD = Sale::whereBetween('sale_date', [$monthStart, $monthEnd])
            ->where('currency', 'USD')
            ->sum('total_amount');

        return [
            'sales' => [
                'iqd' => (float) $salesIQD,
                'usd' => (float) $salesUSD,
            ],
            'purchases' => [
                'iqd' => (float) $purchasesIQD,
                'usd' => (float) $purchasesUSD,
            ],
            'expenses' => [
                'iqd' => (float) $expensesIQD,
                'usd' => (float) $expensesUSD,
            ],
            'debt' => [
                'iqd' => (float) $debtIQD,
                'usd' => (float) $debtUSD,
            ],
            'today_sales' => [
                'iqd' => (float) $todaySalesIQD,
                'usd' => (float) $todaySalesUSD,
            ],
            'monthly_sales' => [
                'iqd' => (float) $monthlySalesIQD,
                'usd' => (float) $monthlySalesUSD,
            ],
            'customers' => $customersCount,
            'products' => $productsCount,
        ];
    }

    private function getSalesChart(array $dateFilter, string $currency): array
    {
        $query = Sale::select(
            DB::raw('DATE(sale_date) as date'),
            DB::raw('SUM(CASE WHEN currency = "IQD" THEN total_amount ELSE 0 END) as iqd'),
            DB::raw('SUM(CASE WHEN currency = "USD" THEN total_amount ELSE 0 END) as usd')
        );

        if ($dateFilter['start']) {
            $query->whereDate('sale_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $query->whereDate('sale_date', '<=', $dateFilter['end']);
        }

        if ($currency === 'iqd') {
            $query->where('currency', 'IQD');
        } elseif ($currency === 'usd') {
            $query->where('currency', 'USD');
        }

        return $query->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('date')
            ->get()
            ->map(function ($item) use ($currency) {
                $data = [
                    'date' => $item->date,
                ];

                if ($currency === 'all' || $currency === 'iqd') {
                    $data['iqd'] = (float) $item->iqd;
                }
                if ($currency === 'all' || $currency === 'usd') {
                    $data['usd'] = (float) $item->usd;
                }

                return $data;
            })
            ->toArray();
    }

    private function getRecentSales(array $dateFilter, string $currency)
    {
        $query = Sale::with(['customer:id,name', 'user:id,name']);

        if ($dateFilter['start']) {
            $query->whereDate('sale_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $query->whereDate('sale_date', '<=', $dateFilter['end']);
        }

        if ($currency === 'iqd') {
            $query->where('currency', 'IQD');
        } elseif ($currency === 'usd') {
            $query->where('currency', 'USD');
        }

        return $query->latest('sale_date')
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'customer_name' => $sale->customer->name ?? 'کڕیاری ناناسراو',
                    'user_name' => $sale->user->name,
                    'total_amount' => (float) $sale->total_amount,
                    'currency' => $sale->currency,
                    'sale_type' => $sale->sale_type,
                    'sale_date' => $sale->sale_date->format('Y-m-d H:i'),
                ];
            });
    }

    private function getLowStockProducts()
    {
        return Product::where('track_stock', true)
            ->whereColumn('quantity', '<=', 'min_stock_level')
            ->with('category:id,name')
            ->orderBy('quantity', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'quantity' => (float) $product->quantity,
                    'min_stock_level' => (float) $product->min_stock_level,
                    'unit_name' => $product->unit_name,
                    'category_name' => $product->category->name ?? 'بێ کاتێگۆری',
                ];
            });
    }

    private function getTopDebtors(string $currency)
    {
        $query = Customer::where(function ($q) use ($currency) {
            if ($currency === 'iqd') {
                $q->where('balance_iqd', '>', 0);
            } elseif ($currency === 'usd') {
                $q->where('balance_usd', '>', 0);
            } else {
                $q->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
            }
        });

        if ($currency === 'iqd') {
            $query->orderBy('balance_iqd', 'desc');
        } elseif ($currency === 'usd') {
            $query->orderBy('balance_usd', 'desc');
        } else {
            $query->orderByRaw('(balance_iqd + (balance_usd * 1450)) desc');
        }

        return $query->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'balance_iqd' => (float) $customer->balance_iqd,
                    'balance_usd' => (float) $customer->balance_usd,
                ];
            });
    }

    private function getTopProducts(array $dateFilter, string $currency)
    {
        $query = DB::table('sale_items')
            ->select([
                'products.id',
                'products.name',
                'products.unit_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT sales.id) as sales_count'),
                DB::raw('SUM(sale_items.total_price) as total_revenue')
            ])
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id');

        if ($dateFilter['start']) {
            $query->whereDate('sales.sale_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $query->whereDate('sales.sale_date', '<=', $dateFilter['end']);
        }

        if ($currency === 'iqd') {
            $query->where('sales.currency', 'IQD');
        } elseif ($currency === 'usd') {
            $query->where('sales.currency', 'USD');
        }

        return $query->groupBy('products.id', 'products.name', 'products.unit_name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'unit_name' => $product->unit_name,
                    'total_quantity' => (float) $product->total_quantity,
                    'sales_count' => (int) $product->sales_count,
                    'total_revenue' => (float) $product->total_revenue,
                ];
            });
    }

    private function getTopCustomers(array $dateFilter, string $currency)
    {
        $query = DB::table('sales')
            ->select([
                'customers.id',
                'customers.name',
                'customers.phone',
                DB::raw('COUNT(sales.id) as purchase_count'),
                DB::raw('SUM(sales.total_amount) as total_spent')
            ])
            ->join('customers', 'sales.customer_id', '=', 'customers.id');

        if ($dateFilter['start']) {
            $query->whereDate('sales.sale_date', '>=', $dateFilter['start']);
        }
        if ($dateFilter['end']) {
            $query->whereDate('sales.sale_date', '<=', $dateFilter['end']);
        }

        if ($currency === 'iqd') {
            $query->where('sales.currency', 'IQD');
        } elseif ($currency === 'usd') {
            $query->where('sales.currency', 'USD');
        }

        return $query->groupBy('customers.id', 'customers.name', 'customers.phone')
            ->orderByDesc('total_spent')
            ->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'purchase_count' => (int) $customer->purchase_count,
                    'total_spent' => (float) $customer->total_spent,
                ];
            });
    }

    public function quickStats()
    {
        $today = Carbon::today();

        return response()->json([
            'today_sales' => Sale::whereDate('sale_date', $today)->sum('total_amount'),
            'today_customers' => Sale::whereDate('sale_date', $today)->distinct('customer_id')->count('customer_id'),
            'low_stock_products' => Product::whereColumn('quantity', '<=', 'min_stock_level')->count(),
            'unpaid_invoices' => Sale::where('remaining_amount', '>', 0)->count(),
        ]);
    }
}
