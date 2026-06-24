<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Freemius\FreemiusService;
use App\Services\Freemius\PremiumFeature;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePremium
{
    public function __construct(private readonly FreemiusService $freemius)
    {
    }

    /**
     * Block access to a premium feature unless the install holds an active
     * Freemius license (or SaaS mode is disabled).
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if ($this->freemius->canUse($feature)) {
            return $next($request);
        }

        $label = PremiumFeature::all()[$feature]['label'] ?? 'This feature';
        $message = "{$label} is a premium feature. Please upgrade to unlock it.";

        if ($request->expectsJson()) {
            abort(403, $message);
        }

        return redirect()
            ->route('admin.billing.index')
            ->with('error', $message);
    }
}
