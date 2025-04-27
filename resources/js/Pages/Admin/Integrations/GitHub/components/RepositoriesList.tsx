import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button, Modal } from '@wedevs/tail-react';
import {
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

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

interface Provider {
  id: number;
  name: string;
  type: string;
  access_token?: string;
}

interface RepositoriesListProps {
  repositories: Repository[];
  providers: Provider[];
  onAddRepository: () => void;
}

export default function RepositoriesList({
  repositories,
  providers,
  onAddRepository,
}: RepositoriesListProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [repositoryToDelete, setRepositoryToDelete] =
    useState<Repository | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get provider name by ID
  function getProviderName(providerId: number) {
    const provider = providers.find((p) => p.id === providerId);
    return provider ? provider.name : 'Unknown Account';
  }

  // Handle repository delete click
  const handleDeleteClick = (repo: Repository) => {
    setRepositoryToDelete(repo);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm deletion
  const handleConfirmDelete = () => {
    if (repositoryToDelete) {
      setIsDeleting(true);

      router.delete(
        route(
          'admin.integrations.github.repositories.remove',
          repositoryToDelete.id
        ),
        {
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setRepositoryToDelete(null);
          },
          onFinish: () => {
            setIsDeleting(false);
          },
        }
      );
    }
  };

  // Handle cancel deletion
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRepositoryToDelete(null);
  };

  // Display empty state if no repositories
  if (!repositories || repositories.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 text-center rounded-lg mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          No repositories added yet. Add repositories to link issues and create
          new issues.
        </p>
        <Button onClick={onAddRepository}>Add Repository</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {repositories.length}{' '}
          {repositories.length === 1 ? 'repository' : 'repositories'} added
        </span>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
              {repositories.map((repo) => (
                <tr
                  key={repo.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {repo.full_name}
                    </div>
                    {repo.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                        {repo.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {repo.provider
                        ? repo.provider.name
                        : getProviderName(repo.integration_provider_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {repo.html_url && (
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="View on GitHub"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Remove Repository"
                        onClick={() => handleDeleteClick(repo)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete}>
        <div className="text-center p-5">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Remove Repository
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to remove{' '}
            <span className="font-semibold">
              {repositoryToDelete?.full_name}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="secondary"
            onClick={handleCancelDelete}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
