<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('negative_balance_iqd', 15, 2)->default(0)->after('balance_usd');
            $table->decimal('negative_balance_usd', 15, 2)->default(0)->after('negative_balance_iqd');
            $table->index(['negative_balance_iqd', 'negative_balance_usd']);
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['negative_balance_iqd', 'negative_balance_usd']);
        });
    }
};
