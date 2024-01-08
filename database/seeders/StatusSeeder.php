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
            ['name' => 'Under Review', 'color' => '#85b5b5'],
            ['name' => 'Planned', 'color' => '#1fa0ff'],
            ['name' => 'In Progress', 'color' => '#c17aff'],
            ['name' => 'Complete', 'color' => '#6cd345'],
            ['name' => 'Closed', 'color' => '#ed2b2b'],
        ];

        foreach ($statuses as $status) {
            try {
                Status::create($status);
            } catch (\Throwable $th) {

            }
        }
    }
}
