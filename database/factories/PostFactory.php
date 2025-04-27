<?php

namespace Database\Factories;

use App\Models\Board;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence();
        
        return [
            'title'      => $title,
            'slug'       => Str::slug($title),
            'body'       => fake()->paragraph(),
            'vote'       => fake()->randomNumber(2),
            'comments'   => fake()->randomNumber(2),
            'board_id'   => function () {
                return Board::factory()->create()->id;
            },
            'created_by' => function () {
                return User::factory()->create()->id;
            },
        ];
    }
}
