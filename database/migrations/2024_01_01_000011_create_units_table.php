<?php
// database/migrations/2024_01_01_000011_create_units_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // تێبڵی یەکەکان
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('symbol')->nullable();
            $table->enum('type', ['base', 'packed'])->default('base');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // تێبڵی کۆنڤێرشنەکان
        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_unit_id')->constrained('units')->onDelete('cascade');
            $table->foreignId('to_unit_id')->constrained('units')->onDelete('cascade');
            $table->float('conversion_factor', 15, 6);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['from_unit_id', 'to_unit_id']);
        });

        // زیادکردنی کۆڵۆمەکانی یەکە بۆ بەرهەمەکان
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('base_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->foreignId('purchase_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->foreignId('sale_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->float('purchase_to_base_factor', 15, 6)->default(1);
            $table->float('sale_to_base_factor', 15, 6)->default(1);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['base_unit_id']);
            $table->dropForeign(['purchase_unit_id']);
            $table->dropForeign(['sale_unit_id']);
            $table->dropColumn([
                'base_unit_id',
                'purchase_unit_id',
                'sale_unit_id',
                'purchase_to_base_factor',
                'sale_to_base_factor'
            ]);
        });

        Schema::dropIfExists('unit_conversions');
        Schema::dropIfExists('units');
    }
};
