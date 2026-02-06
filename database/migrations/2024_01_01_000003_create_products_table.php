<?php
// database/migrations/2024_01_01_000003_create_products_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code')->unique();
            $table->string('barcode')->nullable()->unique();
            $table->enum('unit_type', ['piece', 'kg', 'meter', 'liter', 'box', 'carton', 'packet', 'bundle'])->default('piece');
            $table->string('unit_name')->nullable();

            // نرخەکان بۆ هەردوو دراو
            $table->float('purchase_price_iqd', 15, 2)->default(0);
            $table->float('purchase_price_usd', 15, 2)->default(0);
            $table->float('selling_price_iqd', 15, 2)->default(0);
            $table->float('selling_price_usd', 15, 2)->default(0);

            $table->float('quantity', 15, 3)->default(0);
            $table->float('min_stock_level', 15, 3)->default(20);
            $table->boolean('track_stock')->default(true);
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
