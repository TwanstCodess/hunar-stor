<?php

namespace App\Http\Controllers;

use App\Models\balance;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BalanceController extends Controller
{
    /**
     * نیشاندانی هەموو باڵانسەکان
     */
    public function index(Request $request)
    {
        // 1. یەکەم کۆتا باڵانس بۆ هەر کڕیارێک بەدوایەوە
        $latestBalancesSubquery = balance::selectRaw('MAX(id) as max_id, customer_id, currency')
            ->groupBy('customer_id', 'currency');

        // 2. پەیوەستکردنی کۆتا باڵانسەکان
        $query = balance::with('customer')
            ->joinSub($latestBalancesSubquery, 'latest_balances', function ($join) {
                $join->on('balances.id', '=', 'latest_balances.max_id');
            })
            ->select('balances.*')
            ->orderBy('balances.created_at', 'desc');

        // 3. فیلتەر بۆ گەڕان
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('note', 'like', "%{$search}%");
            });
        }

        // 4. فیلتەر بۆ دراو
        if ($request->filled('currency')) {
            $query->where('balances.currency', $request->currency);
        }

        // 5. فیلتەر بۆ بەروار
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('balances.created_at', [
                $request->from_date . ' 00:00:00',
                $request->to_date . ' 23:59:59'
            ]);
        }

        // 6. گروپکردن بەپێی کڕیار و دراو
        $balances = $query->paginate(20);

        // 7. زانیاری تایبەت بۆ نمایش
        $formattedBalances = $balances->getCollection()->map(function ($balance) {
            // کۆتا باڵانسەکانی تر بۆ هەمان کڕیار
            $customerTotalIqd = balance::where('customer_id', $balance->customer_id)
                ->where('currency', 'IQD')
                ->sum('amount');

            $customerTotalUsd = balance::where('customer_id', $balance->customer_id)
                ->where('currency', 'USD')
                ->sum('amount');

            $customerBalanceCount = balance::where('customer_id', $balance->customer_id)
                ->count();

            // کۆتا تۆمارەکانی تر بۆ هەمان کڕیار
            $latestBalances = balance::where('customer_id', $balance->customer_id)
                ->latest()
                ->get()
                ->groupBy('currency')
                ->map(function ($group) {
                    return $group->first();
                });

            return [
                'id' => $balance->id,
                'customer_id' => $balance->customer_id,
                'amount' => (float) $balance->amount,
                'currency' => $balance->currency,
                'note' => $balance->note,
                'before_balance' => (float) $balance->before_balance,
                'after_balance' => (float) $balance->after_balance,
                'created_at' => $balance->created_at,
                'updated_at' => $balance->updated_at,
                'customer' => $balance->customer ? [
                    'id' => $balance->customer->id,
                    'name' => $balance->customer->name,
                    'phone' => $balance->customer->phone,
                    'email' => $balance->customer->email,
                ] : null,
                'customer_totals' => [
                    'iqd' => (float) $customerTotalIqd,
                    'usd' => (float) $customerTotalUsd,
                    'count' => $customerBalanceCount,
                ],
                'latest_balances' => $latestBalances->map(function ($latest) {
                    return [
                        'id' => $latest->id,
                        'amount' => (float) $latest->amount,
                        'currency' => $latest->currency,
                        'after_balance' => (float) $latest->after_balance,
                    ];
                })
            ];
        });

        // 8. کۆی گشتی بۆ فیلتەرەکان
        $totalQuery = balance::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $totalQuery->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('note', 'like', "%{$search}%");
            });
        }

        if ($request->filled('currency')) {
            $totalQuery->where('currency', $request->currency);
        }

        if ($request->filled('from_date') && $request->filled('to_date')) {
            $totalQuery->whereBetween('created_at', [
                $request->from_date . ' 00:00:00',
                $request->to_date . ' 23:59:59'
            ]);
        }

        $totalAmount = $totalQuery->sum('amount');
        $totalIqd = $totalQuery->clone()->where('currency', 'IQD')->sum('amount');
        $totalUsd = $totalQuery->clone()->where('currency', 'USD')->sum('amount');

        // 9. داتاکان بگەڕێنەوە بە پەڕینەیشن
        $balances->setCollection($formattedBalances);

        return Inertia::render('Balances/Index', [
            'balances' => $balances,
            'filters' => $request->only(['search', 'currency', 'from_date', 'to_date']),
            'totals' => [
                'total' => (float) $totalAmount,
                'iqd' => (float) $totalIqd,
                'usd' => (float) $totalUsd,
                'count' => $balances->total()
            ]
        ]);
    }

    /**
     * پەڕەی پیشاندان بۆ کڕیاری دیاریکراو
     */
    public function showCustomerBalances(Request $request, $customerId)
    {
        $customer = Customer::findOrFail($customerId);

        $query = $customer->balances()->with('customer')->latest();

        // فیلتەر بۆ دراو
        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        // فیلتەر بۆ بەروار
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('created_at', [
                $request->from_date . ' 00:00:00',
                $request->to_date . ' 23:59:59'
            ]);
        }

        $balances = $query->paginate(30);

        // کۆی گشتی بۆ کڕیار
        $totalIqd = $customer->balances()->where('currency', 'IQD')->sum('amount');
        $totalUsd = $customer->balances()->where('currency', 'USD')->sum('amount');
        $totalCount = $customer->balances()->count();

        // کۆی گشتی بەپێی فیلتەر
        $filteredQuery = $customer->balances();
        if ($request->filled('currency')) {
            $filteredQuery->where('currency', $request->currency);
        }
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $filteredQuery->whereBetween('created_at', [
                $request->from_date . ' 00:00:00',
                $request->to_date . ' 23:59:59'
            ]);
        }

        $filteredIqd = $filteredQuery->clone()->where('currency', 'IQD')->sum('amount');
        $filteredUsd = $filteredQuery->clone()->where('currency', 'USD')->sum('amount');
        $filteredCount = $filteredQuery->count();

        return Inertia::render('Balances/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'balance_iqd' => (float) $customer->balance_iqd,
                'balance_usd' => (float) $customer->balance_usd,
            ],
            'balances' => $balances,
            'filters' => $request->only(['currency', 'from_date', 'to_date']),
            'totals' => [
                'total_iqd' => (float) $totalIqd,
                'total_usd' => (float) $totalUsd,
                'total_count' => $totalCount,
                'filtered_iqd' => (float) $filteredIqd,
                'filtered_usd' => (float) $filteredUsd,
                'filtered_count' => $filteredCount,
            ]
        ]);
    }

    /**
     * فۆرمی دروستکردنی نوێ
     */
    public function create(Request $request)
    {
        $query = Customer::query();

        // گەڕان بۆ کڕیارەکان
        if ($request->filled('search_customer')) {
            $search = $request->search_customer;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->limit(50)->get()->map(function ($customer) {
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'balance_iqd' => (float) $customer->balance_iqd,
                'balance_usd' => (float) $customer->balance_usd,
            ];
        });

        return Inertia::render('Balances/Create', [
            'customers' => $customers,
            'filters' => $request->only(['search_customer'])
        ]);
    }

    /**
     * هەڵگرتنی باڵانسی نوێ
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|in:IQD,USD',
            'note' => 'nullable|string|max:500',
        ]);

        // زانیاری کڕیار
        $customer = Customer::findOrFail($request->customer_id);

        // باڵانسی پێشوو
        $previousBalance = $customer->balances()
            ->where('currency', $request->currency)
            ->latest()
            ->first();

        $beforeBalance = $previousBalance ? (float) $previousBalance->after_balance : 0;
        $afterBalance = $beforeBalance + (float) $request->amount;

        // دروستکردنی باڵانسی نوێ
        balance::create([
            'customer_id' => $request->customer_id,
            'amount' => $request->amount,
            'currency' => $request->currency,
            'note' => $request->note,
            'before_balance' => $beforeBalance,
            'after_balance' => $afterBalance,
            'type' => 'add',
        ]);

        return redirect()->route('balances.index')
            ->with('success', 'باڵانس بە سەرکەوتوویی زیادکرا.');
    }

    /**
     * فۆرمی دەسکاری
     */
    public function edit(balance $balance)
    {
        $balance->load('customer');

        return Inertia::render('Balances/Edit', [
            'balance' => [
                'id' => $balance->id,
                'customer_id' => $balance->customer_id,
                'amount' => (float) $balance->amount,
                'currency' => $balance->currency,
                'note' => $balance->note,
                'before_balance' => (float) $balance->before_balance,
                'after_balance' => (float) $balance->after_balance,
                'created_at' => $balance->created_at,
                'customer' => $balance->customer ? [
                    'id' => $balance->customer->id,
                    'name' => $balance->customer->name,
                    'phone' => $balance->customer->phone,
                    'email' => $balance->customer->email,
                ] : null
            ]
        ]);
    }

    /**
     * نوێکردنەوەی باڵانس
     */
    public function update(Request $request, balance $balance)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:500',
        ]);

        // 1. جیاوازی بڕی کۆن و نوێ
        $oldAmount = (float) $balance->amount;
        $newAmount = (float) $request->amount;
        $difference = $newAmount - $oldAmount;

        // 2. دەسکاری بڕ و تێبینی
        $balance->update([
            'amount' => $newAmount,
            'note' => $request->note,
        ]);

        // 3. نوێکردنەوەی هەموو باڵانسەکانی دواتر
        $this->recalculateBalancesAfter($balance, false, $difference);

        return redirect()->route('balances.index')
            ->with('success', 'باڵانس بە سەرکەوتوویی نوێکرایەوە.');
    }

    /**
     * سڕینەوەی باڵانس
     */
    public function destroy(balance $balance)
    {
        try {
            // هێنانەوەی زانیاری پێش سڕینەوە
            $customerId = $balance->customer_id;
            $currency = $balance->currency;
            $balanceId = $balance->id;

            // سڕینەوەی باڵانس
            $balance->delete();

            // نوێکردنەوەی تۆمارە دوای سڕینەوە
            $this->recalculateBalancesAfterDelete($customerId, $currency, $balanceId);

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'باڵانس بە سەرکەوتوویی سڕایەوە.'
                ]);
            }

            return redirect()->back()
                ->with('success', 'باڵانس بە سەرکەوتوویی سڕایەوە.');

        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'هەڵە ڕوویدا لە سڕینەوەی باڵانس.'
                ], 500);
            }

            return redirect()->back()
                ->with('error', 'هەڵە ڕوویدا لە سڕینەوەی باڵانس.');
        }
    }

    /**
     * Helper: نوێکردنەوەی هەموو باڵانسەکان دوای تۆمارێک
     */
    private function recalculateBalancesAfter(balance $balance, $isDeleted = false, $difference = 0)
    {
        // باڵانسەکانی دواتر بۆ هەمان کڕیار و دراو
        $laterBalances = balance::where('customer_id', $balance->customer_id)
            ->where('currency', $balance->currency)
            ->where('id', '>', $balance->id)
            ->orderBy('id')
            ->get();

        $previous = balance::where('customer_id', $balance->customer_id)
            ->where('currency', $balance->currency)
            ->where('id', '<', $balance->id)
            ->orderBy('id', 'desc')
            ->first();

        // درێژکردنی سەرەتا بە balance خۆی
        $currentBalance = $previous ? (float) $previous->after_balance : 0;

        if (!$isDeleted) {
            // لەبەرچاوگرتنی ئەم تۆمارە (کاتێک دەستکاری دەکرێت)
            $currentBalance += (float) $balance->amount;

            // نوێکردنەوەی balance خۆی یەکەمجار
            $balance->refresh(); // نوێکردنەوە بۆ هێنانەوەی زانیاری نوێ
            $balance->update([
                'before_balance' => $previous ? (float) $previous->after_balance : 0,
                'after_balance' => ($previous ? (float) $previous->after_balance : 0) + (float) $balance->amount
            ]);
        }

        // نوێکردنەوەی هەموو تۆمارەکانی دواتر
        foreach ($laterBalances as $later) {
            $currentBalance += (float) $later->amount;

            $later->update([
                'before_balance' => $currentBalance - (float) $later->amount,
                'after_balance' => $currentBalance
            ]);
        }
    }

    /**
     * Helper: نوێکردنەوەی هەموو باڵانسەکان دوای سڕینەوەی تۆمارێک
     */
    private function recalculateBalancesAfterDelete($customerId, $currency, $deletedBalanceId)
    {
        // باڵانسەکانی دواتر بۆ هەمان کڕیار و دراو
        $laterBalances = balance::where('customer_id', $customerId)
            ->where('currency', $currency)
            ->where('id', '>', $deletedBalanceId)
            ->orderBy('id')
            ->get();

        $previous = balance::where('customer_id', $customerId)
            ->where('currency', $currency)
            ->where('id', '<', $deletedBalanceId)
            ->orderBy('id', 'desc')
            ->first();

        // دەستپێکردن لە باڵانسی پێشوو
        $currentBalance = $previous ? (float) $previous->after_balance : 0;

        // نوێکردنەوەی هەموو تۆمارەکانی دواتر
        foreach ($laterBalances as $later) {
            $currentBalance += (float) $later->amount;

            $later->update([
                'before_balance' => $currentBalance - (float) $later->amount,
                'after_balance' => $currentBalance
            ]);
        }
    }
}
