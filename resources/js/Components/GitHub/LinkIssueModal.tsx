import { Button } from '@wedevs/tail-react';
import { PostType, IntegrationRepository } from '@/types';
import {
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SelectInput,
} from '@wedevs/tail-react';
import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import classNames from 'classnames';

type Props = {
  post: PostType;
  repositories: IntegrationRepository[];
  isOpen: boolean;
  closeModal: () => void;
};

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
}

const LinkIssueModal = ({ post, repositories, isOpen, closeModal }: Props) => {
  const [selectedRepository, setSelectedRepository] =
    useState<IntegrationRepository | null>(repositories[0]);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [query, setQuery] = useState('');

  const form = useForm({
    repository_id: repositories[0].id.toString(),
    integration_provider_id: repositories[0].integration_provider_id,
    external_id: '',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRepository || !selectedIssue) return;

    form.post(route('admin.integrations.github.link-issue', { post }), {
      onSuccess: () => {
        closeModal();
      },
    });
  };

  const handleRepositorySelect = (option: { key: string; value: string }) => {
    const repository = repositories.find((r) => r.id.toString() === option.key);
    setSelectedRepository(repository || null);
    form.setData({
      ...form.data,
      repository_id: option.key,
      integration_provider_id: repository?.integration_provider_id || 0,
    });
    setSelectedIssue(null);
    setIssues([]);
    setQuery('');
  };

  const fetchIssues = async (searchTerm: string) => {
    if (!selectedRepository) return;

    try {
      const response = await fetch(
        route('admin.integrations.github.search-issues', {
          provider_id: selectedRepository.integration_provider_id,
          repository_id: selectedRepository.id,
          search: searchTerm,
        })
      );

      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleSearch = debounce((e: React.KeyboardEvent<HTMLInputElement>) => {
    const searchTerm = (e.target as HTMLInputElement).value;
    setQuery(searchTerm);
    if (searchTerm.length >= 2) {
      fetchIssues(searchTerm);
    }
  }, 300);

  const handleIssueSelect = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    form.setData('external_id', issue.number.toString());
  };

  const handleClear = () => {
    setSelectedIssue(null);
    setIssues([]);
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Link Issue</ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <SelectInput
              label="Select Repository"
              options={repositories.map((repository) => ({
                value: repository.name,
                key: repository.id.toString(),
              }))}
              onChange={handleRepositorySelect}
            />

            {selectedRepository && selectedIssue === null && (
              <div className="mt-4 relative z-10">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Issues
                </label>
                <Combobox value={selectedIssue} onChange={handleIssueSelect}>
                  <Combobox.Input
                    className="w-full px-3 py-2 text-gray-900 dark:text-white text-sm border-0 ring-1 ring-inset ring-gray-300 dark:ring-gray-500 dark:bg-white/5 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search for issues by title or number"
                    onKeyUp={handleSearch}
                    displayValue={(issue: GitHubIssue | null) =>
                      issue?.title || ''
                    }
                  />
                  <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {issues.map((issue) => (
                      <Combobox.Option
                        key={issue.number}
                        value={issue}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-4 pr-4 ${
                            active
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                              : 'text-gray-900 dark:text-white'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center">
                              <span
                                className={classNames(
                                  'truncate',
                                  selected && 'font-semibold'
                                )}
                              >
                                #{issue.number} - {issue.title}
                              </span>
                            </div>

                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active
                                    ? 'text-gray-700 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox>
              </div>
            )}

            {selectedIssue && (
              <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-2 py-2 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex">
                  <span className="block font-medium text-sm text-gray-900 dark:text-white">
                    #{selectedIssue.number} - {selectedIssue.title}
                  </span>
                </div>

                <button
                  type="button"
                  className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  onClick={handleClear}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalActions>
          <Button
            type="submit"
            disabled={!selectedRepository || !selectedIssue}
          >
            Link Issue
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={closeModal}
            className="mr-2"
          >
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default LinkIssueModal;
