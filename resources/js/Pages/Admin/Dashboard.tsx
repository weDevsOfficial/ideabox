import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';

const Dashboard = ({ auth }: PageProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow sm:rounded-lg">
      <Head title="Dashboard" />

      <div className="p-6 text-gray-900 dark:text-gray-100">
        You're logged in!
      </div>
    </div>
  );
};

Dashboard.layout = (page: React.ReactNode) => (
  <AuthenticatedLayout
    children={page}
    header={
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        Dashboard
      </h2>
    }
  ></AuthenticatedLayout>
);

export default Dashboard;
