<?php
// app/Http/Controllers/ExpenseController.php
namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Expense::with('user:id,name');

        // فلتەرەکان
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('currency')) {
            $query->currency($request->currency);
        }

        if ($request->filled('from_date') || $request->filled('to_date')) {
            $query->dateRange($request->from_date, $request->to_date);
        }

        $expenses = $query->latest('expense_date')
                         ->latest('id')
                         ->paginate(15)
                         ->withQueryString();

        // ئاماری خەرجی
        $stats = [
            'total_iqd' => Expense::where('currency', 'IQD')->sum('amount'),
            'total_usd' => Expense::where('currency', 'USD')->sum('amount'),
            'today_iqd' => Expense::today()->where('currency', 'IQD')->sum('amount'),
            'today_usd' => Expense::today()->where('currency', 'USD')->sum('amount'),
            'month_iqd' => Expense::thisMonth()->where('currency', 'IQD')->sum('amount'),
            'month_usd' => Expense::thisMonth()->where('currency', 'USD')->sum('amount'),
            'count' => Expense::count(),
        ];

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'currency' => $request->currency,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Expenses/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'currency' => 'required|in:IQD,USD',
            'amount' => 'required|numeric|min:0.01|max:999999999999.99',
            'expense_date' => 'nullable|date|before_or_equal:today',
        ], [
            'title.required' => 'ناونیشانی خەرجی پێویستە',
            'title.max' => 'ناونیشان زۆر درێژە',
            'description.max' => 'وەسف زۆر درێژە',
            'currency.required' => 'جۆری دراو پێویستە',
            'currency.in' => 'جۆری دراو هەڵەیە',
            'amount.required' => 'بڕی پارە پێویستە',
            'amount.numeric' => 'بڕی پارە دەبێتژمارە بێت',
            'amount.min' => 'بڕی پارە دەبێت لە ٠.٠١ زیاتر بێت',
            'amount.max' => 'بڕی پارە زۆر گەورەیە',
            'expense_date.date' => 'بەرواری خەرجی هەڵەیە',
            'expense_date.before_or_equal' => 'بەرواری خەرجی ناتوانێت لە ئەمڕۆ دواتر بێت',
        ]);

        Expense::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'currency' => $validated['currency'],
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'] ?? today(),
        ]);

        return redirect()->route('expenses.index')
            ->with('success', 'خەرجی بە سەرکەوتوویی زیادکرا');
    }

    public function edit(Expense $expense): Response
    {
        return Inertia::render('Expenses/Edit', [
            'expense' => $expense->load('user:id,name'),
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'currency' => 'required|in:IQD,USD',
            'amount' => 'required|numeric|min:0.01|max:999999999999.99',
            'expense_date' => 'nullable|date|before_or_equal:today',
        ], [
            'title.required' => 'ناونیشانی خەرجی پێویستە',
            'amount.required' => 'بڕی پارە پێویستە',
            'amount.min' => 'بڕی پارە دەبێت لە ٠.٠١ زیاتر بێت',
            'expense_date.before_or_equal' => 'بەرواری خەرجی ناتوانێت لە ئەمڕۆ دواتر بێت',
        ]);

        $expense->update($validated);

        return redirect()->route('expenses.index')
            ->with('success', 'خەرجی بە سەرکەوتوویی نوێکرایەوە');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return redirect()->route('expenses.index')
            ->with('success', 'خەرجی بە سەرکەوتوویی سڕایەوە');
    }
}
