<?php
// database/migrations/xxxx_create_balances_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->decimal('amount', 14, 2);

            $table->enum('currency', ['IQD', 'USD']);

            $table->string('note')->nullable();

            $table->decimal('before_balance', 14, 2)->default(0);
            $table->decimal('after_balance', 14, 2)->default(0);

            $table->enum('type', ['add', 'subtract'])->default('add');

            $table->timestamps();

            $table->index(['customer_id', 'currency', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balances');
    }
};
