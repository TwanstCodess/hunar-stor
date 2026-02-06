<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with(['supplier:id,name', 'user:id,name']);

        if ($request->search) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%');
        }

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->purchase_type) {
            $query->where('purchase_type', $request->purchase_type);
        }

        if ($request->currency) {
            $query->where('currency', $request->currency);
        }

        if ($request->from_date) {
            $query->whereDate('purchase_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->whereDate('purchase_date', '<=', $request->to_date);
        }

        if ($request->unpaid_only) {
            $query->where('remaining_amount', '>', 0);
        }

        $purchases = $query->latest('purchase_date')->paginate(15);
        $suppliers = Supplier::all();

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'filters' => $request->only([
                'search',
                'supplier_id',
                'purchase_type',
                'currency',
                'from_date',
                'to_date',
                'unpaid_only'
            ]),
        ]);
    }

    public function create()
    {
        $suppliers = Supplier::all();
        $products = Product::with(['category', 'baseUnit', 'purchaseUnit'])->get();
        $invoiceNumber = Purchase::generateInvoiceNumber();

        $lowStockProducts = Product::where('track_stock', true)
            ->whereColumn('quantity', '<=', 'min_stock_level')
            ->with('category')
            ->limit(10)
            ->get();

        return Inertia::render('Purchases/Create', [
            'suppliers' => $suppliers,
            'products' => $products,
            'invoiceNumber' => $invoiceNumber,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_type' => 'required|in:cash,credit',
            'currency' => 'required|in:IQD,USD',
            // payment_method تەنها بۆ کاش پێویستە
            'payment_method' => 'nullable|required_if:purchase_type,cash|in:cash,pos,transfer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.selling_price' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_date' => 'required|date',
        ], [
            'items.required' => 'کەمێک بەرهەم زیاد بکە',
            'items.*.quantity.min' => 'بڕ نابێت کەمتر بێت لە ٠٫٠٠١',
            'items.*.unit_price.min' => 'نرخ نابێت نەرێنی بێت',
            'payment_method.required_if' => 'شێوازی پارەدان بۆ کڕینی کاش پێویستە',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'تکایە هەڵەکان چارەسەر بکە');
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validated();

            // حیسابی کۆی گشتی
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $paidAmount = $validated['paid_amount'] ?? 0;
            $remainingAmount = $totalAmount - $paidAmount;

            // پشکنین بۆ پارەدان
            if ($validated['purchase_type'] === 'cash') {
                if ($paidAmount <= 0) {
                    throw new \Exception('بۆ کڕینی کاش، بڕێکی دراو پێویستە');
                }
                if ($paidAmount > $totalAmount) {
                    throw new \Exception('بڕی پارەی دراو زیاترە لە کۆی گشتی');
                }
                // دڵنیابوون لە بوونی payment_method بۆ کاش
                if (empty($validated['payment_method'])) {
                    throw new \Exception('شێوازی پارەدان بۆ کڕینی کاش پێویستە');
                }
            } else {
                // کڕینی قەرز - payment_method نابێت بوونی هەبێت
                $validated['payment_method'] = null;

                if ($paidAmount > $totalAmount) {
                    throw new \Exception('بۆ کڕینی قەرز، بڕی دراو نابێت زیاتر بێت لە کۆی گشتی');
                }
            }

            // دروستکردنی کڕین
            $purchase = Purchase::create([
                'supplier_id' => $validated['supplier_id'] ?? null,
                'user_id' => auth()->id(),
                'invoice_number' => Purchase::generateInvoiceNumber(),
                'purchase_type' => $validated['purchase_type'],
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'] ?? null,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'notes' => $validated['notes'] ?? null,
                'purchase_date' => $validated['purchase_date'],
            ]);

            // زیادکردنی ئایتمەکان
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception('بەرهەمی ئاماژەپێدراو بوونی نییە');
                }

                $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'selling_price' => $item['selling_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);

                // زیادکردنی بڕ لە ستۆک
                if ($product->track_stock) {
                    $product->increment('quantity', $item['quantity']);
                }

                // نوێکردنەوەی نرخەکان
                if ($validated['currency'] === 'IQD') {
                    $product->update([
                        'purchase_price_iqd' => $item['unit_price'],
                        'selling_price_iqd' => $item['selling_price'],
                        'last_purchase_date' => now(),
                    ]);
                } else {
                    $product->update([
                        'purchase_price_usd' => $item['unit_price'],
                        'selling_price_usd' => $item['selling_price'],
                        'last_purchase_date' => now(),
                    ]);
                }
            }

            // نوێکردنەوەی قەرزی دابینکەر (تەنها بۆ کڕینی قەرز و هەبوونی دابینکەر)
            if ($validated['purchase_type'] === 'credit' && !empty($validated['supplier_id']) && $remainingAmount > 0) {
                $supplier = Supplier::find($validated['supplier_id']);
                if ($supplier) {
                    if (method_exists($supplier, 'addDebt')) {
                        $supplier->addDebt($remainingAmount, $validated['currency']);
                    } else {
                        $supplier->increment('balance', $remainingAmount);
                    }
                }
            }

            DB::commit();

            return redirect()->route('purchases.show', $purchase)
                ->with('success', 'کڕین بە سەرکەوتوویی تۆمارکرا | وەسڵ: ' . $purchase->invoice_number);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە کڕین: ' . $e->getMessage());

            return redirect()->back()
                ->withInput()
                ->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function show(Purchase $purchase)
    {
        $purchase->load([
            'supplier',
            'user',
            'items.product.category',
            'items.product.baseUnit',
            'items.product.purchaseUnit'
        ]);

        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase,
        ]);
    }

    public function edit(Purchase $purchase)
    {
        $purchase->load(['items.product']);
        $suppliers = Supplier::all();
        $products = Product::with(['category', 'baseUnit', 'purchaseUnit'])->get();

        return Inertia::render('Purchases/Edit', [
            'purchase' => $purchase,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_type' => 'required|in:cash,credit',
            'currency' => 'required|in:IQD,USD',
            'payment_method' => 'nullable|required_if:purchase_type,cash|in:cash,pos,transfer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.selling_price' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'purchase_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validated();

            $oldSupplierId = $purchase->supplier_id;
            $oldRemainingAmount = $purchase->remaining_amount;
            $oldCurrency = $purchase->currency;

            // گەڕانەوەی بڕەکان بۆ ستۆک
            foreach ($purchase->items as $oldItem) {
                $product = $oldItem->product;
                if ($product->track_stock) {
                    $product->decrement('quantity', $oldItem->quantity);
                }
            }

            // سڕینەوەی ئایتمەکانی کۆن
            $purchase->items()->delete();

            // حیسابی کۆی گشتی
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $paidAmount = $validated['paid_amount'] ?? 0;
            $remainingAmount = $totalAmount - $paidAmount;

            // پشکنینەکان
            if ($validated['purchase_type'] === 'cash') {
                if ($paidAmount <= 0) {
                    throw new \Exception('بۆ کڕینی کاش، بڕێکی دراو پێویستە');
                }
                if ($paidAmount > $totalAmount) {
                    throw new \Exception('بڕی پارەی دراو زیاترە لە کۆی گشتی');
                }
                if (empty($validated['payment_method'])) {
                    throw new \Exception('شێوازی پارەدان بۆ کڕینی کاش پێویستە');
                }
            } else {
                $validated['payment_method'] = null;
            }

            // نوێکردنەوەی کڕین
            $purchase->update([
                'supplier_id' => $validated['supplier_id'] ?? null,
                'purchase_type' => $validated['purchase_type'],
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'] ?? null,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'notes' => $validated['notes'] ?? null,
                'purchase_date' => $validated['purchase_date'],
            ]);

            // زیادکردنی ئایتمەکانی نوێ
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception('بەرهەمی ئاماژەپێدراو بوونی نییە');
                }

                $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'selling_price' => $item['selling_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);

                // زیادکردنی بڕ لە ستۆک
                if ($product->track_stock) {
                    $product->increment('quantity', $item['quantity']);
                }

                // نوێکردنەوەی نرخەکان
                if ($validated['currency'] === 'IQD') {
                    $product->update([
                        'purchase_price_iqd' => $item['unit_price'],
                        'selling_price_iqd' => $item['selling_price'],
                        'last_purchase_date' => now(),
                    ]);
                } else {
                    $product->update([
                        'purchase_price_usd' => $item['unit_price'],
                        'selling_price_usd' => $item['selling_price'],
                        'last_purchase_date' => now(),
                    ]);
                }
            }

            // نوێکردنەوەی قەرزی دابینکەر
            if ($purchase->purchase_type === 'credit') {
                // کەمکردنەوەی قەرزی کۆن
                if ($oldSupplierId && $oldRemainingAmount > 0) {
                    $oldSupplier = Supplier::find($oldSupplierId);
                    if ($oldSupplier) {
                        if (method_exists($oldSupplier, 'reduceDebt')) {
                            $oldSupplier->reduceDebt($oldRemainingAmount, $oldCurrency);
                        } else {
                            $oldSupplier->decrement('balance', $oldRemainingAmount);
                        }
                    }
                }

                // زیادکردنی قەرزی نوێ
                if ($purchase->supplier_id && $remainingAmount > 0) {
                    $supplier = Supplier::find($purchase->supplier_id);
                    if ($supplier) {
                        if (method_exists($supplier, 'addDebt')) {
                            $supplier->addDebt($remainingAmount, $purchase->currency);
                        } else {
                            $supplier->increment('balance', $remainingAmount);
                        }
                    }
                }
            }

            DB::commit();

            return redirect()->route('purchases.show', $purchase)
                ->with('success', 'کڕین بە سەرکەوتوویی نوێکرایەوە');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە نوێکردنەوەی کڕین: ' . $e->getMessage());

            return redirect()->back()
                ->withInput()
                ->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function destroy(Purchase $purchase)
    {
        DB::beginTransaction();

        try {
            // کەمکردنەوەی بڕەکان لە ستۆک
            foreach ($purchase->items as $item) {
                $product = $item->product;
                if ($product->track_stock) {
                    $product->decrement('quantity', $item->quantity);
                }
            }

            // نوێکردنەوەی قەرزی دابینکەر
            if ($purchase->purchase_type === 'credit' && $purchase->supplier_id && $purchase->remaining_amount > 0) {
                $supplier = Supplier::find($purchase->supplier_id);
                if ($supplier) {
                    if (method_exists($supplier, 'reduceDebt')) {
                        $supplier->reduceDebt($purchase->remaining_amount, $purchase->currency);
                    } else {
                        $supplier->decrement('balance', $purchase->remaining_amount);
                    }
                }
            }

            $purchase->delete();

            DB::commit();

            return redirect()->route('purchases.index')
                ->with('success', 'کڕین بە سەرکەوتوویی سڕایەوە');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە سڕینەوەی کڕین: ' . $e->getMessage());

            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function print(Purchase $purchase)
    {
        $purchase->load([
            'supplier',
            'user',
            'items.product',
            'items.product.baseUnit'
        ]);

        $company = \App\Models\Company::first();

        return Inertia::render('Purchases/Print', [
            'purchase' => $purchase,
            'company' => $company,
        ]);
    }

    public function addPayment(Request $request, Purchase $purchase)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $purchase->remaining_amount,
            'payment_method' => 'required|in:cash,pos,transfer',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // زیادکردنی پارەی دراو
            $purchase->increment('paid_amount', $request->amount);
            $purchase->decrement('remaining_amount', $request->amount);
            $purchase->save();

            // کەمکردنەوەی قەرزی دابینکەر
            if ($purchase->supplier && $purchase->purchase_type === 'credit') {
                if (method_exists($purchase->supplier, 'reduceDebt')) {
                    $purchase->supplier->reduceDebt($request->amount, $purchase->currency);
                } else {
                    $purchase->supplier->decrement('balance', $request->amount);
                }
            }

            DB::commit();

            return back()->with('success', 'پارەدان بە سەرکەوتوویی تۆمارکرا');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە زیادکردنی پارەدان: ' . $e->getMessage());

            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }
}
