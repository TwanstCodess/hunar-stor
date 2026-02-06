<?php
// app/Http/Controllers/ProductController.php
namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'baseUnit', 'purchaseUnit', 'saleUnit']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->low_stock) {
            $query->whereColumn('quantity', '<=', 'min_stock_level')
                  ->where('track_stock', true);
        }

        $products = $query->latest()->paginate(20);
        $categories = Category::all();

        // ئامارەکان
        $stats = [
            'total_products' => Product::count(),
            'total_stock' => Product::sum('quantity'),
            'low_stock_count' => Product::whereColumn('quantity', '<=', 'min_stock_level')
                ->where('track_stock', true)
                ->count(),
            'stock_value_iqd' => Product::sum(DB::raw('quantity * selling_price_iqd')),
        ];

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'category_id', 'low_stock']),
        ]);
    }

    public function create()
    {
        $categories = Category::all();
        $units = Unit::where('is_active', true)->get();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'units' => $units,
        ]);
    }

    public function store(Request $request)
    {
        // Validation یەکەم بۆ هەموو فیلدەکان
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

        // Validation دووەم بۆ وێنە
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|max:2048|mimes:jpg,jpeg,png,gif,webp',
            ]);
        }

        // زیادکردنی یەکەی پێشگریمان ئەگەر بەتاڵ بن
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

        // ڕێکارکردن بە وێنە
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = $imagePath;
        }

        // دروستکردنی بەرهەم
        Product::create($validated);

        return redirect()->route('products.index')
            ->with('success', 'بەرهەم بە سەرکەوتوویی زیادکرا');
    }

     public function edit(Product $product)
    {
        $product->load(['category', 'baseUnit', 'purchaseUnit', 'saleUnit']);
        $categories = Category::all();
        $units = Unit::where('is_active', true)->get();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'units' => $units,
        ]);
    }

       public function update(Request $request, Product $product)
    {
        // Validation یەکەم بۆ هەموو فیلدەکان
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:products,code,' . $product->id,
            'barcode' => 'nullable|string|unique:products,barcode,' . $product->id,
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

        // Validation دووەم بۆ وێنە
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|max:2048|mimes:jpg,jpeg,png,gif,webp',
            ]);
        }

        // زیادکردنی یەکەی پێشگریمان ئەگەر بەتاڵ بن
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

        // ڕێکارکردن بە وێنە
        if ($request->hasFile('image')) {
            // سڕینەوەی وێنەی کۆن
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }

            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = $imagePath;
        }
        // چێککردن بۆ remove_image
        elseif ($request->has('remove_image') && $request->input('remove_image') === '1') {
            // سڕینەوەی وێنە
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
                $validated['image'] = null;
            }
        }
        // ئەگەر remove_image بەتاڵە یان 0ە
        else {
            // بەجێهێشتنی وێنەی ئێستا
            unset($validated['image']);
        }

        $product->update($validated);

        return redirect()->route('products.index')
            ->with('success', 'بەرهەم بە سەرکەوتوویی نوێکرایەوە');
    }

public function destroy(Product $product)
{
    try {
        // چێککردن ئەگەر لە فرۆشتن یان کڕین بەکارهاتووە
        $hasSales = $product->saleItems()->exists();
        $hasPurchases = $product->purchaseItems()->exists();

        if ($hasSales || $hasPurchases) {
            // پرسیارکردن لە بەکارهێنەر (ئەمە لە React دەکرێت)
            // یان ڕێگەدان بە سڕینەوە بە مەرجێک
            return response()->json([
                'success' => false,
                'message' => 'بەرهەمەکە لە مێژووی فرۆشتن یان کڕین بەکارهاتووە.',
                'details' => [
                    'has_sales' => $hasSales,
                    'has_purchases' => $hasPurchases,
                    'sales_count' => $hasSales ? $product->saleItems()->count() : 0,
                    'purchases_count' => $hasPurchases ? $product->purchaseItems()->count() : 0,
                ]
            ], 422);
        }

        DB::beginTransaction();

        // سڕینەوەی وێنە ئەگەر هەیە
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        // سڕینەوەی بەرهەم
        $product->delete();

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'بەرهەم بە سەرکەوتوویی سڕایەوە'
        ]);

    } catch (\Exception $e) {
        DB::rollBack();

        return response()->json([
            'success' => false,
            'message' => 'هەڵەیەک ڕوویدا لە کاتی سڕینەوە',
            'error' => config('app.debug') ? $e->getMessage() : null
        ], 500);
    }
}

    public function quickAddStock(Request $request, Product $product)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.001',
            'type' => 'required|in:purchase,sale',
        ]);

        DB::transaction(function () use ($request, $product) {
            if ($request->type === 'purchase') {
                $product->addStock($request->quantity, true);
            } else {
                $product->reduceStock($request->quantity, true);
            }
        });

        return back()->with('success', 'بڕ بە سەرکەوتوویی نوێکرایەوە');
    }

    public function scanBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
        ]);

        $product = Product::where('barcode', $request->barcode)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'بەرهەم نەدۆزرایەوە',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'product' => $product->load(['category', 'baseUnit']),
        ]);
    }
}
