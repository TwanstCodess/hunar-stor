<?php
// database/migrations/2024_01_01_000009_create_expenses_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('currency', ['IQD', 'USD'])->default('IQD');
            $table->float('amount', 15, 2);
            $table->date('expense_date');
            $table->timestamps();

            // ئیندێکسەکان بۆ گەڕان و فلتەرکردنی خێراتر
            $table->index('currency');
            $table->index('expense_date');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
