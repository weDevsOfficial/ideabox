<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Setting;
use App\Facades\Settings;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class SettingController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index(Request $request): Response
    {
        $group = $request->query('group', 'general');
        $settings = Settings::getForAdmin($group);

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'groups' => Settings::getGroups(),
            'groupLabels' => Settings::getGroupLabels(),
            'currentGroup' => $group,
        ]);
    }

    /**
     * Update batch settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.id' => ['nullable', 'integer'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
        ]);

        $currentGroup = $request->query('group', 'general');

        foreach ($validated['settings'] as $setting) {
            // Get definition to determine type and group
            $definition = Setting::getDefinition($setting['key']);
            if (!$definition) {
                continue; // Skip if definition not found
            }

            Settings::set($setting['key'], $setting['value']);
        }

        // Clear settings cache
        Settings::clearCache();
        Settings::warmCache();

        return redirect()->route('admin.settings.index', ['group' => $currentGroup])
            ->with('success', 'Settings updated successfully.');
    }
}
