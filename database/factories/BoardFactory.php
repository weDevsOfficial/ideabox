<?php

namespace Database\Factories;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Board>
 */
class BoardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);
        
        return [
            'name'        => $name,
            'slug'        => Str::slug($name),
            'order'       => fake()->numberBetween(1, 10),
            'posts'       => 0,
            'privacy'     => 'public',
            'allow_posts' => true,
            'settings'    => [],
        ];
    }
}
