<?php
// database/migrations/xxxx_xx_xx_xxxxxx_add_advance_application_to_payment_method_enum.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ئەم SQLـە بە ڕاستەوخۆ Enumـەکە دەگۆڕێت
        DB::statement("ALTER TABLE payments
                       MODIFY COLUMN payment_method
                       ENUM('cash', 'pos', 'transfer', 'cheque', 'other', 'advance_application')
                       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                       NOT NULL DEFAULT 'cash'");
    }

    public function down(): void
    {
        // گەڕانەوە بۆ Enumی کۆن
        DB::statement("ALTER TABLE payments
                       MODIFY COLUMN payment_method
                       ENUM('cash', 'pos', 'transfer', 'cheque', 'other')
                       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                       NOT NULL DEFAULT 'cash'");
    }
};
