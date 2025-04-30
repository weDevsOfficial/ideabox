<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SettingController extends Controller
{
    public function __construct(
        private SettingService $settingService
    ) {
    }

    /**
     * Display the settings page.
     */
    public function index(Request $request): Response
    {
        $group = $request->query('group', 'general');

        // Get settings with full definitions for this group
        $settings = $this->settingService->getForAdmin($group);

        dd($this->settingService->getGroupLabels());

        // Format JSON values for frontend display
        foreach ($settings as &$setting) {
            if ($setting['type'] === 'json' && $setting['value']) {
                if (is_array($setting['value'])) {
                    // Pretty-print JSON with proper indentation for readability
                    $setting['value'] = json_encode($setting['value'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                }
            }
        }

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'groups' => $this->settingService->getGroups(),
            'groupLabels' => $this->settingService->getGroupLabels(),
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

        // Get the current group from the request
        $currentGroup = $request->query('group') ?? $request->header('Referer') ?
            parse_url($request->header('Referer'), PHP_URL_QUERY) : null;

        if ($currentGroup && strpos($currentGroup, 'group=') === 0) {
            $currentGroup = substr($currentGroup, 6); // Extract group name from 'group=name'
        }

        $group = $currentGroup ?? 'general';

        foreach ($validated['settings'] as $setting) {
            // Get definition to determine type and group
            $definition = $this->settingService->get($setting['key']);
            if (!$definition) {
                continue; // Skip if definition not found
            }

            // If no group was found in the request, use the one from settings
            if (!$currentGroup) {
                $group = $definition['group'] ?? 'general';
            }

            $type = $definition['type'] ?? 'string';

            // Handle JSON values
            if ($type === 'json' && !empty($setting['value'])) {
                try {
                    // Validate JSON
                    $jsonValue = json_decode($setting['value'], true, 512, JSON_THROW_ON_ERROR);
                    $this->settingService->set($setting['key'], $jsonValue);
                } catch (\JsonException $e) {
                    return redirect()->back()
                        ->withInput()
                        ->with('error', 'Invalid JSON format: ' . $e->getMessage());
                }
            } else {
                $this->settingService->set($setting['key'], $setting['value']);
            }
        }

        // Clear settings cache
        $this->settingService->clearCache();

        return redirect()->route('admin.settings.index', ['group' => $group])
            ->with('success', 'Settings updated successfully.');
    }
}
