<?php

namespace Database\Seeders;

use App\Models\Board;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class BoardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $boards = [
            ['name' => 'Feature Requests', 'slug' => 'feature-requests', 'order' => 1, 'privacy' => 'public'],
            ['name' => 'Integrations', 'slug' => 'integrations', 'order' => 2, 'privacy' => 'public'],
        ];

        foreach ($boards as $board) {
            try {
                Board::create($board);
            } catch (\Throwable $th) {}
        }
    }
}
