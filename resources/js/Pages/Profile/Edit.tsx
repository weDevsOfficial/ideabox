import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import FrontendLayout from '@/Layouts/FrontendLayout';
import UpdateEmailPreference from './Partials/UpdateEmailPreference';

export interface EmailPreference {
  comments: boolean;
  status_updates: boolean;
}

type Props = {
  mustVerifyEmail: boolean;
  email_preference: EmailPreference;
  status?: string;
};

export default function Edit({
  email_preference,
  mustVerifyEmail,
  status,
}: PageProps<Props>) {
  return (
    <FrontendLayout>
      <Head title="Profile" />

      <h2 className="mb-8 text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
        Update Profile
      </h2>

      <div className="space-y-6">
        <div className="border border-gray-200 bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:border-gray-700 dark:bg-gray-800">
          <UpdateProfileInformationForm
            mustVerifyEmail={mustVerifyEmail}
            status={status}
          />
        </div>

        <div className="border border-gray-200 bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:border-gray-700 dark:bg-gray-800">
          <UpdateEmailPreference preference={email_preference} />
        </div>

        <div className="border border-gray-200 bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:border-gray-700 dark:bg-gray-800">
          <UpdatePasswordForm />
        </div>

        <div className="border border-red-500 bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:border-red-600 dark:bg-gray-800">
          <DeleteUserForm />
        </div>
      </div>
    </FrontendLayout>
  );
}
