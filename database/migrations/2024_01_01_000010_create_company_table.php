<?php
// database/migrations/2024_01_01_000010_create_company_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('tax_number')->nullable();
            $table->text('invoice_footer')->nullable();
            $table->timestamps();
        });

        // لە بنەڕەتدا یەک ڕیز زیاد بکە
        \Illuminate\Support\Facades\DB::table('company')->insert([
            'name' => 'بەگلاس',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('company');
    }
};
