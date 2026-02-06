<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('excess_amount', 15, 2)->default(0)->after('amount');
            $table->decimal('debt_reduction', 15, 2)->default(0)->after('excess_amount');
            $table->index(['excess_amount', 'debt_reduction']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['excess_amount', 'debt_reduction']);
        });
    }
};
