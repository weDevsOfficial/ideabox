# Freemius SaaS / Premium Gating

IdeaBox can run as a SaaS product where premium features are unlocked by
purchasing a [Freemius](https://freemius.com) license. Everything is
configured by the system admin from the admin panel — no `.env` changes or
code edits are required to go live.

## How it works

- **SaaS mode is opt-in.** While it is disabled, every feature is available
  for free (the standard open-source behaviour). Turning it on gates the
  premium features behind an active license.
- **Premium features** are defined in
  `App\Services\Freemius\PremiumFeature`. Out of the box these are:
  - `integrations` – GitHub and other external integrations.
  - `ai_assist` – AI-generated feature descriptions.
- A feature is **unlocked** when SaaS mode is off, **or** the install holds an
  active Freemius license.

## Admin setup

1. Create a Product in the [Freemius Developer Dashboard](https://dashboard.freemius.com)
   and add a paid Plan.
2. In IdeaBox, go to **Settings → Billing** and fill in:
   - **Enable SaaS Mode** – turn gating on.
   - **Freemius Product ID** – the Product (Plugin) ID.
   - **Freemius Public Key** – used to load the embedded checkout.
   - **Freemius Secret Key** – used to verify webhooks (keep private).
   - **Premium Plan ID** – the plan customers buy to unlock premium.
3. In Freemius, add a webhook pointing at:
   `https://your-domain.com/api/webhooks/freemius`

## Purchasing

The **Billing** page hosts an embedded Freemius Checkout overlay. When the
admin completes a purchase, the returned license is recorded and premium
features unlock immediately. The Freemius webhook is the authoritative source
of truth and keeps the license state in sync (renewals, cancellations,
expirations).

## Gating a new feature

1. Add a constant and an `all()` entry to `PremiumFeature`.
2. Protect routes with the `premium` middleware, e.g.
   `->middleware('premium:my_feature')`.
3. The feature's availability is shared with the frontend via the
   `premium.features` Inertia prop for conditional rendering.

## Webhook verification

Webhooks are authenticated with the product secret key. The raw request body
is hashed with HMAC-SHA256 and compared (timing-safe) against the
`X-Signature` header, exactly as described in the Freemius documentation.
