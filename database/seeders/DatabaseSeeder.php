<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // دروستکردنی Admin ـی سەرەتایی
        User::create([
            'name' => 'Admin',
            'email' => 'admin@hunar.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
    }
}
