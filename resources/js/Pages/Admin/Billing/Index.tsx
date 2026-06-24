import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button, Notice } from '@wedevs/tail-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';

const CHECKOUT_SCRIPT = 'https://checkout.freemius.com/checkout.min.js';

interface CheckoutConfig {
  enabled: boolean;
  configured: boolean;
  product_id: string | null;
  public_key: string | null;
  plan_id: string | null;
}

interface Feature {
  key: string;
  label: string;
  description: string;
}

interface LicenseInfo {
  plan_title: string | null;
  plan_id: string | null;
  status: string;
  expiration: string | null;
}

interface Props extends PageProps {
  checkout: CheckoutConfig;
  saasEnabled: boolean;
  hasActiveLicense: boolean;
  features: Feature[];
  license: LicenseInfo | null;
}

export default function BillingIndex({
  checkout,
  saasEnabled,
  hasActiveLicense,
  features,
  license,
}: Props) {
  const { appName } = usePage<PageProps>().props;
  const [scriptReady, setScriptReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const handlerRef = useRef<any>(null);

  // Lazy-load the Freemius checkout widget once we know it's needed.
  useEffect(() => {
    if (!checkout.configured) {
      return;
    }

    if ((window as any).FS) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${CHECKOUT_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, [checkout.configured]);

  const openCheckout = () => {
    const FS = (window as any).FS;
    if (!FS || !checkout.product_id || !checkout.public_key) {
      return;
    }

    if (!handlerRef.current) {
      handlerRef.current = FS.Checkout.configure({
        plugin_id: checkout.product_id,
        public_key: checkout.public_key,
      });
    }

    handlerRef.current.open({
      name: appName,
      plan_id: checkout.plan_id || undefined,
      licenses: 1,
      purchaseCompleted: (response: any) => {
        setProcessing(true);
        router.post(
          route('admin.billing.activate'),
          { purchase: response },
          {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
          },
        );
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-100">
          Billing
        </h2>
      }
    >
      <Head title="Billing" />

      <div className="space-y-6">
        {/* Current plan status */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {hasActiveLicense ? 'Premium' : 'Free'} Plan
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {hasActiveLicense
                    ? `You have an active ${license?.plan_title ?? 'premium'} license. All premium features are unlocked.`
                    : saasEnabled
                      ? 'Upgrade to unlock premium features for your workspace.'
                      : 'SaaS mode is disabled — every feature is currently unlocked for free.'}
                </p>
              </div>
              {hasActiveLicense ? (
                <span className="rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                  Active
                </span>
              ) : (
                <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Free
                </span>
              )}
            </div>

            {hasActiveLicense && license?.expiration && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Renews / expires on{' '}
                {new Date(license.expiration).toLocaleDateString()}.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-6">
            {!saasEnabled && (
              <Notice
                type="info"
                className="flex-1"
                label={
                  <>
                    Enable SaaS Mode and add your Freemius credentials under{' '}
                    <Link
                      href={route('admin.settings.index', {
                        group: 'billing',
                      })}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Settings → Billing
                    </Link>{' '}
                    to start selling premium access.
                  </>
                }
              />
            )}

            {saasEnabled && !checkout.configured && (
              <Notice
                type="warning"
                className="flex-1"
                label={
                  <>
                    Add your Freemius Product ID and Public Key under{' '}
                    <Link
                      href={route('admin.settings.index', {
                        group: 'billing',
                      })}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Settings → Billing
                    </Link>
                    .
                  </>
                }
              />
            )}

            {saasEnabled && checkout.configured && !hasActiveLicense && (
              <Button
                variant="primary"
                onClick={openCheckout}
                loading={processing}
                disabled={!scriptReady}
              >
                {scriptReady ? 'Upgrade to Premium' : 'Loading checkout…'}
              </Button>
            )}
          </div>
        </div>

        {/* Premium feature list */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Premium Features
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              These features require an active license when SaaS mode is
              enabled.
            </p>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {features.map((feature) => {
              const unlocked = !saasEnabled || hasActiveLicense;
              return (
                <li
                  key={feature.key}
                  className="flex items-center gap-4 p-6"
                >
                  <span
                    className={
                      unlocked
                        ? 'rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900 dark:text-green-300'
                        : 'rounded-full bg-gray-100 p-2 text-gray-400 dark:bg-gray-700'
                    }
                  >
                    {unlocked ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <LockClosedIcon className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {feature.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
