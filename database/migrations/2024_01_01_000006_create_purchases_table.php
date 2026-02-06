<?php
// database/migrations/2024_01_01_000006_create_purchases_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->string('invoice_number')->unique();
            $table->enum('purchase_type', ['cash', 'credit']);
            $table->enum('currency', ['IQD', 'USD']);
            $table->enum('payment_method', ['cash', 'pos', 'transfer'])->nullable();
            $table->float('total_amount', 15, 2);
            $table->float('paid_amount', 15, 2)->default(0);
            $table->float('remaining_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('purchase_date');
            $table->timestamps();
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->float('quantity', 15, 3);
            $table->float('unit_price', 15, 2);
            $table->float('selling_price', 15, 2);
            $table->float('total_price', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
