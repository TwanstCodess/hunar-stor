<?php
// database/migrations/2024_01_01_000008_create_payments_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // پەیوەندی لەگەڵ کڕیار
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('cascade');

            // زیادکردنی پەیوەندی لەگەڵ دابینکەر
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('cascade');

            // پەیوەندی لەگەڵ فرۆشتن
            $table->foreignId('sale_id')->nullable()->constrained();

            // پەیوەندی لەگەڵ کڕین
            $table->foreignId('purchase_id')->nullable()->constrained();

            // بەکارهێنەر
            $table->foreignId('user_id')->constrained();

            // زانیاری پارەدان
            $table->enum('currency', ['IQD', 'USD']);
            $table->enum('payment_method', ['cash', 'pos', 'transfer', 'cheque', 'other'])->default('cash');
            $table->enum('type', ['customer', 'supplier'])->default('customer');
            $table->float('amount', 15, 2);
            $table->text('notes')->nullable();

            // کاتی پارەدان
            $table->timestamp('payment_date');

            // ژمارەی پەیوەندیدار
            $table->string('reference_number')->nullable();
            $table->string('invoice_number')->nullable();

            // زانیاری بانک بۆ گواستنەوە
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('transaction_id')->nullable();

            // دۆخی پارەدان
            $table->enum('status', ['completed', 'pending', 'cancelled', 'refunded'])->default('completed');

            // فایلە پەیوەندیدارەکان
            $table->string('attachment')->nullable();

            // کاتەکان
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['type', 'payment_date']);
            $table->index(['customer_id', 'payment_date']);
            $table->index(['supplier_id', 'payment_date']);
            $table->index(['payment_method', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
