<?php
// database/migrations/xxxx_xx_xx_xxxxxx_add_advance_used_to_payments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('advance_used', 15, 2)->default(0)->after('debt_reduction');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('advance_used');
        });
    }
};
