<?php
// app/Http/Controllers/UnitController.php
namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\UnitConversion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::withCount([
            'productsAsBase',
            'productsAsPurchase',
            'productsAsSale'
        ]);

        // گەڕان
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('name_en', 'like', '%' . $request->search . '%')
                  ->orWhere('symbol', 'like', '%' . $request->search . '%');
            });
        }

        // فلتەر بەپێی جۆر
        if ($request->type && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // فلتەر بەپێی دۆخ
        if ($request->has('is_active') && $request->is_active !== 'all') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $units = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('Units/Index', [
            'units' => $units,
            'filters' => $request->only(['search', 'type', 'is_active']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Units/Create');
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:units,name',
                'name_en' => 'nullable|string|max:255',
                'symbol' => 'nullable|string|max:10',
                'type' => 'required|in:base,packed',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $validated['is_active'] = $request->boolean('is_active', true);

            Unit::create($validated);

            return redirect()->route('units.index')
                ->with('success', 'یەکە بە سەرکەوتوویی زیادکرا');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function edit(Unit $unit)
    {
        $unit->loadCount([
            'productsAsBase',
            'productsAsPurchase',
            'productsAsSale'
        ]);

        return Inertia::render('Units/Edit', [
            'unit' => $unit,
        ]);
    }

    public function update(Request $request, Unit $unit)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:units,name,' . $unit->id,
                'name_en' => 'nullable|string|max:255',
                'symbol' => 'nullable|string|max:10',
                'type' => 'required|in:base,packed',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $validated['is_active'] = $request->boolean('is_active', false);

            $unit->update($validated);

            return redirect()->route('units.index')
                ->with('success', 'یەکە بە سەرکەوتوویی نوێکرایەوە');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function destroy(Unit $unit)
    {
        if (!$unit->canBeDeleted()) {
            return back()->with('error', 'ناتوانرێت بسڕێتەوە، چونکە بەکاردێت لە بەرهەمەکان');
        }

        $unit->delete();

        return redirect()->route('units.index')
            ->with('success', 'یەکە بە سەرکەوتوویی سڕایەوە');
    }

    public function conversions(Unit $unit)
    {
        $unit->load(['conversionsFrom.toUnit', 'conversionsTo.fromUnit']);

        $availableUnits = Unit::where('id', '!=', $unit->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Units/Conversions', [
            'unit' => $unit,
            'availableUnits' => $availableUnits,
        ]);
    }

    public function storeConversion(Request $request, Unit $unit)
    {
        try {
            $validated = $request->validate([
                'to_unit_id' => 'required|exists:units,id|different:from_unit_id',
                'conversion_factor' => 'required|numeric|min:0.000001',
                'notes' => 'nullable|string',
            ]);

            // چێککردنی دووبارەبوونەوە
            $exists = UnitConversion::where('from_unit_id', $unit->id)
                ->where('to_unit_id', $validated['to_unit_id'])
                ->exists();

            if ($exists) {
                return back()->with('error', 'ئەم گۆڕینە پێشتر هەیە');
            }

            // دروستکردنی گۆڕین
            UnitConversion::create([
                'from_unit_id' => $unit->id,
                'to_unit_id' => $validated['to_unit_id'],
                'conversion_factor' => $validated['conversion_factor'],
                'notes' => $validated['notes'],
            ]);

            // دروستکردنی گۆڕینی پێچەوانە
            UnitConversion::create([
                'from_unit_id' => $validated['to_unit_id'],
                'to_unit_id' => $unit->id,
                'conversion_factor' => 1 / $validated['conversion_factor'],
                'notes' => $validated['notes'] ? 'پێچەوانە: ' . $validated['notes'] : null,
            ]);

            return back()->with('success', 'گۆڕین بە سەرکەوتوویی زیادکرا');

        } catch (\Exception $e) {
            return back()->with('error', 'هەڵەیەک ڕوویدا: ' . $e->getMessage());
        }
    }

    public function destroyConversion(UnitConversion $conversion)
    {
        try {
            // سڕینەوەی گۆڕینی پێچەوانە
            $reverse = UnitConversion::where('from_unit_id', $conversion->to_unit_id)
                ->where('to_unit_id', $conversion->from_unit_id)
                ->first();

            if ($reverse) {
                $reverse->delete();
            }

            $conversion->delete();

            return back()->with('success', 'گۆڕین سڕایەوە');

        } catch (\Exception $e) {
            return back()->with('error', 'هەڵەیەک ڕوویدا');
        }
    }

    public function convert(Request $request)
    {
        $request->validate([
            'from_unit_id' => 'required|exists:units,id',
            'to_unit_id' => 'required|exists:units,id',
            'amount' => 'required|numeric|min:0',
        ]);

        $fromUnit = Unit::find($request->from_unit_id);
        $result = $fromUnit->convertTo($request->amount, $request->to_unit_id);

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'گۆڕین بۆ ئەم یەکەیە بوونی نییە',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'result' => $result,
            'from_unit' => $fromUnit->name,
            'to_unit' => Unit::find($request->to_unit_id)->name,
        ]);
    }
}
