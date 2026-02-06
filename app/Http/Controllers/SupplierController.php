<?php
// app/Http/Controllers/SupplierController.php
namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Purchase;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::withCount('purchases');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('company_name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has_debt) {
            $query->where(function ($q) {
                $q->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
            });
        }

        $suppliers = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'has_debt']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Suppliers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Supplier::create($validated);

        return redirect()->route('suppliers.index')
            ->with('success', 'دابینکەر بە سەرکەوتوویی زیادکرا');
    }

    // app/Http/Controllers/SupplierController.php
public function show(Supplier $supplier)
{
    $supplier->load([
        'purchases' => function ($query) {
            $query->select('id', 'supplier_id', 'invoice_number', 'purchase_date', 'total_amount',
                           'paid_amount', 'remaining_amount', 'currency', 'notes')
                  ->latest()
                  ->take(10);
        }
        // payments پەیوەندی لاببە بۆ ئەوەی کێشەکە بدۆزیتەوە
    ]);

    // ئاماری دابینکەر - payments لاببە
    $stats = [
        'total_purchases' => $supplier->purchases()->count(),
        'total_purchases_amount' => [
            'iqd' => (float) $supplier->purchases()->where('currency', 'IQD')->sum('total_amount'),
            'usd' => (float) $supplier->purchases()->where('currency', 'USD')->sum('total_amount'),
        ],
        'pending_purchases' => $supplier->purchases()->where('remaining_amount', '>', 0)->count(),
    ];

    return Inertia::render('Suppliers/Show', [
        'supplier' => $supplier,
        'stats' => $stats,
    ]);
}

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:suppliers,name,' . $supplier->id,
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $supplier->update($validated);

        return redirect()->route('suppliers.index')
            ->with('success', 'دابینکەر بە سەرکەوتوویی نوێکرایەوە');
    }

    public function destroy(Supplier $supplier)
    {
        // چێککردن ئەگەر کڕین یان پارەدانی هەیە
        if ($supplier->purchases()->exists() || $supplier->payments()->exists()) {
            return back()->with('error', 'ناتوانرێت بسڕێتەوە، چونکە کڕین یان پارەدانی تێدایە');
        }

        $supplier->delete();

        return redirect()->route('suppliers.index')
            ->with('success', 'دابینکەر بە سەرکەوتوویی سڕایەوە');
    }

    public function debtStatement(Supplier $supplier)
    {
        $purchases = $supplier->purchases()
            ->select('id', 'invoice_number', 'purchase_date', 'total_amount', 'paid_amount',
                     'remaining_amount', 'currency', 'notes')
            ->where('remaining_amount', '>', 0)
            ->orderBy('purchase_date', 'desc')
            ->get();

        $payments = $supplier->payments()
            ->select('id', 'payment_date', 'amount', 'currency', 'payment_method', 'notes', 'type')
            ->where('type', 'supplier')
            ->orderBy('payment_date', 'desc')
            ->get();

        $totalDebt = [
            'iqd' => (float) $supplier->balance_iqd,
            'usd' => (float) $supplier->balance_usd,
            'total_iqd' => (float) $supplier->balance_iqd + ($supplier->balance_usd * 1450),
        ];

        return Inertia::render('Suppliers/DebtStatement', [
            'supplier' => $supplier,
            'purchases' => $purchases,
            'payments' => $payments,
            'totalDebt' => $totalDebt,
        ]);
    }

    public function report(Request $request)
    {
        $query = Supplier::withCount(['purchases', 'payments']);

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereHas('purchases', function ($q) use ($request) {
                $q->whereBetween('purchase_date', [$request->start_date, $request->end_date]);
            });
        }

        if ($request->has_debt) {
            $query->where(function ($q) {
                $q->where('balance_iqd', '>', 0)
                  ->orWhere('balance_usd', '>', 0);
            });
        }

        $suppliers = $query->orderBy('name')->get();

        return Inertia::render('Suppliers/Report', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['start_date', 'end_date', 'has_debt']),
        ]);
    }

    public function apiIndex(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('company_name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        $suppliers = $query->limit(20)->get(['id', 'name', 'company_name', 'phone', 'balance_iqd', 'balance_usd']);

        return response()->json([
            'data' => $suppliers,
            'total' => $suppliers->count()
        ]);
    }
}
