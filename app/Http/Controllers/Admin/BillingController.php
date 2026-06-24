<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\License;
use App\Services\Freemius\FreemiusService;
use App\Services\Freemius\PremiumFeature;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(private readonly FreemiusService $freemius)
    {
    }

    /**
     * Show the billing / upgrade page with the embedded checkout config.
     */
    public function index(): Response
    {
        $license = License::query()->active()->latest()->first();

        return Inertia::render('Admin/Billing/Index', [
            'checkout' => $this->freemius->checkoutConfig(),
            'saasEnabled' => $this->freemius->saasEnabled(),
            'hasActiveLicense' => $this->freemius->hasActiveLicense(),
            'features' => collect(PremiumFeature::all())
                ->map(fn ($meta, $key) => array_merge($meta, ['key' => $key]))
                ->values()
                ->all(),
            'license' => $license ? [
                'plan_title' => $license->plan_title,
                'plan_id' => $license->plan_id,
                'status' => $license->status,
                'expiration' => $license->expiration?->toIso8601String(),
            ] : null,
        ]);
    }

    /**
     * Record a purchase reported by the embedded Freemius checkout overlay.
     */
    public function activate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'purchase' => ['required', 'array'],
        ]);

        $license = $this->freemius->recordPurchase($validated['purchase']);

        if (! $license) {
            return back()->with('error', 'We could not read the purchase details. Please contact support.');
        }

        return redirect()
            ->route('admin.billing.index')
            ->with('success', 'Your purchase was recorded. Premium features are now unlocked.');
    }
}
