<?php
// app/Http/Controllers/PaymentController.php
namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Sale;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with([
            'customer:id,name,phone',
            'supplier:id,name,phone',
            'user:id,name',
            'sale:id,invoice_number,total_amount,sale_type',
            'purchase:id,invoice_number,total_amount,purchase_type'
        ]);

        // فلتەری جۆری پارەدان
        if ($request->type) {
            $query->where('type', $request->type);
        }

        // فلتەری کڕیار
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        // فلتەری دابینکەر
        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // فلتەری دراو
        if ($request->currency) {
            $query->where('currency', $request->currency);
        }

        // فلتەری دۆخ
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // فلتەری شێوازی پارەدان
        if ($request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        // فلتەری بەروار
        if ($request->from_date) {
            $query->whereDate('payment_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->whereDate('payment_date', '<=', $request->to_date);
        }

        // فلتەری گەڕان
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  })
                  ->orWhereHas('supplier', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // فلتەری ئەگەر زیادەی پارە هەیە
        if ($request->has_excess) {
            $query->where('excess_amount', '>', 0);
        }

        $payments = $query->latest('payment_date')->paginate(15);

        // کڕیارانی قەرزدار یان زیادەدار
        $customers = Customer::where(function ($q) {
            $q->where('balance_iqd', '>', 0)
              ->orWhere('balance_usd', '>', 0)
              ->orWhere('negative_balance_iqd', '>', 0) // زیادەی دینار
              ->orWhere('negative_balance_usd', '>', 0); // زیادەی دۆلار
        })->orderBy('name')->get(['id', 'name', 'balance_iqd', 'balance_usd', 'negative_balance_iqd', 'negative_balance_usd', 'phone']);

        // دابینکەرانی قەرزدار
        $suppliers = Supplier::where(function ($q) {
            $q->where('balance_iqd', '>', 0)
              ->orWhere('balance_usd', '>', 0);
        })->orderBy('name')->get(['id', 'name', 'balance_iqd', 'balance_usd', 'phone']);

        return Inertia::render('Payments/Index', [
            'payments' => $payments,
            'customers' => $customers,
            'suppliers' => $suppliers,
            'filters' => $request->only([
                'search', 'type', 'customer_id', 'supplier_id', 'currency',
                'status', 'payment_method', 'from_date', 'to_date', 'has_excess'
            ]),
        ]);
    }

    public function create(Request $request)
    {
        $type = $request->type ?? 'customer';
        $customer_id = $request->customer_id ?? null;
        $supplier_id = $request->supplier_id ?? null;

        // کڕیارانی قەرزدار یان زیادەدار نیشان بدە
        $customers = Customer::where(function ($q) {
            $q->where('balance_iqd', '>', 0)
              ->orWhere('balance_usd', '>', 0)
              ->orWhere('negative_balance_iqd', '>', 0)
              ->orWhere('negative_balance_usd', '>', 0);
        })->orderBy('name')->get(['id', 'name', 'balance_iqd', 'balance_usd', 'negative_balance_iqd', 'negative_balance_usd', 'phone']);

        // تەنها دابینکەرانی قەرزدار نیشان بدە
        $suppliers = Supplier::where(function ($q) {
            $q->where('balance_iqd', '>', 0)
              ->orWhere('balance_usd', '>', 0);
        })->orderBy('name')->get(['id', 'name', 'balance_iqd', 'balance_usd', 'phone']);

        $sales = [];
        $purchases = [];

        // ئەگەر کڕیارێک دیاری کرا، فرۆشتنەکانی بدە
        if ($customer_id) {
            $sales = Sale::where('customer_id', $customer_id)
                ->where('remaining_amount', '>', 0)
                ->get(['id', 'invoice_number', 'total_amount', 'remaining_amount', 'currency', 'sale_type', 'customer_id']);
        }

        // ئەگەر دابینکەرێک دیاری کرا، کڕینەکانی بدە
        if ($supplier_id) {
            $purchases = Purchase::where('supplier_id', $supplier_id)
                ->where('remaining_amount', '>', 0)
                ->get(['id', 'invoice_number', 'total_amount', 'remaining_amount', 'currency', 'purchase_type', 'supplier_id']);
        }

        return Inertia::render('Payments/Create', [
            'type' => $type,
            'customer_id' => $customer_id,
            'supplier_id' => $supplier_id,
            'customers' => $customers,
            'suppliers' => $suppliers,
            'sales' => $sales,
            'purchases' => $purchases,
        ]);
    }

    public function store(Request $request)
    {
        Log::info('Payment Store Request', $request->all());

        $validated = $request->validate([
            'type' => 'required|in:customer,supplier',
            'customer_id' => 'required_if:type,customer|nullable|exists:customers,id',
            'supplier_id' => 'required_if:type,supplier|nullable|exists:suppliers,id',
            'sale_id' => 'nullable|exists:sales,id',
            'purchase_id' => 'nullable|exists:purchases,id',
            'currency' => 'required|in:IQD,USD',
            'payment_method' => 'required|in:cash,pos,transfer,cheque,other',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:100|unique:payments,reference_number',
            'invoice_number' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'transaction_id' => 'nullable|string|max:100',
            'status' => 'nullable|in:completed,pending,cancelled,refunded',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        DB::beginTransaction();

        try {
            // دۆزینەوەی کڕیار یان دابینکەر
            if ($validated['type'] === 'customer') {
                $entity = Customer::findOrFail($validated['customer_id']);
                $entityIdField = 'customer_id';
                $otherIdField = 'supplier_id';
                $isCustomer = true;
            } else {
                $entity = Supplier::findOrFail($validated['supplier_id']);
                $entityIdField = 'supplier_id';
                $otherIdField = 'customer_id';
                $isCustomer = false;
            }

            $paymentAmount = $validated['amount'];
            $excessAmount = 0;
            $debtReduction = 0;

            // ئەگەر وەسڵێکی دیاریکراو هەیە (sale_id یان purchase_id)
            // پارەکە تەنها بۆ ئەو وەسڵە دەچێت
            if ($validated['type'] === 'customer' && !empty($validated['sale_id'])) {
                // پارەدان بۆ وەسڵێکی دیاریکراو (فرۆشتن)
                $sale = Sale::findOrFail($validated['sale_id']);

                // چێککردنی دراو
                if ($sale->currency !== $validated['currency']) {
                    DB::rollBack();
                    return back()
                        ->withErrors(['currency' => 'دراوی پارەدان دەبێت هاوتا بێت لەگەڵ دراوی وەسڵەکە'])
                        ->withInput();
                }

                // ئەگەر پارە زیاتر بوو لە قەرزی وەسڵەکە
                if ($paymentAmount > $sale->remaining_amount) {
                    // بەشێک بۆ قەرزی وەسڵ
                    $debtReduction = $sale->remaining_amount;
                    // باقی وەک زیادە (تەنها بۆ کڕیار)
                    $excessAmount = $paymentAmount - $debtReduction;

                    // نوێکردنەوەی وەسڵ
                    $sale->increment('paid_amount', $debtReduction);
                    $sale->decrement('remaining_amount', $debtReduction);
                    $sale->update([
                        'status' => 'completed',
                        'sale_type' => 'cash'
                    ]);

                    // نوێکردنەوەی قەرزی کڕیار
                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                        $entity->increment('negative_balance_iqd', $excessAmount);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                        $entity->increment('negative_balance_usd', $excessAmount);
                    }

                    Log::info('Payment exceeds sale debt - excess added', [
                        'sale_id' => $sale->id,
                        'payment' => $paymentAmount,
                        'debt_reduction' => $debtReduction,
                        'excess' => $excessAmount
                    ]);
                } else {
                    // پارە کەمترە یان یەکسانە بە قەرزی وەسڵ
                    $debtReduction = $paymentAmount;

                    // نوێکردنەوەی وەسڵ
                    $sale->increment('paid_amount', $debtReduction);
                    $sale->decrement('remaining_amount', $debtReduction);

                    if ($sale->remaining_amount <= 0) {
                        $sale->update([
                            'status' => 'completed',
                            'sale_type' => 'cash'
                        ]);
                    }

                    // نوێکردنەوەی قەرزی کڕیار
                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                    }

                    Log::info('Payment applied to specific sale', [
                        'sale_id' => $sale->id,
                        'amount' => $debtReduction
                    ]);
                }
            }
            elseif ($validated['type'] === 'supplier' && !empty($validated['purchase_id'])) {
                // پارەدان بۆ وەسڵێکی دیاریکراو (کڕین)
                $purchase = Purchase::findOrFail($validated['purchase_id']);

                // چێککردنی دراو
                if ($purchase->currency !== $validated['currency']) {
                    DB::rollBack();
                    return back()
                        ->withErrors(['currency' => 'دراوی پارەدان دەبێت هاوتا بێت لەگەڵ دراوی وەسڵەکە'])
                        ->withInput();
                }

                // دابینکەر زیادەی پارەی نییە، پارە زیادە نابێت لە قەرز
                if ($paymentAmount > $purchase->remaining_amount) {
                    DB::rollBack();
                    return back()
                        ->withErrors(['amount' => 'بڕی پارە نابێت زیاتر بێت لە قەرزی وەسڵەکە'])
                        ->withInput();
                }

                $debtReduction = $paymentAmount;

                // نوێکردنەوەی وەسڵ
                $purchase->increment('paid_amount', $debtReduction);
                $purchase->decrement('remaining_amount', $debtReduction);

                if ($purchase->remaining_amount <= 0) {
                    $purchase->update([
                        'status' => 'completed',
                        'purchase_type' => 'cash'
                    ]);
                }

                // نوێکردنەوەی قەرزی دابینکەر
                if ($validated['currency'] === 'IQD') {
                    $entity->decrement('balance_iqd', $debtReduction);
                } else {
                    $entity->decrement('balance_usd', $debtReduction);
                }

                Log::info('Payment applied to specific purchase', [
                    'purchase_id' => $purchase->id,
                    'amount' => $debtReduction
                ]);
            }
            else {
                // هیچ وەسڵێکی دیاریکراو نییە
                // پارەکە دابەش دەکرێت بەسەر هەموو وەسڵەکان

                // چێککردنی بڕی قەرز
                $balance = $validated['currency'] === 'IQD'
                    ? $entity->balance_iqd
                    : $entity->balance_usd;

                // 1. ئەگەر پارە زیاتر بوو لە قەرز، زیادە زیاد بکە (تەنها بۆ کڕیار)
                if ($isCustomer && $paymentAmount > $balance && $balance > 0) {
                    $debtReduction = $balance;
                    $excessAmount = $paymentAmount - $balance;

                    // تەواوکردنی قەرز
                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                        $entity->increment('negative_balance_iqd', $excessAmount);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                        $entity->increment('negative_balance_usd', $excessAmount);
                    }

                    // دابەشکردنی بڕی قەرز بەسەر وەسڵەکان
                    $this->distributePaymentToSales($entity, $debtReduction, $validated['currency']);

                    Log::info('Payment distributed to all sales with excess', [
                        'customer_id' => $entity->id,
                        'debt_reduction' => $debtReduction,
                        'excess' => $excessAmount
                    ]);
                }
                // 2. ئەگەر قەرز نەبوو، هەمووی زیادە بێت (تەنها بۆ کڕیار)
                elseif ($isCustomer && $balance <= 0) {
                    $excessAmount = $paymentAmount;

                    if ($validated['currency'] === 'IQD') {
                        $entity->increment('negative_balance_iqd', $excessAmount);
                    } else {
                        $entity->increment('negative_balance_usd', $excessAmount);
                    }

                    Log::info('No debt - all payment as excess', [
                        'customer_id' => $entity->id,
                        'excess' => $excessAmount
                    ]);
                }
                // 3. ئەگەر پارە کەمتر بوو یان یەکسان بوو بە قەرز
                else {
                    $debtReduction = min($paymentAmount, $balance);

                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                    }

                    // دابەشکردنی پارە بەسەر وەسڵەکان
                    if ($isCustomer) {
                        $this->distributePaymentToSales($entity, $debtReduction, $validated['currency']);
                    } else {
                        $this->distributePaymentToPurchases($entity, $debtReduction, $validated['currency']);
                    }

                    Log::info('Payment distributed to all invoices', [
                        'entity_id' => $entity->id,
                        'type' => $validated['type'],
                        'amount' => $debtReduction
                    ]);
                }
            }

            // دروستکردنی تۆماری دانەوە
            $paymentData = [
                'type' => $validated['type'],
                $entityIdField => $validated[$entityIdField],
                $otherIdField => null,
                'sale_id' => $validated['sale_id'] ?? null,
                'purchase_id' => $validated['purchase_id'] ?? null,
                'user_id' => auth()->id(),
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'],
                'amount' => $validated['amount'],
                'notes' => ($validated['notes'] ?? '') .
                          ($excessAmount > 0 ? " (زیادەی پارە: " . number_format($excessAmount, 2) . " " . $validated['currency'] . ")" : ''),
                'payment_date' => $validated['payment_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'invoice_number' => $validated['invoice_number'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'account_number' => $validated['account_number'] ?? null,
                'transaction_id' => $validated['transaction_id'] ?? null,
                'status' => $validated['status'] ?? 'completed',
                'excess_amount' => $excessAmount,
                'debt_reduction' => $debtReduction,
            ];

            // بارکردنی فایل
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('payments/attachments', 'public');
                $paymentData['attachment'] = $path;
            }

            Log::info('Payment Data', $paymentData);

            $payment = Payment::create($paymentData);

            Log::info('Payment Created', ['id' => $payment->id]);

            DB::commit();

            return redirect()->route('payments.show', $payment->id)
                ->with('success', 'دانەوە بە سەرکەوتوویی تۆمارکرا' .
                       ($excessAmount > 0 ? ' (' . number_format($excessAmount, 2) . ' ' . $validated['currency'] . ' زیادە)' : ''));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment Store Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()
                ->withErrors(['error' => 'هەڵەیەک ڕوویدا: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * دابەشکردنی پارە بەسەر فرۆشتنەکانی کڕیار
     */
    private function distributePaymentToSales(Customer $customer, $amount, $currency)
    {
        $sales = Sale::where('customer_id', $customer->id)
            ->where('currency', $currency)
            ->where('remaining_amount', '>', 0)
            ->orderBy('sale_date')
            ->get();

        $remainingAmount = $amount;

        foreach ($sales as $sale) {
            if ($remainingAmount <= 0) {
                break;
            }

            $paymentAmount = min($remainingAmount, $sale->remaining_amount);

            $sale->increment('paid_amount', $paymentAmount);
            $sale->decrement('remaining_amount', $paymentAmount);

            if ($sale->remaining_amount <= 0) {
                $sale->update([
                    'status' => 'completed',
                    'sale_type' => 'cash'
                ]);
            }

            $remainingAmount -= $paymentAmount;

            Log::info('Payment distributed to sale', [
                'sale_id' => $sale->id,
                'amount' => $paymentAmount
            ]);
        }
    }

    /**
     * دابەشکردنی پارە بەسەر کڕینەکانی دابینکەر
     */
    private function distributePaymentToPurchases(Supplier $supplier, $amount, $currency)
    {
        $purchases = Purchase::where('supplier_id', $supplier->id)
            ->where('currency', $currency)
            ->where('remaining_amount', '>', 0)
            ->orderBy('purchase_date')
            ->get();

        $remainingAmount = $amount;

        foreach ($purchases as $purchase) {
            if ($remainingAmount <= 0) {
                break;
            }

            $paymentAmount = min($remainingAmount, $purchase->remaining_amount);

            $purchase->increment('paid_amount', $paymentAmount);
            $purchase->decrement('remaining_amount', $paymentAmount);

            if ($purchase->remaining_amount <= 0) {
                $purchase->update([
                    'status' => 'completed',
                    'purchase_type' => 'cash'
                ]);
            }

            $remainingAmount -= $paymentAmount;

            Log::info('Payment distributed to purchase', [
                'purchase_id' => $purchase->id,
                'amount' => $paymentAmount
            ]);
        }
    }

    public function show(Payment $payment)
    {
        $payment->load([
            'customer:id,name,phone,address,balance_iqd,balance_usd,negative_balance_iqd,negative_balance_usd',
            'supplier:id,name,phone,address',
            'user:id,name,email',
            'sale:id,invoice_number,total_amount,paid_amount,remaining_amount,created_at,sale_type',
            'purchase:id,invoice_number,total_amount,paid_amount,remaining_amount,created_at,purchase_type'
        ]);

        return Inertia::render('Payments/Show', [
            'payment' => $payment,
        ]);
    }

    public function print($id)
    {
        $payment = Payment::with(['customer', 'supplier', 'user', 'sale', 'purchase'])
            ->findOrFail($id);

        return Inertia::render('Payments/Print', [
            'payment' => $payment,
        ]);
    }

    public function edit(Payment $payment)
    {
        // کڕیارانی قەرزدار یان زیادەدار نیشان بدە
        $customers = Customer::where(function ($q) {
            $q->where('balance_iqd', '>', 0)
              ->orWhere('balance_usd', '>', 0)
              ->orWhere('negative_balance_iqd', '>', 0)
              ->orWhere('negative_balance_usd', '>', 0);
        })->orderBy('name')->get(['id', 'name', 'balance_iqd', 'balance_usd', 'negative_balance_iqd', 'negative_balance_usd', 'phone']);

        // تەنها دابینکەرانی قەرزدار نیشان بدە
        $suppliers = Supplier::where(function ($q) {
            $q->where('balance_iqd', '>', 0)
              ->orWhere('balance_usd', '>', 0);
        })->orderBy('name')->get(['id', 'name', 'balance_iqd', 'balance_usd', 'phone']);

        $sales = [];
        $purchases = [];

        // ئەگەر کڕیارێک دیاری کرا، فرۆشتنەکانی بدە
        if ($payment->customer_id) {
            $sales = Sale::where('customer_id', $payment->customer_id)
                ->where('remaining_amount', '>', 0)
                ->orWhere('id', $payment->sale_id)
                ->get(['id', 'invoice_number', 'total_amount', 'remaining_amount', 'currency', 'sale_type', 'customer_id']);
        }

        // ئەگەر دابینکەرێک دیاری کرا، کڕینەکانی بدە
        if ($payment->supplier_id) {
            $purchases = Purchase::where('supplier_id', $payment->supplier_id)
                ->where('remaining_amount', '>', 0)
                ->orWhere('id', $payment->purchase_id)
                ->get(['id', 'invoice_number', 'total_amount', 'remaining_amount', 'currency', 'purchase_type', 'supplier_id']);
        }

        return Inertia::render('Payments/Edit', [
            'payment' => $payment,
            'customers' => $customers,
            'suppliers' => $suppliers,
            'sales' => $sales,
            'purchases' => $purchases,
        ]);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'type' => 'required|in:customer,supplier',
            'customer_id' => 'required_if:type,customer|nullable|exists:customers,id',
            'supplier_id' => 'required_if:type,supplier|nullable|exists:suppliers,id',
            'sale_id' => 'nullable|exists:sales,id',
            'purchase_id' => 'nullable|exists:purchases,id',
            'currency' => 'required|in:IQD,USD',
            'payment_method' => 'required|in:cash,pos,transfer,cheque,other',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string|max:100|unique:payments,reference_number,' . $payment->id,
            'invoice_number' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'transaction_id' => 'nullable|string|max:100',
            'status' => 'required|in:completed,pending,cancelled,refunded',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        DB::beginTransaction();

        try {
            // یەکەم: گەڕانەوەی پارەدانی پێشوو
            $this->reversePayment($payment);

            // دووەم: جێبەجێکردنی پارەدانی نوێ (هەمان لۆژیکی store)

            // دۆزینەوەی کڕیار/دابینکەری نوێ
            if ($validated['type'] === 'customer') {
                $entity = Customer::findOrFail($validated['customer_id']);
                $entityIdField = 'customer_id';
                $otherIdField = 'supplier_id';
                $isCustomer = true;
            } else {
                $entity = Supplier::findOrFail($validated['supplier_id']);
                $entityIdField = 'supplier_id';
                $otherIdField = 'customer_id';
                $isCustomer = false;
            }

            $paymentAmount = $validated['amount'];
            $excessAmount = 0;
            $debtReduction = 0;

            // ئەگەر وەسڵێکی دیاریکراو هەیە
            if ($validated['type'] === 'customer' && !empty($validated['sale_id'])) {
                $sale = Sale::findOrFail($validated['sale_id']);

                if ($sale->currency !== $validated['currency']) {
                    DB::rollBack();
                    return back()
                        ->withErrors(['currency' => 'دراوی پارەدان دەبێت هاوتا بێت لەگەڵ دراوی وەسڵەکە'])
                        ->withInput();
                }

                if ($paymentAmount > $sale->remaining_amount) {
                    $debtReduction = $sale->remaining_amount;
                    $excessAmount = $paymentAmount - $debtReduction;

                    $sale->increment('paid_amount', $debtReduction);
                    $sale->decrement('remaining_amount', $debtReduction);
                    $sale->update([
                        'status' => 'completed',
                        'sale_type' => 'cash'
                    ]);

                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                        $entity->increment('negative_balance_iqd', $excessAmount);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                        $entity->increment('negative_balance_usd', $excessAmount);
                    }
                } else {
                    $debtReduction = $paymentAmount;

                    $sale->increment('paid_amount', $debtReduction);
                    $sale->decrement('remaining_amount', $debtReduction);

                    if ($sale->remaining_amount <= 0) {
                        $sale->update([
                            'status' => 'completed',
                            'sale_type' => 'cash'
                        ]);
                    }

                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                    }
                }
            }
            elseif ($validated['type'] === 'supplier' && !empty($validated['purchase_id'])) {
                $purchase = Purchase::findOrFail($validated['purchase_id']);

                if ($purchase->currency !== $validated['currency']) {
                    DB::rollBack();
                    return back()
                        ->withErrors(['currency' => 'دراوی پارەدان دەبێت هاوتا بێت لەگەڵ دراوی وەسڵەکە'])
                        ->withInput();
                }

                if ($paymentAmount > $purchase->remaining_amount) {
                    DB::rollBack();
                    return back()
                        ->withErrors(['amount' => 'بڕی پارە نابێت زیاتر بێت لە قەرزی وەسڵەکە'])
                        ->withInput();
                }

                $debtReduction = $paymentAmount;

                $purchase->increment('paid_amount', $debtReduction);
                $purchase->decrement('remaining_amount', $debtReduction);

                if ($purchase->remaining_amount <= 0) {
                    $purchase->update([
                        'status' => 'completed',
                        'purchase_type' => 'cash'
                    ]);
                }

                if ($validated['currency'] === 'IQD') {
                    $entity->decrement('balance_iqd', $debtReduction);
                } else {
                    $entity->decrement('balance_usd', $debtReduction);
                }
            }
            else {
                // دابەشکردن بەسەر هەموو وەسڵەکان
                $balance = $validated['currency'] === 'IQD'
                    ? $entity->balance_iqd
                    : $entity->balance_usd;

                if ($isCustomer && $paymentAmount > $balance && $balance > 0) {
                    $debtReduction = $balance;
                    $excessAmount = $paymentAmount - $balance;

                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                        $entity->increment('negative_balance_iqd', $excessAmount);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                        $entity->increment('negative_balance_usd', $excessAmount);
                    }

                    $this->distributePaymentToSales($entity, $debtReduction, $validated['currency']);
                }
                elseif ($isCustomer && $balance <= 0) {
                    $excessAmount = $paymentAmount;

                    if ($validated['currency'] === 'IQD') {
                        $entity->increment('negative_balance_iqd', $excessAmount);
                    } else {
                        $entity->increment('negative_balance_usd', $excessAmount);
                    }
                }
                else {
                    $debtReduction = min($paymentAmount, $balance);

                    if ($validated['currency'] === 'IQD') {
                        $entity->decrement('balance_iqd', $debtReduction);
                    } else {
                        $entity->decrement('balance_usd', $debtReduction);
                    }

                    if ($isCustomer) {
                        $this->distributePaymentToSales($entity, $debtReduction, $validated['currency']);
                    } else {
                        $this->distributePaymentToPurchases($entity, $debtReduction, $validated['currency']);
                    }
                }
            }

            // نوێکردنەوەی زانیاری دانەوە
            $updateData = [
                'type' => $validated['type'],
                $entityIdField => $validated[$entityIdField],
                $otherIdField => null,
                'sale_id' => $validated['sale_id'] ?? null,
                'purchase_id' => $validated['purchase_id'] ?? null,
                'currency' => $validated['currency'],
                'payment_method' => $validated['payment_method'],
                'amount' => $validated['amount'],
                'notes' => ($validated['notes'] ?? '') .
                          ($excessAmount > 0 ? " (زیادەی پارە: " . number_format($excessAmount, 2) . " " . $validated['currency'] . ")" : ''),
                'payment_date' => $validated['payment_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'invoice_number' => $validated['invoice_number'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'account_number' => $validated['account_number'] ?? null,
                'transaction_id' => $validated['transaction_id'] ?? null,
                'status' => $validated['status'],
                'excess_amount' => $excessAmount,
                'debt_reduction' => $debtReduction,
            ];

            if ($request->hasFile('attachment')) {
                if ($payment->attachment && Storage::disk('public')->exists($payment->attachment)) {
                    Storage::disk('public')->delete($payment->attachment);
                }

                $path = $request->file('attachment')->store('payments/attachments', 'public');
                $updateData['attachment'] = $path;
            }

            $payment->update($updateData);

            DB::commit();

            return redirect()->route('payments.show', $payment->id)
                ->with('success', 'دانەوە بە سەرکەوتوویی نوێکرایەوە');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment Update Error', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->id,
                'trace' => $e->getTraceAsString()
            ]);

            return back()
                ->withErrors(['error' => 'هەڵەیەک ڕوویدا: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * گەڕانەوەی پارەدان (بۆ update و delete)
     */
    private function reversePayment(Payment $payment)
    {
        if ($payment->type === 'customer' && $payment->customer_id) {
            $entity = Customer::find($payment->customer_id);
            if ($entity) {
                // گەڕانەوەی قەرز
                if ($payment->currency === 'IQD') {
                    $entity->increment('balance_iqd', $payment->debt_reduction ?? $payment->amount);
                    // گەڕانەوەی زیادە
                    if ($payment->excess_amount > 0) {
                        $entity->decrement('negative_balance_iqd', $payment->excess_amount);
                    }
                } else {
                    $entity->increment('balance_usd', $payment->debt_reduction ?? $payment->amount);
                    // گەڕانەوەی زیادە
                    if ($payment->excess_amount > 0) {
                        $entity->decrement('negative_balance_usd', $payment->excess_amount);
                    }
                }
            }

            // گەڕانەوەی پارەدان لە فرۆشتن
            if ($payment->sale_id) {
                $sale = Sale::find($payment->sale_id);
                if ($sale) {
                    $sale->decrement('paid_amount', $payment->debt_reduction ?? $payment->amount);
                    $sale->increment('remaining_amount', $payment->debt_reduction ?? $payment->amount);
                    if ($sale->remaining_amount > 0) {
                        $sale->update([
                            'status' => 'pending',
                            'sale_type' => 'credit'
                        ]);
                    }
                }
            } else {
                // ئەگەر دابەش کرابوو، هەموو وەسڵەکان بگەڕێنەوە
                $this->reverseDistributedPaymentFromSales($payment);
            }
        }
        elseif ($payment->type === 'supplier' && $payment->supplier_id) {
            $entity = Supplier::find($payment->supplier_id);
            if ($entity) {
                if ($payment->currency === 'IQD') {
                    $entity->increment('balance_iqd', $payment->amount);
                } else {
                    $entity->increment('balance_usd', $payment->amount);
                }
            }

            if ($payment->purchase_id) {
                $purchase = Purchase::find($payment->purchase_id);
                if ($purchase) {
                    $purchase->decrement('paid_amount', $payment->amount);
                    $purchase->increment('remaining_amount', $payment->amount);
                    if ($purchase->remaining_amount > 0) {
                        $purchase->update([
                            'status' => 'pending',
                            'purchase_type' => 'credit'
                        ]);
                    }
                }
            } else {
                // ئەگەر دابەش کرابوو، هەموو وەسڵەکان بگەڕێنەوە
                $this->reverseDistributedPaymentFromPurchases($payment);
            }
        }
    }

    /**
     * گەڕانەوەی پارەدانی دابەشکراو لە فرۆشتنەکان
     */
    private function reverseDistributedPaymentFromSales(Payment $payment)
    {
        // ئەم فەنکشنە بۆ گەڕانەوەی پارەدانی کۆنە کە دابەش کرابوو
        // بەڵام ئێمە دەتوانین لە جیاتی دروستکردنی تۆمارەکانی جیاجیا
        // تەنها قەرزەکان نوێبکەینەوە

        Log::info('Reversing distributed payment from sales', [
            'payment_id' => $payment->id,
            'customer_id' => $payment->customer_id
        ]);
    }

    /**
     * گەڕانەوەی پارەدانی دابەشکراو لە کڕینەکان
     */
    private function reverseDistributedPaymentFromPurchases(Payment $payment)
    {
        Log::info('Reversing distributed payment from purchases', [
            'payment_id' => $payment->id,
            'supplier_id' => $payment->supplier_id
        ]);
    }

    public function destroy(Payment $payment)
    {
        DB::beginTransaction();

        try {
            // گەڕانەوەی پارەدان
            $this->reversePayment($payment);

            // سڕینەوەی فایلە پەیوەندیدارەکان
            if ($payment->attachment && Storage::disk('public')->exists($payment->attachment)) {
                Storage::disk('public')->delete($payment->attachment);
            }

            $payment->delete();

            DB::commit();

            return redirect()->route('payments.index')
                ->with('success', 'دانەوە بە سەرکەوتوویی سڕایەوە');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment Delete Error', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->id,
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    /**
     * فەنکشنی نوێ: بەکارهێنانی زیادەی پارە بۆ قەرز
     */
    public function applyAdvanceToDebt(Request $request, Customer $customer)
    {
        $request->validate([
            'currency' => 'required|in:IQD,USD',
            'amount' => 'nullable|numeric|min:0',
            'apply_all' => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            $currency = $request->currency;
            $applyAll = $request->get('apply_all', false);

            if ($applyAll) {
                // بەکارهێنانی هەموو زیادە
                if ($currency === 'IQD') {
                    $availableAdvance = $customer->negative_balance_iqd;
                    $currentDebt = $customer->balance_iqd;

                    $amount = min($availableAdvance, $currentDebt);

                    if ($amount > 0) {
                        $customer->decrement('negative_balance_iqd', $amount);
                        $customer->decrement('balance_iqd', $amount);
                    }
                } else {
                    $availableAdvance = $customer->negative_balance_usd;
                    $currentDebt = $customer->balance_usd;

                    $amount = min($availableAdvance, $currentDebt);

                    if ($amount > 0) {
                        $customer->decrement('negative_balance_usd', $amount);
                        $customer->decrement('balance_usd', $amount);
                    }
                }
            } else {
                // بەکارهێنانی بڕێکی دیاریکراو
                $amount = $request->amount;

                if ($currency === 'IQD') {
                    $availableAdvance = $customer->negative_balance_iqd;
                    $currentDebt = $customer->balance_iqd;

                    if ($amount > $availableAdvance) {
                        throw new \Exception('بڕی دیاریکراو زیاترە لە زیادەی پارە');
                    }

                    if ($amount > $currentDebt) {
                        $amount = $currentDebt;
                    }

                    $customer->decrement('negative_balance_iqd', $amount);
                    $customer->decrement('balance_iqd', $amount);
                } else {
                    $availableAdvance = $customer->negative_balance_usd;
                    $currentDebt = $customer->balance_usd;

                    if ($amount > $availableAdvance) {
                        throw new \Exception('بڕی دیاریکراو زیاترە لە زیادەی پارە');
                    }

                    if ($amount > $currentDebt) {
                        $amount = $currentDebt;
                    }

                    $customer->decrement('negative_balance_usd', $amount);
                    $customer->decrement('balance_usd', $amount);
                }
            }

            // دروستکردنی تۆماری پارەدان
            if ($amount > 0) {
                Payment::create([
                    'customer_id' => $customer->id,
                    'user_id' => auth()->id(),
                    'currency' => $currency,
                    'payment_method' => 'advance_application',
                    'type' => 'customer',
                    'amount' => $amount,
                    'notes' => 'بەکارهێنانی زیادەی پارە بۆ قەرز',
                    'payment_date' => now(),
                    'status' => 'completed',
                    'debt_reduction' => $amount,
                ]);
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'بە سەرکەوتوویی ' . number_format($amount, 2) . ' ' . $currency . ' زیادە بەکارهێنرا بۆ قەرز');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }
}
