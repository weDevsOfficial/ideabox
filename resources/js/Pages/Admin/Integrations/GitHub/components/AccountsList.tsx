import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button, Modal } from '@wedevs/tail-react';
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Provider } from '@/types';

interface ConnectedAccountsListProps {
  providers: Provider[];
}

export default function ConnectedAccountsList({
  providers,
}: ConnectedAccountsListProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle account disconnect click
  const handleDisconnectClick = (provider: Provider) => {
    setProviderToDelete(provider);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm disconnect
  const handleConfirmDisconnect = () => {
    if (providerToDelete) {
      setIsDeleting(true);

      router.delete(
        route('admin.integrations.github.disconnect', providerToDelete.id),
        {
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setProviderToDelete(null);
          },
          onFinish: () => {
            setIsDeleting(false);
          },
        }
      );
    }
  };

  // Handle cancel disconnect
  const handleCancelDisconnect = () => {
    setIsDeleteModalOpen(false);
    setProviderToDelete(null);
  };

  // Get connection status
  const getConnectionStatus = (provider: Provider) => {
    if (provider.is_connected && provider.authenticated_at) {
      return {
        icon: <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />,
        text: 'Connected',
        textClass: 'text-gray-600 dark:text-gray-400',
      };
    } else if (!provider.is_connected && provider.authenticated_at === null) {
      return {
        icon: (
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
        ),
        text: 'Authorization Pending',
        textClass: 'text-yellow-600 dark:text-yellow-400',
      };
    } else {
      return {
        icon: <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />,
        text: 'Connection Error',
        textClass: 'text-red-600 dark:text-red-400',
      };
    }
  };

  if (providers.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 text-center rounded-lg mb-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No GitHub accounts configured. Click "Add New Account" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
        Connected Accounts
      </h2>
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {providers.map((provider) => {
              const status = getConnectionStatus(provider);

              return (
                <tr key={provider.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {provider.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {status.icon}
                      <span className={`text-sm ${status.textClass}`}>
                        {status.text}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      {!provider.is_connected && !provider.authenticated_at ? (
                        <button
                          onClick={() => handleDisconnectClick(provider)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisconnectClick(provider)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDisconnect}>
        <div className="text-center p-5">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Disconnect GitHub Account
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to disconnect{' '}
            <span className="font-semibold">{providerToDelete?.name}</span>?
            This will remove the integration and all associated repositories.
          </p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="secondary"
            onClick={handleCancelDisconnect}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDisconnect}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Disconnect
          </Button>
        </div>
      </Modal>
    </div>
  );
}
