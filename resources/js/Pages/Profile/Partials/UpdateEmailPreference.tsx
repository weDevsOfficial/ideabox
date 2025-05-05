import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { FormEventHandler } from 'react';
import { Button, SwitchInput } from '@wedevs/tail-react';

import { EmailPreference } from '../Edit';

interface Props {
  preference: EmailPreference;
}

export default function UpdateEmailPreference({ preference }: Props) {
  const { data, setData, post, errors, processing, recentlySuccessful } =
    useForm({
      comments: preference.comments,
      status_updates: preference.status_updates,
    });

  console.log('data', data);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    post(route('profile.email-preferences'));
  };

  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <header className="md:col-span-1">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Email Preferences
        </h2>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update your account's email preferences and notification settings.
        </p>
      </header>

      <div className="md:col-span-1">
        <form onSubmit={submit} className="space-y-6">
          <SwitchInput
            label="Comments Notifications"
            help="Receive notifications for comments where you are subscribed"
            initialValue={data.comments}
            onChange={(value) => setData('comments', value)}
          />

          <SwitchInput
            label="Status Updates"
            help="Receive notifications for when feedback status changes"
            initialValue={data.status_updates}
            onChange={(value) => setData('status_updates', value)}
          />

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
