import { useRef, FormEventHandler } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { Button, TextField } from '@wedevs/tail-react';

export default function UpdatePasswordForm() {
  const passwordInput = useRef<HTMLInputElement>();
  const currentPasswordInput = useRef<HTMLInputElement>();

  const { data, setData, errors, put, reset, processing, recentlySuccessful } =
    useForm({
      current_password: '',
      password: '',
      password_confirmation: '',
    });

  const updatePassword: FormEventHandler = (e) => {
    e.preventDefault();

    put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors) => {
        if (errors.password) {
          reset('password', 'password_confirmation');
          passwordInput.current?.focus();
        }

        if (errors.current_password) {
          reset('current_password');
          currentPasswordInput.current?.focus();
        }
      },
    });
  };

  return (
    <section className={`grid grid-cols-1 gap-8 md:grid-cols-2`}>
      <header className="md:col-span-1">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Update Password
        </h2>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </header>

      <div className="md:col-span-1">
        <form onSubmit={updatePassword} className="space-y-6">
          <TextField
            label="Current Password"
            type="password"
            value={data.current_password}
            onChange={(value) => setData('current_password', value)}
            error={errors.current_password}
            autoComplete="current-password"
            required
          />

          <TextField
            label="New Password"
            type="password"
            value={data.password}
            onChange={(value) => setData('password', value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={data.password_confirmation}
            onChange={(value) => setData('password_confirmation', value)}
            error={errors.password_confirmation}
            autoComplete="new-password"
            required
          />

          <div className="flex items-center justify-end gap-4">
            <Transition
              show={recentlySuccessful}
              enter="transition ease-in-out"
              enterFrom="opacity-0"
              leave="transition ease-in-out"
              leaveTo="opacity-0"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
            </Transition>

            <Button type="submit" disabled={processing} loading={processing}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
