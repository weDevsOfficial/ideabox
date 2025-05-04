<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Status;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Status>
 */
class StatusFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Status::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Under Review', 'Planned', 'In Progress', 'Complete', 'Closed']),
            'color' => fake()->hexColor(),
            'in_roadmap' => fake()->boolean(),
            'in_frontend' => fake()->boolean(),
            'order' => fake()->numberBetween(1, 100),
        ];
    }

    /**
     * Indicate that the status is visible in roadmap.
     */
    public function inRoadmap(): static
    {
        return $this->state(fn (array $attributes) => [
            'in_roadmap' => true,
        ]);
    }

    /**
     * Indicate that the status is visible in frontend.
     */
    public function inFrontend(): static
    {
        return $this->state(fn (array $attributes) => [
            'in_frontend' => true,
        ]);
    }
}
