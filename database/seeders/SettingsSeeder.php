<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Setting;
use App\Services\SettingDefinitions;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all setting definitions
        $allDefinitions = [];
        foreach (SettingDefinitions::all() as $group) {
            foreach ($group['settings'] as $key => $definition) {
                $allDefinitions[$key] = $definition;
            }
        }

        // Create or update settings in the database
        foreach ($allDefinitions as $key => $definition) {
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'type' => $definition['type'],
                    'value' => is_array($definition['default'])
                        ? json_encode($definition['default'])
                        : $definition['default'],
                ]
            );
        }
    }
}
