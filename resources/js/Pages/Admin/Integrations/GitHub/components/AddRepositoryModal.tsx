import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SelectInput,
  TextField,
} from '@wedevs/tail-react';
import debounce from 'lodash/debounce';
import { useForm } from '@inertiajs/react';
import { Provider } from '@/types';

interface Repository {
  id: number;
  name: string;
  full_name: string;
}

interface ImprovedAddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
}

export default function ImprovedAddRepositoryModal({
  isOpen,
  onClose,
  providers,
}: ImprovedAddRepositoryModalProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);

  // Initialize Inertia form
  const { data, setData, post, processing, reset, errors } = useForm({
    provider_id: '',
    name: '',
    full_name: '',
  });

  // Get connected providers only
  const connectedProviders = providers.filter(
    (provider) => provider.is_connected
  );

  // Set first provider as default when modal opens if not already selected
  useEffect(() => {
    if (isOpen && !selectedProviderId && connectedProviders.length > 0) {
      setSelectedProviderId(connectedProviders[0].id);
      setData('provider_id', connectedProviders[0].id.toString());
    }
  }, [isOpen, connectedProviders, selectedProviderId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setRepositories([]);
      setSelectedRepository(null);
      reset();
    }
  }, [isOpen]);

  const searchRepositories = useCallback(
    debounce(async (query: string, providerId: number | null) => {
      if (!providerId || query.trim().length < 2) {
        setRepositories([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.post(
          route('admin.integrations.github.search-repositories'),
          {
            provider_id: providerId,
            query: query,
          }
        );
        setRepositories(response.data.repositories || []);
      } catch (error) {
        console.error('Error searching repositories:', error);
        setRepositories([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleRepositorySelection = (repository: Repository) => {
    setSelectedRepository(repository);
    setSearchQuery(repository.full_name);

    // Set form data when repository is selected
    setData({
      provider_id: selectedProviderId!.toString(),
      name: repository.name,
      full_name: repository.full_name,
    });
  };

  const clearSelection = () => {
    setSelectedRepository(null);
    setSearchQuery('');
    reset();
  };

  const handleAddRepository = () => {
    if (!selectedRepository || !selectedProviderId) return;

    // Submit using Inertia
    post(route('admin.integrations.github.add-repository'), {
      onSuccess: () => {
        onClose();
      },
      onError: (errors) => {
        console.error('Error adding repository:', errors);

        // Check if we got already exists message
        if (errors.message && errors.message.includes('already exists')) {
          // If repo already exists, just close and refresh
          onClose();
        }
      },
    });
  };

  useEffect(() => {
    if (selectedProviderId) {
      searchRepositories(searchQuery, selectedProviderId);
    }
  }, [searchQuery, selectedProviderId, searchRepositories]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <h2 className="text-lg font-medium dark:text-white">
          Add GitHub Repository
        </h2>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <SelectInput
            label="GitHub Account"
            selectedKey={selectedProviderId?.toString() || ''}
            onChange={(selectedOption) => {
              const providerId = parseInt(selectedOption.value);
              setSelectedProviderId(providerId);
              setData('provider_id', providerId.toString());
              setSearchQuery('');
              setSelectedRepository(null);
            }}
            options={connectedProviders.map((provider) => ({
              value: provider.name,
              key: provider.id.toString(),
            }))}
          />

          {/* Repository Selection */}
          {selectedProviderId && (
            <div>
              {!selectedRepository ? (
                <div>
                  <TextField
                    label="Search repositories"
                    value={searchQuery}
                    onChange={(value: string) => setSearchQuery(value)}
                    placeholder="Type to search repositories..."
                  />

                  {loading ? (
                    <div className="py-4 text-center">
                      Loading repositories...
                    </div>
                  ) : repositories.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto mt-2 text-sm border rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {repositories.map((repo) => (
                          <li
                            key={repo.id}
                            onClick={() => handleRepositorySelection(repo)}
                            className="p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="font-medium">{repo.full_name}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : searchQuery.length > 0 ? (
                    <div className="py-4 text-center text-gray-500">
                      No repositories found
                    </div>
                  ) : null}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Repository
                  </label>
                  <div className="flex items-center justify-between p-3 border rounded-md text-sm">
                    <span className="font-medium">
                      {selectedRepository.full_name}
                    </span>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={clearSelection}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalActions>
        <Button
          onClick={handleAddRepository}
          disabled={!selectedRepository || !selectedProviderId || processing}
        >
          {processing ? 'Adding...' : 'Add Repository'}
        </Button>

        <Button variant="secondary" onClick={onClose} className="mr-2">
          Cancel
        </Button>
      </ModalActions>
    </Modal>
  );
}
