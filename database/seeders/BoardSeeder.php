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
            [
                'name' => 'Feature Requests',
                'slug' => 'feature-requests',
                'order' => 1,
                'privacy' => 'public',
                'allow_posts' => true,
                'settings' => [
                    'form' => [
                        'heading' => 'Suggest a feature',
                        'description' => 'What would you like to see in the future?',
                        'fields' => [
                            'title' => [
                                'label' => 'Feature title',
                                'placeholder' => 'Enter a short title',
                            ],
                            'details' => [
                                'label' => 'Details',
                                'placeholder' => 'Enter a detailed description of the feature',
                            ],
                        ],
                        'button' => 'Submit Request',
                    ]
                ]
            ],
        ];

        foreach ($boards as $board) {
            try {
                Board::create($board);
            } catch (\Throwable $th) {}
        }
    }
}
