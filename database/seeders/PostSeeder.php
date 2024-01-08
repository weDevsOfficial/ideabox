<?php

namespace Database\Seeders;

use Faker\Factory as FakerFactory;
use App\Models\Post;
use App\Models\Board;
use App\Models\Status;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $boards = Board::all();

        foreach ($boards as $board) {
            Post::factory(10)->create([
                'board_id' => $board->id,
                'status_id' => Status::inRandomOrder()->first()->id,
                'created_by' => User::inRandomOrder()->first()->id,
            ]);
        }
    }
}
