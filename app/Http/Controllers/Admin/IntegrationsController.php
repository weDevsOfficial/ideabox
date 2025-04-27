<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IntegrationProvider;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IntegrationsController extends Controller
{
    /**
     * Display the integrations index page.
     */
    public function index()
    {
        // Count active integrations by type
        $githubCount = IntegrationProvider::where('type', 'github')
            ->whereNotNull('access_token')
            ->count();

        return Inertia::render('Admin/Integrations/Index', [
            'active_integrations' => [
                'github' => $githubCount,
                // Add more integrations as they become available
            ]
        ]);
    }
}
