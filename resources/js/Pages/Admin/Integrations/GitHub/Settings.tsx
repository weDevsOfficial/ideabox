import React, { useState } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import { Button } from '@wedevs/tail-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConnectedAccountsList from './components/AccountsList';
import ConnectAccountModal from './components/ConnectAccountModal';
import AddRepositoryModal from './components/AddRepositoryModal';
import RepositoriesList from './components/RepositoriesList';
import { Provider } from '@/types';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url?: string;
  description?: string;
  integration_provider_id: number;
  provider?: {
    id: number;
    name: string;
  };
}

interface PageProps {
  type: string;
  providers: Provider[];
  repositories: Repository[];
  callbackUrl: string;
  flash?: {
    success?: string;
    error?: string;
    info?: string;
  };
}

export default function GithubSettings({
  providers,
  repositories,
  callbackUrl,
}: PageProps) {
  // Modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);

  // Get flash messages from page props
  const { flash } = usePage().props as any;

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight flex items-center gap-2">
            <Link
              href={route('admin.integrations.index')}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Integrations
            </Link>
            <span className="text-gray-500 dark:text-gray-400">/</span>
            <span className="text-gray-800 dark:text-gray-200">GitHub</span>
          </h2>
        </div>
      }
    >
      <Head title="GitHub Integration" />

      {/* Flash Messages */}
      {flash?.info && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
          {flash.info}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg">
        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              GitHub Integration
            </h1>

            <Button onClick={() => setIsConnectModalOpen(true)}>
              Add New Account
            </Button>
          </div>

          {/* GitHub accounts list */}
          <ConnectedAccountsList providers={providers} />

          {/* Modals */}
          <ConnectAccountModal
            callbackUrl={callbackUrl}
            isOpen={isConnectModalOpen}
            onClose={() => {
              setIsConnectModalOpen(false);
            }}
          />

          <AddRepositoryModal
            isOpen={isAddRepoModalOpen}
            onClose={() => setIsAddRepoModalOpen(false)}
            providers={providers}
          />
        </div>
      </div>

      {providers.some((p) => p.is_connected) && (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg mt-8">
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Repositories
              </h2>

              <Button onClick={() => setIsAddRepoModalOpen(true)}>
                Add Repository
              </Button>
            </div>

            <RepositoriesList
              repositories={repositories}
              providers={providers}
              onAddRepository={() => setIsAddRepoModalOpen(true)}
            />
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
