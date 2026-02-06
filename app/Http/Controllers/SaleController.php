<?php
namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['customer:id,name,phone', 'user:id,name'])
            ->withCount('items')
            ->latest('sale_date');

        if ($request->search) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%')
                ->orWhereHas('customer', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('phone', 'like', '%' . $request->search . '%');
                });
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->sale_type) {
            $query->where('sale_type', $request->sale_type);
        }

        if ($request->currency) {
            $query->where('currency', $request->currency);
        }

        if ($request->from_date) {
            $query->whereDate('sale_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->whereDate('sale_date', '<=', $request->to_date);
        }

        if ($request->status) {
            if ($request->status == 'paid') {
                $query->where('remaining_amount', '<=', 0);
            } elseif ($request->status == 'unpaid') {
                $query->where('remaining_amount', '>', 0);
            } elseif ($request->status == 'partial') {
                $query->where('remaining_amount', '>', 0)
                      ->where('paid_amount', '>', 0);
            }
        }

        $sales = $query->paginate($request->per_page ?? 15);
        $customers = Customer::select('id', 'name', 'phone', 'balance_iqd', 'balance_usd', 'negative_balance_iqd', 'negative_balance_usd')->get();

        $stats = [
            'total_sales' => Sale::count(),
            'total_amount' => Sale::sum('total_amount'),
            'total_paid' => Sale::sum('paid_amount'),
            'total_remaining' => Sale::sum('remaining_amount'),
            'today_sales' => Sale::whereDate('sale_date', today())->sum('total_amount'),
            'today_count' => Sale::whereDate('sale_date', today())->count(),
        ];

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'customers' => $customers,
            'stats' => $stats,
            'filters' => $request->only([
                'search', 'customer_id', 'sale_type', 'currency',
                'from_date', 'to_date', 'status', 'per_page'
            ]),
        ]);
    }

    public function create()
    {
        $customers = Customer::select('id', 'name', 'phone', 'balance_iqd', 'balance_usd', 'negative_balance_iqd', 'negative_balance_usd')->get();

        $categories = Category::all();
        $units = Unit::where('is_active', true)->get();

        $products = Product::with(['category', 'baseUnit', 'saleUnit'])
            ->where('track_stock', true)
            ->get()
            ->map(function($product) {
                $availableInSaleUnit = 0;
                if ($product->sale_to_base_factor > 0) {
                    $availableInSaleUnit = $product->quantity / $product->sale_to_base_factor;
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'barcode' => $product->barcode,
                    'image_url' => $product->getImageUrlAttribute(),
                    'quantity' => $product->quantity,
                    'min_stock_level' => $product->min_stock_level,
                    'track_stock' => $product->track_stock,
                    'purchase_price_iqd' => $product->purchase_price_iqd,
                    'purchase_price_usd' => $product->purchase_price_usd,
                    'selling_price_iqd' => $product->selling_price_iqd,
                    'selling_price_usd' => $product->selling_price_usd,
                    'sale_unit_id' => $product->sale_unit_id,
                    'sale_to_base_factor' => $product->sale_to_base_factor,
                    'unit_label' => $product->saleUnit ? $product->saleUnit->name : 'دانە',
                    'category_name' => $product->category ? $product->category->name : 'بێ کاتێگۆری',
                    'available_quantity' => $availableInSaleUnit
                ];
            });

        $invoiceNumber = Sale::generateInvoiceNumber();

        return Inertia::render('Sales/Create', [
            'customers' => $customers,
            'products' => $products,
            'invoiceNumber' => $invoiceNumber,
            'categories' => $categories,
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'sale_type' => 'required|in:cash,credit',
            'currency' => 'required|in:IQD,USD',
            'payment_method' => 'nullable|required_if:sale_type,cash|in:cash,pos,transfer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'sale_date' => 'nullable|date',
            'items.*.note' => 'nullable|string|max:500',
            'use_advance' => 'nullable|boolean',
            'advance_used' => 'nullable|numeric|min:0',
            'cash_payment' => 'nullable|numeric|min:0',
            'excess_amount' => 'nullable|numeric|min:0',
        ], [
            'items.required' => 'کەمێک بەرهەم زیاد بکە',
            'items.*.quantity.min' => 'بڕ نابێت کەمتر بێت لە ٠٫٠٠١',
            'items.*.unit_price.min' => 'نرخ نابێت نەرێنی بێت',
            'payment_method.required_if' => 'شێوازی پارەدان بۆ فرۆشتنی کاش پێویستە',
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

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $paidAmount = $validated['paid_amount'] ?? 0;
            $useAdvance = $validated['use_advance'] ?? false;
            $advanceUsed = $validated['advance_used'] ?? 0;
            $cashPayment = $validated['cash_payment'] ?? 0;
            $excessAmount = $validated['excess_amount'] ?? 0;

            // پشکنین بۆ بەکارهێنانی زیادە
            $customer = null;
            $availableAdvance = 0;

            if ($validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $availableAdvance = $validated['currency'] == 'IQD'
                        ? $customer->negative_balance_iqd
                        : $customer->negative_balance_usd;
                }
            }

            $actualPaidAmount = 0;
            $actualAdvanceUsed = 0;
            $actualCashPayment = 0;
            $actualExcessAmount = 0;

            // ١. پشکنین و حیسابکردنی پارەدانەکان
            if ($useAdvance && $customer && $availableAdvance > 0) {
                // یەکەم: بەکارهێنانی زیادە
                $actualAdvanceUsed = min($advanceUsed, $availableAdvance, $totalAmount);
                $actualPaidAmount += $actualAdvanceUsed;

                // دووەم: پارەی ڕاستەوخۆ
                if ($cashPayment > 0) {
                    $actualCashPayment = min($cashPayment, $totalAmount - $actualAdvanceUsed);
                    $actualPaidAmount += $actualCashPayment;
                }

                // سێیەم: پارەی زیادە
                if ($excessAmount > 0) {
                    $actualExcessAmount = $excessAmount;
                }

                // کەمکردنەوەی زیادە لە هەژماری کڕیار
                if ($actualAdvanceUsed > 0) {
                    $negativeField = $validated['currency'] == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                    $customer->decrement($negativeField, $actualAdvanceUsed);
                }
            } else {
                // بەکارهێنانی پارەی ڕاستەوخۆ تەنها
                if ($paidAmount > $totalAmount) {
                    $actualExcessAmount = $paidAmount - $totalAmount;
                    $actualCashPayment = $totalAmount;
                } else {
                    $actualCashPayment = $paidAmount;
                }
                $actualPaidAmount = $actualCashPayment;

                // زیادکردنی پارەی زیادە بۆ هەژماری کڕیار
                if ($customer && $actualExcessAmount > 0) {
                    $negativeField = $validated['currency'] == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                    $customer->increment($negativeField, $actualExcessAmount);
                }
            }

            $remainingAmount = $totalAmount - $actualPaidAmount;

            // پشکنینەکان
            if ($validated['sale_type'] === 'cash') {
                if ($actualPaidAmount <= 0) {
                    throw new \Exception('بۆ فرۆشتنی کاش، بڕێکی دراو پێویستە');
                }

                // پشکنین بۆ پارەی ڕاستەوخۆ
                if ($actualCashPayment > 0 && empty($validated['payment_method'])) {
                    throw new \Exception('شێوازی پارەدان بۆ فرۆشتنی کاش پێویستە');
                }
            } else {
                $validated['payment_method'] = null;

                // ئەگەر پارەی دراو زیاتر بێت لە کۆی گشت بۆ قەرز
                if ($paidAmount > $totalAmount) {
                    throw new \Exception('بۆ فرۆشتنی قەرز، بڕی دراو نابێت زیاتر بێت لە کۆی گشتی');
                }

                // ئەگەر کەمتر بێت لە کۆی گشت، وەک قەرز تۆمار دەکرێت
                if ($actualPaidAmount < $totalAmount) {
                    $validated['sale_type'] = 'credit';
                }
            }

            // دروستکردنی فرۆشتن
            $sale = Sale::create([
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => auth()->id(),
                'invoice_number' => Sale::generateInvoiceNumber(),
                'sale_type' => $validated['sale_type'],
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'] ?? null,
                'total_amount' => $totalAmount,
                'paid_amount' => $actualPaidAmount,
                'remaining_amount' => $remainingAmount,
                'notes' => $validated['notes'] ?? null,
                'sale_date' => $validated['sale_date'] ?? now(),
            ]);

            // زیادکردنی ئایتمەکان
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception('بەرهەمی ئاماژەپێدراو بوونی نییە');
                }

                if ($product->track_stock) {
                    $availableQuantity = $product->getAvailableInSaleUnit();
                    if ($item['quantity'] > $availableQuantity) {
                        throw new \Exception(
                            "بڕی بەردەست بۆ {$product->name} کەمە. بەردەست: {$availableQuantity} {$product->saleUnit?->name}"
                        );
                    }
                }

                $sale->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'note' => $item['note'] ?? null,
                ]);

                if ($product->track_stock) {
                    $product->reduceStock($item['quantity'], true);
                }
            }

            // زیادکردنی قەرزی کڕیار (ئەگەر قەرز ماوە)
            if ($validated['sale_type'] === 'credit' && $customer && $remainingAmount > 0) {
                $balanceField = $validated['currency'] == 'IQD' ? 'balance_iqd' : 'balance_usd';
                $customer->increment($balanceField, $remainingAmount);
            }

            // دروستکردنی تۆمارێکی پارەدان
            $paymentNotes = 'پارەدان بۆ فرۆشتنی ' . $sale->invoice_number;

            if ($actualAdvanceUsed > 0) {
                $paymentNotes .= ' | بەکارهێنانی زیادە: ' . number_format($actualAdvanceUsed, 2) . ' ' . $validated['currency'];
            }

            if ($actualCashPayment > 0) {
                $paymentNotes .= ' | پارەی ڕاستەوخۆ: ' . number_format($actualCashPayment, 2) . ' ' . $validated['currency'];
            }

            if ($actualExcessAmount > 0) {
                $paymentNotes .= ' | پارەی زیادە: ' . number_format($actualExcessAmount, 2) . ' ' . $validated['currency'];
            }

            if ($actualPaidAmount > 0 || $actualAdvanceUsed > 0) {
                Payment::create([
                    'customer_id' => $validated['customer_id'],
                    'sale_id' => $sale->id,
                    'user_id' => auth()->id(),
                    'currency' => $validated['currency'],
                    'payment_method' => $validated['payment_method'] ?? ($actualAdvanceUsed > 0 ? 'advance' : 'cash'),
                    'type' => 'customer',
                    'amount' => $actualPaidAmount,
                    'notes' => $paymentNotes,
                    'payment_date' => now(),
                    'status' => 'completed',
                    'reference_number' => 'PAY-' . str_pad(Payment::count() + 1, 6, '0', STR_PAD_LEFT),
                    'excess_amount' => $actualExcessAmount,
                    'advance_used' => $actualAdvanceUsed,
                    'cash_payment' => $actualCashPayment,
                ]);
            }

            DB::commit();

            $successMessage = 'فرۆشتن بە سەرکەوتوویی تۆمارکرا | وەسڵ: ' . $sale->invoice_number;

            if ($actualAdvanceUsed > 0) {
                $remainingAdvance = $availableAdvance - $actualAdvanceUsed;
                $successMessage .= ' | بەکارهێنانی زیادە: ' . number_format($actualAdvanceUsed, 2) . ' ' . $validated['currency'];
                $successMessage .= ' | زیادەی ماوە: ' . number_format($remainingAdvance, 2) . ' ' . $validated['currency'];
            }

            if ($actualExcessAmount > 0) {
                $newAdvance = $availableAdvance + $actualExcessAmount;
                $successMessage .= ' | پارەی زیادە: ' . number_format($actualExcessAmount, 2) . ' ' . $validated['currency'];
                $successMessage .= ' | کۆی زیادە: ' . number_format($newAdvance, 2) . ' ' . $validated['currency'];
            }

            return redirect()->route('sales.show', $sale)
                ->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە فرۆشتن: ' . $e->getMessage());

            return redirect()->back()
                ->withInput()
                ->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function show(Sale $sale)
    {
        $sale->load([
            'customer',
            'user',
            'items.product.category',
            'items.product.baseUnit',
            'items.product.saleUnit',
            'payments.user'
        ]);

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    public function edit(Sale $sale)
    {
        $sale->load(['items.product:id,name,code,image,selling_price_iqd,selling_price_usd,quantity,sale_to_base_factor']);

        $customers = Customer::select('id', 'name', 'phone', 'balance_iqd', 'balance_usd', 'negative_balance_iqd', 'negative_balance_usd')->get();

        $products = Product::with(['category', 'saleUnit'])
            ->where('track_stock', true)
            ->get()
            ->map(function($product) {
                $availableInSaleUnit = 0;
                if ($product->sale_to_base_factor > 0) {
                    $availableInSaleUnit = $product->quantity / $product->sale_to_base_factor;
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'image_url' => $product->getImageUrlAttribute(),
                    'selling_price_iqd' => $product->selling_price_iqd,
                    'selling_price_usd' => $product->selling_price_usd,
                    'purchase_price_iqd' => $product->purchase_price_iqd,
                    'purchase_price_usd' => $product->purchase_price_usd,
                    'quantity' => $product->quantity,
                    'min_stock_level' => $product->min_stock_level,
                    'track_stock' => $product->track_stock,
                    'sale_to_base_factor' => $product->sale_to_base_factor,
                    'unit_label' => $product->saleUnit ? $product->saleUnit->name : 'دانە',
                    'category_name' => $product->category ? $product->category->name : 'بێ کاتێگۆری',
                    'available_quantity' => $availableInSaleUnit
                ];
            });

        return Inertia::render('Sales/Edit', [
            'sale' => $sale,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, Sale $sale)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'sale_type' => 'required|in:cash,credit',
            'currency' => 'required|in:IQD,USD',
            'payment_method' => 'nullable|required_if:sale_type,cash|in:cash,pos,transfer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'sale_date' => 'nullable|date',
            'items.*.note' => 'nullable|string|max:500',
            'use_advance' => 'nullable|boolean',
            'advance_used' => 'nullable|numeric|min:0',
            'cash_payment' => 'nullable|numeric|min:0',
            'excess_amount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validated();

            $oldCustomerId = $sale->customer_id;
            $oldRemainingAmount = $sale->remaining_amount;
            $oldCurrency = $sale->currency;
            $oldPaidAmount = $sale->paid_amount;

            // گەڕانەوەی بڕەکان بۆ ستۆک
            foreach ($sale->items as $oldItem) {
                $product = $oldItem->product;
                if ($product->track_stock) {
                    $product->addStock($oldItem->quantity, true);
                }
            }

            // گەڕانەوەی پارەی زیادە و بەکارهێنانی زیادە
            if ($sale->payments()->exists()) {
                $oldCustomer = Customer::find($oldCustomerId);
                if ($oldCustomer) {
                    $totalExcess = $sale->payments()->sum('excess_amount');
                    $totalAdvanceUsed = $sale->payments()->sum('advance_used');

                    if ($totalExcess > 0) {
                        $oldNegativeField = $oldCurrency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                        $oldCustomer->decrement($oldNegativeField, $totalExcess);
                    }

                    if ($totalAdvanceUsed > 0) {
                        $oldNegativeField = $oldCurrency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                        $oldCustomer->increment($oldNegativeField, $totalAdvanceUsed);
                    }
                }
            }

            // سڕینەوەی ئایتمەکانی کۆن
            $sale->items()->delete();

            // حیسابی کۆی گشتی
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $paidAmount = $validated['paid_amount'] ?? 0;
            $useAdvance = $validated['use_advance'] ?? false;
            $advanceUsed = $validated['advance_used'] ?? 0;
            $cashPayment = $validated['cash_payment'] ?? 0;
            $excessAmount = $validated['excess_amount'] ?? 0;

            $customer = null;
            $availableAdvance = 0;

            if ($validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $availableAdvance = $validated['currency'] == 'IQD'
                        ? $customer->negative_balance_iqd
                        : $customer->negative_balance_usd;
                }
            }

            $actualPaidAmount = 0;
            $actualAdvanceUsed = 0;
            $actualCashPayment = 0;
            $actualExcessAmount = 0;

            // ١. پشکنین و حیسابکردنی پارەدانەکان
            if ($useAdvance && $customer && $availableAdvance > 0) {
                $actualAdvanceUsed = min($advanceUsed, $availableAdvance, $totalAmount);
                $actualPaidAmount += $actualAdvanceUsed;

                if ($cashPayment > 0) {
                    $actualCashPayment = min($cashPayment, $totalAmount - $actualAdvanceUsed);
                    $actualPaidAmount += $actualCashPayment;
                }

                if ($excessAmount > 0) {
                    $actualExcessAmount = $excessAmount;
                }

                if ($actualAdvanceUsed > 0) {
                    $negativeField = $validated['currency'] == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                    $customer->decrement($negativeField, $actualAdvanceUsed);
                }
            } else {
                if ($paidAmount > $totalAmount) {
                    $actualExcessAmount = $paidAmount - $totalAmount;
                    $actualCashPayment = $totalAmount;
                } else {
                    $actualCashPayment = $paidAmount;
                }
                $actualPaidAmount = $actualCashPayment;

                if ($customer && $actualExcessAmount > 0) {
                    $negativeField = $validated['currency'] == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                    $customer->increment($negativeField, $actualExcessAmount);
                }
            }

            $remainingAmount = $totalAmount - $actualPaidAmount;

            if ($validated['sale_type'] === 'cash') {
                if ($actualPaidAmount <= 0) {
                    throw new \Exception('بۆ فرۆشتنی کاش، بڕێکی دراو پێویستە');
                }

                if ($actualCashPayment > 0 && empty($validated['payment_method'])) {
                    throw new \Exception('شێوازی پارەدان بۆ فرۆشتنی کاش پێویستە');
                }
            } else {
                $validated['payment_method'] = null;

                if ($paidAmount > $totalAmount) {
                    throw new \Exception('بۆ فرۆشتنی قەرز، بڕی دراو نابێت زیاتر بێت لە کۆی گشتی');
                }

                if ($actualPaidAmount < $totalAmount) {
                    $validated['sale_type'] = 'credit';
                }
            }

            // نوێکردنەوەی فرۆشتن
            $sale->update([
                'customer_id' => $validated['customer_id'] ?? null,
                'sale_type' => $validated['sale_type'],
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'] ?? null,
                'total_amount' => $totalAmount,
                'paid_amount' => $actualPaidAmount,
                'remaining_amount' => $remainingAmount,
                'notes' => $validated['notes'] ?? null,
                'sale_date' => $validated['sale_date'] ?? $sale->sale_date,
            ]);

            // زیادکردنی ئایتمەکانی نوێ
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception('بەرهەمی ئاماژەپێدراو بوونی نییە');
                }

                if ($product->track_stock) {
                    $availableQuantity = $product->getAvailableInSaleUnit();
                    if ($item['quantity'] > $availableQuantity) {
                        throw new \Exception(
                            "بڕی بەردەست بۆ {$product->name} کەمە. بەردەست: {$availableQuantity}"
                        );
                    }
                }

                $sale->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'note' => $item['note'] ?? null,
                ]);

                if ($product->track_stock) {
                    $product->reduceStock($item['quantity'], true);
                }
            }

            // کەمکردنەوەی قەرزی کۆن
            if ($oldCustomerId && $oldRemainingAmount > 0) {
                $oldCustomer = Customer::find($oldCustomerId);
                if ($oldCustomer) {
                    $oldBalanceField = $oldCurrency == 'IQD' ? 'balance_iqd' : 'balance_usd';
                    $oldCustomer->decrement($oldBalanceField, $oldRemainingAmount);
                }
            }

            // زیادکردنی قەرزی نوێ
            if ($validated['sale_type'] === 'credit' && $customer && $remainingAmount > 0) {
                $balanceField = $validated['currency'] == 'IQD' ? 'balance_iqd' : 'balance_usd';
                $customer->increment($balanceField, $remainingAmount);
            }

            // سڕینەوەی پارەدانە کۆنەکان و دروستکردنی نوێ
            $sale->payments()->delete();

            $paymentNotes = 'پارەدان بۆ فرۆشتنی ' . $sale->invoice_number;

            if ($actualAdvanceUsed > 0) {
                $paymentNotes .= ' | بەکارهێنانی زیادە: ' . number_format($actualAdvanceUsed, 2) . ' ' . $validated['currency'];
            }

            if ($actualCashPayment > 0) {
                $paymentNotes .= ' | پارەی ڕاستەوخۆ: ' . number_format($actualCashPayment, 2) . ' ' . $validated['currency'];
            }

            if ($actualExcessAmount > 0) {
                $paymentNotes .= ' | پارەی زیادە: ' . number_format($actualExcessAmount, 2) . ' ' . $validated['currency'];
            }

            if ($actualPaidAmount > 0 || $actualAdvanceUsed > 0) {
                Payment::create([
                    'customer_id' => $validated['customer_id'],
                    'sale_id' => $sale->id,
                    'user_id' => auth()->id(),
                    'currency' => $validated['currency'],
                    'payment_method' => $validated['payment_method'] ?? ($actualAdvanceUsed > 0 ? 'advance' : 'cash'),
                    'type' => 'customer',
                    'amount' => $actualPaidAmount,
                    'notes' => $paymentNotes,
                    'payment_date' => now(),
                    'status' => 'completed',
                    'reference_number' => 'PAY-' . str_pad(Payment::count() + 1, 6, '0', STR_PAD_LEFT),
                    'excess_amount' => $actualExcessAmount,
                    'advance_used' => $actualAdvanceUsed,
                    'cash_payment' => $actualCashPayment,
                ]);
            }

            DB::commit();

            $successMessage = 'فرۆشتن بە سەرکەوتوویی نوێکرایەوە';

            if ($actualAdvanceUsed > 0) {
                $remainingAdvance = $availableAdvance - $actualAdvanceUsed;
                $successMessage .= ' | بەکارهێنانی زیادە: ' . number_format($actualAdvanceUsed, 2) . ' ' . $sale->currency;
                $successMessage .= ' | زیادەی ماوە: ' . number_format($remainingAdvance, 2) . ' ' . $sale->currency;
            }

            if ($actualExcessAmount > 0) {
                $successMessage .= ' | پارەی زیادە: ' . number_format($actualExcessAmount, 2) . ' ' . $sale->currency;
            }

            return redirect()->route('sales.show', $sale)
                ->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە نوێکردنەوەی فرۆشتن: ' . $e->getMessage());

            return redirect()->back()
                ->withInput()
                ->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function destroy(Sale $sale)
    {
        DB::beginTransaction();

        try {
            // گەڕانەوەی بڕەکان بۆ ستۆک
            foreach ($sale->items as $item) {
                $product = $item->product;
                if ($product->track_stock) {
                    $product->addStock($item->quantity, true);
                }
            }

            // گەڕانەوەی پارەی زیادە و بەکارهێنانی زیادە
            if ($sale->payments()->exists()) {
                $customer = $sale->customer;
                if ($customer) {
                    $totalExcess = $sale->payments()->sum('excess_amount');
                    $totalAdvanceUsed = $sale->payments()->sum('advance_used');

                    if ($totalExcess > 0) {
                        $negativeField = $sale->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                        $customer->decrement($negativeField, $totalExcess);
                    }

                    if ($totalAdvanceUsed > 0) {
                        $negativeField = $sale->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                        $customer->increment($negativeField, $totalAdvanceUsed);
                    }
                }
            }

            // کەمکردنەوەی قەرزی کڕیار
            if ($sale->sale_type === 'credit' && $sale->customer_id && $sale->remaining_amount > 0) {
                $customer = Customer::find($sale->customer_id);
                if ($customer) {
                    $balanceField = $sale->currency == 'IQD' ? 'balance_iqd' : 'balance_usd';
                    $customer->decrement($balanceField, $sale->remaining_amount);
                }
            }

            $sale->delete();

            DB::commit();

            return redirect()->route('sales.index')
                ->with('success', 'فرۆشتن بە سەرکەوتوویی سڕایەوە');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە سڕینەوەی فرۆشتن: ' . $e->getMessage());

            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function print(Sale $sale)
    {
        $sale->load([
            'customer',
            'user',
            'items.product',
            'items.product.baseUnit'
        ]);

        $company = \App\Models\Company::first();

        return Inertia::render('Sales/Print', [
            'sale' => $sale,
            'company' => $company,
        ]);
    }

    public function addPayment(Request $request, Sale $sale)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . ($sale->remaining_amount * 2),
            'payment_method' => 'required|in:cash,pos,transfer',
            'notes' => 'nullable|string',
            'use_advance' => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            $customer = $sale->customer;
            $paymentAmount = $request->amount;
            $useAdvance = $request->use_advance ?? false;
            $excessAmount = 0;
            $debtReduction = 0;
            $advanceUsed = 0;
            $cashPayment = 0;

            $availableAdvance = 0;
            if ($customer) {
                $availableAdvance = $sale->currency == 'IQD'
                    ? $customer->negative_balance_iqd
                    : $customer->negative_balance_usd;
            }

            // ١. بەکارهێنانی زیادە
            if ($useAdvance && $availableAdvance > 0) {
                $advanceUsed = min($paymentAmount, $availableAdvance, $sale->remaining_amount);
                $debtReduction = $advanceUsed;

                // کەمکردنەوەی زیادە
                if ($advanceUsed > 0) {
                    $negativeField = $sale->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                    $customer->decrement($negativeField, $advanceUsed);
                }

                // ٢. پارەی ڕاستەوخۆ
                $remainingPayment = $paymentAmount - $advanceUsed;
                if ($remainingPayment > 0) {
                    if ($remainingPayment > $sale->remaining_amount - $advanceUsed) {
                        $cashPayment = $sale->remaining_amount - $advanceUsed;
                        $excessAmount = $remainingPayment - $cashPayment;
                    } else {
                        $cashPayment = $remainingPayment;
                    }
                    $debtReduction += $cashPayment;
                }
            } else {
                // تەنها پارەی ڕاستەوخۆ
                if ($paymentAmount > $sale->remaining_amount) {
                    $debtReduction = $sale->remaining_amount;
                    $cashPayment = $sale->remaining_amount;
                    $excessAmount = $paymentAmount - $sale->remaining_amount;
                } else {
                    $debtReduction = $paymentAmount;
                    $cashPayment = $paymentAmount;
                }
            }

            $sale->increment('paid_amount', $debtReduction);
            $sale->decrement('remaining_amount', $debtReduction);

            // زیادکردنی پارەی زیادە
            if ($customer && $excessAmount > 0) {
                $negativeField = $sale->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                $customer->increment($negativeField, $excessAmount);
            }

            if ($sale->remaining_amount <= 0) {
                $sale->update(['sale_type' => 'cash']);
            }

            // دروستکردنی تۆمارێکی پارەدان
            Payment::create([
                'customer_id' => $sale->customer_id,
                'sale_id' => $sale->id,
                'user_id' => auth()->id(),
                'currency' => $sale->currency,
                'payment_method' => $request->payment_method,
                'type' => 'customer',
                'amount' => $paymentAmount,
                'notes' => ($request->notes ?? 'پارەدان بۆ فرۆشتن #' . $sale->invoice_number) .
                          ($advanceUsed > 0 ? " (بەکارهێنانی زیادە: " . number_format($advanceUsed, 2) . " " . $sale->currency . ")" : '') .
                          ($cashPayment > 0 ? " (پارەی ڕاستەوخۆ: " . number_format($cashPayment, 2) . " " . $sale->currency . ")" : '') .
                          ($excessAmount > 0 ? " (پارەی زیادە: " . number_format($excessAmount, 2) . " " . $sale->currency . ")" : ''),
                'payment_date' => now(),
                'status' => 'completed',
                'reference_number' => 'PAY-' . str_pad(Payment::count() + 1, 6, '0', STR_PAD_LEFT),
                'excess_amount' => $excessAmount,
                'debt_reduction' => $debtReduction,
                'advance_used' => $advanceUsed,
                'cash_payment' => $cashPayment,
            ]);

            // کەمکردنەوەی قەرزی کڕیار
            if ($customer && $debtReduction > 0) {
                $balanceField = $sale->currency == 'IQD' ? 'balance_iqd' : 'balance_usd';
                $customer->decrement($balanceField, $debtReduction);
            }

            DB::commit();

            $successMessage = 'پارەدان بە سەرکەوتوویی تۆمارکرا';

            if ($advanceUsed > 0) {
                $successMessage .= ' (بەکارهێنانی زیادە: ' . number_format($advanceUsed, 2) . ' ' . $sale->currency . ')';
            }

            if ($cashPayment > 0) {
                $successMessage .= ' (پارەی ڕاستەوخۆ: ' . number_format($cashPayment, 2) . ' ' . $sale->currency . ')';
            }

            if ($excessAmount > 0) {
                $successMessage .= ' (پارەی زیادە: ' . number_format($excessAmount, 2) . ' ' . $sale->currency . ')';
            }

            return back()->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('هەڵە لە زیادکردنی پارەدان: ' . $e->getMessage());

            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:sales,id',
        ]);

        \Log::info('دەستپێکی سڕینەوەی کۆمەڵ', [
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name,
            'sale_ids' => $request->ids,
            'count' => count($request->ids)
        ]);

        $sales = Sale::with([
            'customer:id,name,balance_iqd,balance_usd,negative_balance_iqd,negative_balance_usd',
            'items.product:id,name,track_stock,quantity,sale_to_base_factor',
            'payments:id,sale_id'
        ])
        ->whereIn('id', $request->ids)
        ->get();

        if ($sales->count() !== count($request->ids)) {
            $foundIds = $sales->pluck('id')->toArray();
            $missingIds = array_diff($request->ids, $foundIds);

            \Log::warning('هەندێک فرۆشتن نەدۆزرایەوە', [
                'missing_ids' => $missingIds,
                'found_ids' => $foundIds
            ]);

            return back()->with('error', 'هەندێک فرۆشتن نەدۆزرایەوە: ID#' . implode(', ', $missingIds));
        }

        $salesWithPayments = $sales->filter(function($sale) {
            return $sale->payments && $sale->payments->count() > 0;
        });

        if ($salesWithPayments->count() > 0) {
            $invoiceNumbers = $salesWithPayments->pluck('invoice_number')->toArray();

            \Log::warning('فرۆشتنە پارەدراوەکان ناتوانرێت بسڕدرێنەوە', [
                'invoice_numbers' => $invoiceNumbers
            ]);

            $errorMessage = 'هەندێک فرۆشتن ناتوانرێت بسڕدرێنەوە، چونکە پارەدان بۆ کراون: ' .
                            implode(', ', array_slice($invoiceNumbers, 0, 5));

            if (count($invoiceNumbers) > 5) {
                $errorMessage .= ' و ' . (count($invoiceNumbers) - 5) . ' فرۆشتنەکی تر';
            }

            return back()->with('error', $errorMessage);
        }

        DB::beginTransaction();

        try {
            $deletedCount = 0;
            $stockRestored = 0;
            $debtReduced = 0;
            $advanceReturned = 0;
            $excessReturned = 0;

            foreach ($sales as $sale) {
                \Log::info('دەستپێکی سڕینەوەی فرۆشتن', [
                    'sale_id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'customer_id' => $sale->customer_id,
                    'customer_name' => $sale->customer ? $sale->customer->name : 'بێ کڕیار',
                    'sale_type' => $sale->sale_type,
                    'currency' => $sale->currency,
                    'total_amount' => $sale->total_amount,
                    'paid_amount' => $sale->paid_amount,
                    'remaining_amount' => $sale->remaining_amount
                ]);

                // A. گەڕانەوەی ستۆک
                if ($sale->items->count() > 0) {
                    foreach ($sale->items as $item) {
                        if ($item->product && $item->product->track_stock) {
                            $product = $item->product;
                            $oldQuantity = $product->quantity;

                            $product->addStock($item->quantity, true);
                            $product->refresh();

                            $stockRestored++;

                            \Log::info('ستۆک گەڕێندرایەوە', [
                                'product_id' => $product->id,
                                'product_name' => $product->name,
                                'sale_item_quantity' => $item->quantity,
                                'old_stock' => $oldQuantity,
                                'new_stock' => $product->quantity,
                                'sale_id' => $sale->id,
                                'invoice' => $sale->invoice_number
                            ]);
                        }
                    }
                }

                // B. گەڕانەوەی پارەی زیادە و بەکارهێنانی زیادە
                if ($sale->payments()->exists() && $sale->customer) {
                    $customer = $sale->customer;
                    $totalExcess = $sale->payments()->sum('excess_amount');
                    $totalAdvanceUsed = $sale->payments()->sum('advance_used');

                    if ($totalExcess > 0) {
                        $negativeField = $sale->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                        $oldAdvance = $customer->{$negativeField};

                        $customer->decrement($negativeField, $totalExcess);
                        $customer->refresh();

                        $excessReturned++;

                        \Log::info('پارەی زیادە گەڕێندرایەوە', [
                            'customer_id' => $customer->id,
                            'customer_name' => $customer->name,
                            'sale_id' => $sale->id,
                            'invoice_number' => $sale->invoice_number,
                            'currency' => $sale->currency,
                            'excess_amount' => $totalExcess,
                            'old_advance' => $oldAdvance,
                            'new_advance' => $customer->{$negativeField}
                        ]);
                    }

                    if ($totalAdvanceUsed > 0) {
                        $negativeField = $sale->currency == 'IQD' ? 'negative_balance_iqd' : 'negative_balance_usd';
                        $oldAdvance = $customer->{$negativeField};

                        $customer->increment($negativeField, $totalAdvanceUsed);
                        $customer->refresh();

                        $advanceReturned++;

                        \Log::info('بەکارهێنانی زیادە گەڕێندرایەوە', [
                            'customer_id' => $customer->id,
                            'customer_name' => $customer->name,
                            'sale_id' => $sale->id,
                            'invoice_number' => $sale->invoice_number,
                            'currency' => $sale->currency,
                            'advance_used' => $totalAdvanceUsed,
                            'old_advance' => $oldAdvance,
                            'new_advance' => $customer->{$negativeField}
                        ]);
                    }
                }

                // C. کەمکردنەوەی قەرزی کڕیار
                if ($sale->sale_type === 'credit' &&
                    $sale->customer_id &&
                    $sale->remaining_amount > 0 &&
                    $sale->customer) {

                    $customer = $sale->customer;
                    $balanceField = $sale->currency == 'IQD' ? 'balance_iqd' : 'balance_usd';
                    $oldBalance = $customer->{$balanceField};

                    $customer->decrement($balanceField, $sale->remaining_amount);
                    $customer->refresh();
                    $newBalance = $customer->{$balanceField};

                    $debtReduced++;

                    \Log::info('قەرزی کڕیار کەمکرایەوە', [
                        'customer_id' => $customer->id,
                        'customer_name' => $customer->name,
                        'sale_id' => $sale->id,
                        'invoice_number' => $sale->invoice_number,
                        'currency' => $sale->currency,
                        'balance_field' => $balanceField,
                        'debt_amount' => $sale->remaining_amount,
                        'old_balance' => $oldBalance,
                        'new_balance' => $newBalance
                    ]);
                }

                // D. سڕینەوەی ئایتمەکان
                $itemsCount = $sale->items()->count();
                $sale->items()->delete();

                \Log::info('ئایتمەکانی فرۆشتن سڕایەوە', [
                    'sale_id' => $sale->id,
                    'items_count' => $itemsCount
                ]);

                // E. سڕینەوەی پارەدانەکان
                $paymentsCount = $sale->payments()->count();
                $sale->payments()->delete();

                \Log::info('پارەدانەکانی فرۆشتن سڕایەوە', [
                    'sale_id' => $sale->id,
                    'payments_count' => $paymentsCount
                ]);

                // F. سڕینەوەی فرۆشتن
                $sale->delete();
                $deletedCount++;

                \Log::info('فرۆشتن سڕایەوە', [
                    'sale_id' => $sale->id,
                    'invoice_number' => $sale->invoice_number
                ]);
            }

            DB::commit();

            \Log::info('سڕینەوەی کۆمەڵ سەرکەوتوو بوو', [
                'total_sales' => $deletedCount,
                'stock_restored' => $stockRestored,
                'debt_reduced' => $debtReduced,
                'advance_returned' => $advanceReturned,
                'excess_returned' => $excessReturned,
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name
            ]);

            $successMessage = "{$deletedCount} فرۆشتن بە سەرکەوتوویی سڕایەوە";

            if ($stockRestored > 0) {
                $successMessage .= " | {$stockRestored} بەرهەم گەڕێندرایەوە بۆ ستۆک";
            }

            if ($debtReduced > 0) {
                $successMessage .= " | قەرزی {$debtReduced} کڕیار کەمکرایەوە";
            }

            if ($advanceReturned > 0) {
                $successMessage .= " | بەکارهێنانی زیادە گەڕێندرایەوە";
            }

            if ($excessReturned > 0) {
                $successMessage .= " | پارەی زیادە گەڕێندرایەوە";
            }

            return redirect()->route('sales.index')
                ->with('success', $successMessage);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('هەڵە لە سڕینەوەی کۆمەڵی فرۆشتن', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'sale_ids' => $request->ids,
                'user_id' => auth()->id()
            ]);

            return back()->with('error', 'هەڵەیەک ڕوویدا لە سڕینەوەی فرۆشتنەکان: ' . $e->getMessage());
        }
    }

    public function export(Request $request)
    {
        $query = Sale::with(['customer', 'user', 'items']);

        if ($request->from_date) {
            $query->whereDate('sale_date', '>=', $request->from_date);
        }
        if ($request->to_date) {
            $query->whereDate('sale_date', '<=', $request->to_date);
        }
        if ($request->sale_type) {
            $query->where('sale_type', $request->sale_type);
        }

        $sales = $query->get();

        $data = [
            'sales' => $sales,
            'total_amount' => $sales->sum('total_amount'),
            'total_paid' => $sales->sum('paid_amount'),
            'total_remaining' => $sales->sum('remaining_amount'),
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
            'export_date' => now()->format('Y-m-d H:i:s'),
        ];

        return Inertia::render('Sales/Export', $data);
    }

    public function addProductInSale(Request $request)
    {
        try {
            $validated = $request->validate([
                'category_id' => 'required|exists:categories,id',
                'name' => 'required|string|max:255',
                'code' => 'required|string|unique:products,code',
                'barcode' => 'nullable|string|unique:products,barcode',
                'base_unit_id' => 'required|exists:units,id',
                'purchase_unit_id' => 'nullable|exists:units,id',
                'sale_unit_id' => 'nullable|exists:units,id',
                'purchase_to_base_factor' => 'nullable|numeric|min:0.000001',
                'sale_to_base_factor' => 'nullable|numeric|min:0.000001',
                'purchase_price_iqd' => 'required|numeric|min:0',
                'purchase_price_usd' => 'required|numeric|min:0',
                'selling_price_iqd' => 'required|numeric|min:0',
                'selling_price_usd' => 'required|numeric|min:0',
                'quantity' => 'required|numeric|min:0',
                'min_stock_level' => 'required|numeric|min:0',
                'track_stock' => 'required|boolean',
                'description' => 'nullable|string',
            ]);

            if ($request->hasFile('image')) {
                $request->validate([
                    'image' => 'image|max:2048|mimes:jpg,jpeg,png,gif,webp',
                ]);
            }

            if (empty($validated['purchase_unit_id'])) {
                $validated['purchase_unit_id'] = $validated['base_unit_id'];
                $validated['purchase_to_base_factor'] = 1;
            } elseif (empty($validated['purchase_to_base_factor'])) {
                $validated['purchase_to_base_factor'] = 1;
            }

            if (empty($validated['sale_unit_id'])) {
                $validated['sale_unit_id'] = $validated['base_unit_id'];
                $validated['sale_to_base_factor'] = 1;
            } elseif (empty($validated['sale_to_base_factor'])) {
                $validated['sale_to_base_factor'] = 1;
            }

            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('products', 'public');
                $validated['image'] = $imagePath;
            }

            $product = Product::create($validated);

            $product->load(['category', 'baseUnit', 'saleUnit']);

            $productData = [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'barcode' => $product->barcode,
                'image_url' => $product->getImageUrlAttribute(),
                'quantity' => $product->quantity,
                'min_stock_level' => $product->min_stock_level,
                'track_stock' => $product->track_stock,
                'purchase_price_iqd' => $product->purchase_price_iqd,
                'purchase_price_usd' => $product->purchase_price_usd,
                'selling_price_iqd' => $product->selling_price_iqd,
                'selling_price_usd' => $product->selling_price_usd,
                'sale_unit_id' => $product->sale_unit_id,
                'sale_to_base_factor' => $product->sale_to_base_factor,
                'unit_label' => $product->saleUnit ? $product->saleUnit->name : 'دانە',
                'category_name' => $product->category ? $product->category->name : 'بێ کاتێگۆری',
                'available_quantity' => $product->getAvailableInSaleUnit()
            ];

            return response()->json([
                'success' => true,
                'message' => 'بەرهەم بە سەرکەوتوویی زیادکرا',
                'product' => $productData
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('هەڵە لە زیادکردنی بەرهەم: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'هەڵەیەک ڕوویدا لە کاتی زیادکردنی بەرهەم: ' . $e->getMessage()
            ], 500);
        }
    }
}
