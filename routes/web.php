<?php
// routes/web.php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DebtController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect root
Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : redirect()->route('login');
});

// Authentication
Route::middleware('guest')->group(function () {
    Route::get('/login', fn() => Inertia::render('Auth/Login'))->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Protected Routes
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Resources
    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::resource('units', UnitController::class);
    Route::get('/units/create', [UnitController::class, 'create'])->name('units.create');

    // Quick product addition in sales
    Route::post('sales/add-product', [SaleController::class, 'addProductInSale'])
        ->name('sales.add-product');

    Route::post('sales-quick-add-product', [SaleController::class, 'addProductInSale'])
        ->name('sales.add-product-quick');

        // لە گرووپی customers زیاد بکە:
Route::post('/customers/{customer}/add-advance', [CustomerController::class, 'addAdvance'])
    ->name('customers.add-advance')
    ->middleware('auth');

Route::post('/customers/{customer}/edit-balance', [CustomerController::class, 'editBalance'])
    ->name('customers.edit-balance')
    ->middleware('auth');
    // Customers with advanced features
    Route::resource('customers', CustomerController::class);

    // Customer debt statements
    Route::get('customers/{customer}/debt-statement', [CustomerController::class, 'debtStatement'])
        ->name('customers.debt-statement');

    Route::get('customers/{customer}/debt-statement/print', [CustomerController::class, 'debtStatementPrint'])
        ->name('customers.debt-statement.print');

    Route::get('customers/{customer}/debt-statement/printInvoice', [CustomerController::class, 'debtStatementPrint2']);

    // Customer reports
    Route::get('customers-report', [CustomerController::class, 'report'])
        ->name('customers.report');

        Route::get('customers/{customer}/all-sales', [CustomerController::class, 'allSales'])
    ->name('customers.all-sales');

Route::get('customers/{customer}/all-sales/print', [CustomerController::class, 'allSalesPrint'])
    ->name('customers.all-sales.print');

    // Advance payment management
    Route::post('/customers/{customer}/apply-advance', [CustomerController::class, 'applyAdvanceToDebt'])
        ->name('customers.apply-advance')
        ->middleware('auth');

    Route::get('/customers/{customer}/advance-preview', [CustomerController::class, 'advancePreview'])
        ->name('customers.advance-preview')
        ->middleware('auth');

    // Suppliers
    Route::resource('suppliers', SupplierController::class);
    Route::get('suppliers/{supplier}/debt-statement', [SupplierController::class, 'debtStatement'])
        ->name('suppliers.debt-statement');

    // Sales with bulk operations
    Route::resource('sales', SaleController::class);
    Route::post('/sales/bulk-delete', [SaleController::class, 'bulkDelete'])->name('sales.bulk-delete');
    Route::get('/sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print');

    // Add payment to sale
    Route::post('/sales/{sale}/add-payment', [SaleController::class, 'addPayment'])
        ->name('sales.add-payment');

    // Purchases
    Route::resource('purchases', PurchaseController::class);

    // Payments with advanced features
    Route::resource('payments', PaymentController::class);
    Route::get('/payments/{payment}/print', [PaymentController::class, 'print'])
        ->name('payments.print');
    Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');

    // Debt management
    Route::prefix('debts')->name('debts.')->group(function () {
        Route::get('/', [DebtController::class, 'index'])->name('index');
        Route::get('/customers/{customer}', [DebtController::class, 'customerDetail'])->name('customers.show');
        Route::get('/suppliers/{supplier}', [DebtController::class, 'supplierDetail'])->name('suppliers.show');

        // Advance debt management
        Route::get('/advance-payments', [DebtController::class, 'advancePayments'])->name('advance-payments');
        Route::get('/excess-payments', [DebtController::class, 'excessPayments'])->name('excess-payments');
    });

    // Expenses
    Route::resource('expenses', ExpenseController::class)->except(['show']);

    // Specific routes for sale completion/cancellation
    Route::post('/sales/{sale}/complete', [SaleController::class, 'complete'])->name('sales.complete');
    Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel'])->name('sales.cancel');

    // Purchase specific routes
    Route::post('/purchases/{purchase}/complete', [PurchaseController::class, 'complete'])->name('purchases.complete');
    Route::post('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->name('purchases.cancel');
    Route::post('/purchases/{purchase}/payments', [PurchaseController::class, 'addPayment'])
        ->name('purchases.payments.store');

    Route::get('/purchases/{purchase}/print', [PurchaseController::class, 'print'])
        ->name('purchases.print');

    // Unit Conversions
    Route::get('/units/{unit}/conversions', [UnitController::class, 'conversions'])->name('units.conversions');
    Route::post('/units/{unit}/conversions', [UnitController::class, 'storeConversion'])->name('units.conversions.store');
    Route::delete('/unit-conversions/{conversion}', [UnitController::class, 'destroyConversion'])->name('unit-conversions.destroy');

    // Reports with advance payment reporting
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/sales', [ReportController::class, 'sales'])->name('sales');
        Route::get('/purchases', [ReportController::class, 'purchases'])->name('purchases');
        Route::get('/debts', [ReportController::class, 'debts'])->name('debts');
        Route::get('/advance-payments', [ReportController::class, 'advancePayments'])->name('advance-payments');
        Route::get('/excess-payments', [ReportController::class, 'excessPayments'])->name('excess-payments');
        Route::get('/statement', [ReportController::class, 'statement'])->name('statement');
        Route::get('/expenses', [ReportController::class, 'expenses'])->name('expenses');
        Route::get('/profit-loss', [ReportController::class, 'profitLoss'])->name('profit-loss');
        Route::get('/inventory', [ReportController::class, 'inventory'])->name('inventory');
        Route::get('/general', [ReportController::class, 'general'])->name('general');

        // بۆ سەرمایەکان
Route::get('/advances', [DebtController::class, 'advanceIndex'])->name('advances.index');

// وردەکاری قەرز/سەرمایەی کڕیار
Route::get('/debts/customers/{customer}', [DebtController::class, 'customerDetail'])->name('debts.customer.detail');

// چاپکردنی بارنامە
Route::get('/debts/customers/{customer}/print', [DebtController::class, 'printStatement'])->name('debts.print');
        // PDF Export with advance payment reports
        Route::get('/export-pdf/sales', [ReportController::class, 'exportPdf'])->name('export.pdf.sales');
        Route::get('/export-pdf/purchases', [ReportController::class, 'exportPdf'])->name('export.pdf.purchases');
        Route::get('/export-pdf/debts', [ReportController::class, 'exportPdf'])->name('export.pdf.debts');
        Route::get('/export-pdf/advance-payments', [ReportController::class, 'exportPdf'])->name('export.pdf.advance-payments');
        Route::get('/export-pdf/excess-payments', [ReportController::class, 'exportPdf'])->name('export.pdf.excess-payments');
        Route::get('/export-pdf/expenses', [ReportController::class, 'exportPdf'])->name('export.pdf.expenses');
        Route::get('/export-pdf/profit-loss', [ReportController::class, 'exportPdf'])->name('export.pdf.profit-loss');
        Route::get('/export-pdf/inventory', [ReportController::class, 'exportPdf'])->name('export.pdf.inventory');
        Route::get('/export-pdf/customer-statement', [ReportController::class, 'exportPdf'])->name('export.pdf.customer-statement');
        Route::get('/export-pdf/general', [ReportController::class, 'exportPdf'])->name('export.pdf.general');
        Route::get('/export-pdf/{report}', [ReportController::class, 'exportPdf'])->name('export.pdf');
    });

    // Charts and Statistics with advance payment data
    Route::prefix('charts')->name('charts.')->group(function () {
        Route::get('/sales-daily', [DashboardController::class, 'salesDaily'])->name('sales.daily');
        Route::get('/sales-monthly', [DashboardController::class, 'salesMonthly'])->name('sales.monthly');
        Route::get('/top-products', [DashboardController::class, 'topProducts'])->name('top.products');
        Route::get('/expenses-by-type', [DashboardController::class, 'expensesByType'])->name('expenses.by.type');
        Route::get('/advance-payments', [DashboardController::class, 'advancePayments'])->name('advance.payments');
        Route::get('/debt-analysis', [DashboardController::class, 'debtAnalysis'])->name('debt.analysis');
    });

    // Profile management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');

    // Admin Routes
    Route::middleware('admin')->group(function () {
        Route::resource('users', UserController::class);
        Route::get('/settings', [UserController::class, 'settings'])->name('settings');
        Route::post('/settings', [UserController::class, 'updateSettings'])->name('settings.update');

        // Backup and Restore
        Route::get('/backup', [UserController::class, 'backup'])->name('backup');
        Route::post('/backup/create', [UserController::class, 'createBackup'])->name('backup.create');
        Route::post('/backup/restore', [UserController::class, 'restoreBackup'])->name('backup.restore');

        // System statistics
        Route::get('/system-stats', [DashboardController::class, 'systemStats'])->name('system.stats');
    });

    // API endpoints for AJAX requests
    Route::prefix('api')->name('api.')->group(function () {
        // Customer advance balance
        Route::get('/customers/{customer}/advance-balance', [CustomerController::class, 'getAdvanceBalance'])
            ->name('customers.advance-balance');

        // Payment validation
        Route::post('/payments/validate', [PaymentController::class, 'validatePayment'])
            ->name('payments.validate');

        // Sale advance application
        Route::post('/sales/{sale}/apply-advance', [SaleController::class, 'applyAdvanceToSale'])
            ->name('sales.apply-advance');
    });
});
