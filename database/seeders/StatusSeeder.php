<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['name' => 'Under Review', 'color' => '#85b5b5', 'order' => 0],
            ['name' => 'Planned', 'color' => '#1fa0ff', 'order' => 1, 'in_roadmap' => true],
            ['name' => 'In Progress', 'color' => '#c17aff', 'order' => 2, 'in_roadmap' => true],
            ['name' => 'Complete', 'color' => '#6cd345', 'order' => 3, 'in_roadmap' => true],
            ['name' => 'Closed', 'color' => '#ed2b2b', 'order' => 4, 'in_roadmap' => false],
        ];

        foreach ($statuses as $status) {
            try {
                Status::create($status);
            } catch (\Throwable $th) {
            }
        }
    }
}
