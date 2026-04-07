<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        if ($user->name !== 'Admin User' || $user->role !== 'admin') {
            $user->forceFill([
                'name' => 'Admin User',
                'role' => 'admin',
            ])->save();
        }

        $this->call([
            StatusSeeder::class,
            BoardSeeder::class,
            // PostSeeder::class,
            SettingsSeeder::class,
        ]);
    }
}
