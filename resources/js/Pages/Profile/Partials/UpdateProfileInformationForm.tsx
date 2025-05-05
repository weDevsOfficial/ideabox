import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { FormEventHandler } from 'react';
import { PageProps } from '@/types';
import { Button, TextField } from '@wedevs/tail-react';

export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
}: {
  mustVerifyEmail: boolean;
  status?: string;
}) {
  const user = usePage<PageProps>().props.auth.user;

  const { data, setData, patch, errors, processing, recentlySuccessful } =
    useForm({
      name: user?.name || '',
      email: user?.email || '',
    });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    patch(route('profile.update'));
  };

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <header className="md:col-span-1">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Profile Information
        </h2>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update your account's profile information and email address.
        </p>
      </header>

      <div className="md:col-span-1">
        <form onSubmit={submit} className="space-y-6">
          <TextField
            label="Name"
            value={data.name}
            onChange={(value) => setData('name', value)}
            error={errors.name}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={data.email}
            onChange={(value) => setData('email', value)}
            error={errors.email}
            required
          />

          {mustVerifyEmail && user?.email_verified_at === null && (
            <div>
              <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                Your email address is unverified.
                <Link
                  href={route('verification.send')}
                  method="post"
                  as="button"
                  className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                >
                  Click here to re-send the verification email.
                </Link>
              </p>

              {status === 'verification-link-sent' && (
                <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                  A new verification link has been sent to your email address.
                </div>
              )}
            </div>
          )}

          <div className="items-right flex items-center justify-end gap-4">
            <Transition
              show={recentlySuccessful}
              enter="transition ease-in-out"
              enterFrom="opacity-0"
              leave="transition ease-in-out"
              leaveTo="opacity-0"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
            </Transition>

            <Button type="submit" loading={processing} disabled={processing}>
              Update
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
