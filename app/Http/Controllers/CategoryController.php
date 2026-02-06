<?php
// app/Http/Controllers/CategoryController.php
namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        // دروستکردنی پرسیارەکە بە ژمارەی بەرهەمەکان
        $query = Category::withCount('products');

        // گەڕان
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        // ڕیزکردن
        $query->orderBy('created_at', 'desc');

        // Pagination بە چارەسەری قەراغەکان
        $perPage = $request->input('per_page', 15);
        $categories = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Categories/Create');
    }

    public function store(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        try {
            DB::beginTransaction();

            $category = new Category();
            $category->name = $validated['name'];
            $category->description = $validated['description'] ?? null;

            // مامەڵە لەگەڵ وێنە
            if ($request->hasFile('image')) {
                // دڵنیابە لەوەی فۆڵدەرەکە بوونی هەیە
                if (!Storage::disk('public')->exists('categories')) {
                    Storage::disk('public')->makeDirectory('categories');
                }

                $path = $request->file('image')->store('categories', 'public');
                $category->image = $path;
            }

            $category->save();

            DB::commit();

            return redirect()->route('categories.index')
                ->with('success', 'کاتێگۆری بە سەرکەوتوویی دروستکرا');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'هەڵەیەک ڕوویدا: ' . $e->getMessage()]);
        }
    }

    public function edit(Category $category)
    {
        // زیادکردنی ژمارەی بەرهەمەکان
        $category->loadCount('products');

        return Inertia::render('Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'remove_image' => 'nullable|boolean',
        ]);

        try {
            DB::beginTransaction();

            $category->name = $validated['name'];
            $category->description = $validated['description'] ?? null;

            // مامەڵە لەگەڵ وێنە
            if ($request->boolean('remove_image')) {
                if ($category->image) {
                    Storage::disk('public')->delete($category->image);
                    $category->image = null;
                }
            } elseif ($request->hasFile('image')) {
                // سڕینەوەی وێنەی کۆن (ئەگەر هەبێت)
                if ($category->image) {
                    Storage::disk('public')->delete($category->image);
                }

                // هەڵگرتنی وێنەی نوێ
                $path = $request->file('image')->store('categories', 'public');
                $category->image = $path;
            }

            $category->save();

            DB::commit();

            return redirect()->route('categories.index')
                ->with('success', 'کاتێگۆری بە سەرکەوتوویی نوێکرایەوە');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'هەڵەیەک ڕوویدا: ' . $e->getMessage()]);
        }
    }

    public function destroy(Category $category)
    {
        try {
            // پشکنین بۆ ئەوەی کاتێگۆری بەرهەمی هەیە یان نا
            if ($category->products()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ناتوانرێت کاتێگۆری بسڕدرێتەوە چونکە بەرهەمی تێدایە'
                ], 422);
            }

            // سڕینەوەی وێنە
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'کاتێگۆری بە سەرکەوتوویی سڕدرایەوە'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'هەڵەیەک ڕوویدا لە کاتی سڕینەوە'
            ], 500);
        }
    }
}
