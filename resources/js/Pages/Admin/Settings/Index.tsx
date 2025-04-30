import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Badge,
  Button,
  TextField,
  Textarea,
  SwitchInput,
  Notice,
  Modal,
  ModalHeader,
  ModalBody,
  ModalActions,
} from '@wedevs/tail-react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import classNames from 'classnames';
import { XMarkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/solid';

interface Setting {
  id: number | null;
  key: string;
  value: string | null;
  type: string;
  group: string;
  label: string;
  description: string | null;
}

interface Link {
  label: string;
  href: string;
  is_external: boolean;
}

interface Props extends PageProps {
  settings: Setting[];
  groups: string[];
  currentGroup: string;
  groupLabels: Record<string, string>;
}

export default function SettingsIndex({
  auth,
  settings,
  groups,
  currentGroup,
  groupLabels,
  success,
  error,
}: Props) {
  const { data, setData, post, processing, errors } = useForm({
    settings: settings.map((setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value,
    })),
  });

  // Track JSON validation errors
  const [jsonErrors, setJsonErrors] = useState<Record<number, string | null>>(
    {},
  );

  const updateSetting = (index: number, value: any) => {
    const updatedSettings = [...data.settings];
    updatedSettings[index] = { ...updatedSettings[index], value };
    setData('settings', updatedSettings);
  };

  const validateJson = (index: number, value: string): boolean => {
    try {
      JSON.parse(value);
      // Clear error if valid
      if (jsonErrors[index]) {
        const newErrors = { ...jsonErrors };
        delete newErrors[index];
        setJsonErrors(newErrors);
      }
      return true;
    } catch (e) {
      // Set error message
      setJsonErrors({
        ...jsonErrors,
        [index]: (e as Error).message,
      });
      return false;
    }
  };

  const formatJson = (index: number) => {
    try {
      const value = data.settings[index].value;
      if (value) {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        updateSetting(index, formatted);
      }
    } catch (e) {
      // Don't format if invalid JSON
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all JSON fields first
    let hasJsonErrors = false;
    settings.forEach((setting, index) => {
      if (setting.type === 'json' && data.settings[index].value) {
        if (!validateJson(index, data.settings[index].value as string)) {
          hasJsonErrors = true;
        }
      }
    });

    if (hasJsonErrors) {
      return;
    }

    // Pass the current group as a query parameter to maintain tab position
    post(route('admin.settings.update', { group: currentGroup }), {
      onError: (errors) => {
        console.error('Error updating settings:', errors);
      },
    });
  };

  const renderSettingInput = (setting: Setting, index: number) => {
    const currentValue = data.settings[index].value;

    switch (setting.type) {
      case 'boolean':
        return (
          <div>
            <input
              type="checkbox"
              checked={currentValue === '1' || currentValue === 'true'}
              onChange={(e) =>
                updateSetting(index, e.target.checked ? '1' : '0')
              }
              className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
            />
          </div>
        );

      case 'json':
        // Special handling for links
        if (setting.key === 'footer_links' || setting.key === 'header_links') {
          return (
            <LinkManager
              value={currentValue}
              onChange={(value) => updateSetting(index, value)}
            />
          );
        }

        return (
          <div>
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => formatJson(index)}
                className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Format JSON
              </button>
            </div>

            <Textarea
              value={currentValue || ''}
              onChange={(e: any) => {
                const newValue = e.target.value;
                updateSetting(index, newValue);
                if (newValue) {
                  validateJson(index, newValue);
                } else {
                  // Clear error if field is empty
                  const newErrors = { ...jsonErrors };
                  delete newErrors[index];
                  setJsonErrors(newErrors);
                }
              }}
              rows={10}
              className="w-full font-mono text-sm"
              error={jsonErrors[index] || ''}
            />

            {jsonErrors[index] && (
              <p className="mt-1 text-sm text-red-600">{jsonErrors[index]}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={currentValue || ''}
            onChange={(value) => updateSetting(index, value)}
            rows={3}
          />
        );

      default:
        return (
          <TextField
            type="text"
            value={currentValue || ''}
            onChange={(value) => updateSetting(index, value)}
          />
        );
    }
  };

  return (
    <Authenticated
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Settings
        </h2>
      }
    >
      <Head title="Site Settings" />

      <div className="overflow-hidden bg-white shadow sm:rounded-lg dark:bg-gray-800">
        {/* <!-- Hidden debug info for developers, remove in production --> */}
        <div className="hidden bg-gray-100 p-1 text-xs text-gray-500">
          Current group: {currentGroup || 'none'}
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="-mb-px ml-4 mt-2 flex flex-wrap text-center text-sm font-medium">
            {Object.entries(groupLabels).map(([group, label]) => (
              <li className="mr-2" key={group}>
                <Link
                  href={route('admin.settings.index', { group })}
                  className={classNames(
                    'inline-block rounded-t-lg border-b-2 p-4',
                    {
                      'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500':
                        currentGroup === group,
                      'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-400':
                        currentGroup !== group,
                    },
                  )}
                  aria-current={currentGroup === group ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="divide-y divide-gray-200 px-6 dark:divide-gray-700">
            {settings.map((setting, index) => (
              <div key={setting.key} className="grid grid-cols-5 py-6">
                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {setting.label}
                  </label>

                  {setting.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {setting.description}
                    </p>
                  )}
                </div>

                <div className="col-span-3">
                  {renderSettingInput(setting, index)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-gray-200 p-6 dark:border-gray-700">
            <Button type="submit" variant="primary" loading={processing}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </Authenticated>
  );
}

// Link Manager component for editing footer and header links
interface LinkManagerProps {
  value: string | null;
  onChange: (value: string) => void;
}

function LinkManager({ value, onChange }: LinkManagerProps) {
  const [links, setLinks] = useState<Link[]>(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch (e) {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Update the parent component when links change
  const updateLinks = (newLinks: Link[]) => {
    setLinks(newLinks);
    onChange(JSON.stringify(newLinks));
  };

  // Add a new link
  const addLink = () => {
    setCurrentLink({ label: '', href: '', is_external: false });
    setEditIndex(null);
    setIsModalOpen(true);
  };

  // Edit an existing link
  const editLink = (index: number) => {
    setCurrentLink({ ...links[index] });
    setEditIndex(index);
    setIsModalOpen(true);
  };

  // Remove a link
  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    updateLinks(newLinks);
  };

  // Save link from modal
  const saveLink = () => {
    if (!currentLink) return;

    const newLinks = [...links];
    if (editIndex !== null) {
      // Edit existing link
      newLinks[editIndex] = currentLink;
    } else {
      // Add new link
      newLinks.push(currentLink);
    }

    updateLinks(newLinks);
    setIsModalOpen(false);
    setCurrentLink(null);
    setEditIndex(null);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Links</h3>
        <Button
          size="small"
          variant="secondary"
          onClick={addLink}
          className="flex items-center gap-1 px-2 py-1"
        >
          <PlusIcon className="h-3 w-3" />
          <span>Add New</span>
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="text-sm italic text-gray-500">No links added yet.</p>
      ) : (
        <ul className="space-y-2 rounded bg-gray-50 p-3 dark:bg-gray-900">
          {links.map((link, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <div>
                <div className="text-sm font-medium">{link.label}</div>
                <div className="max-w-md truncate font-mono text-sm text-gray-500">
                  {link.href}
                  {link.is_external && (
                    <span className="ml-1 text-xs italic">(external)</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => editLink(index)}
                  className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Link edit modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          {editIndex !== null ? 'Edit Link' : 'Add New Link'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Label</label>
              <TextField
                value={currentLink?.label || ''}
                onChange={(value) =>
                  setCurrentLink((prev) =>
                    prev ? { ...prev, label: value } : null,
                  )
                }
                placeholder="e.g. Terms of Service"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">URL</label>
              <TextField
                value={currentLink?.href || ''}
                onChange={(value) =>
                  setCurrentLink((prev) =>
                    prev ? { ...prev, href: value } : null,
                  )
                }
                placeholder="e.g. /terms or https://example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_external"
                checked={currentLink?.is_external || false}
                onChange={(e) =>
                  setCurrentLink((prev) =>
                    prev ? { ...prev, is_external: e.target.checked } : null,
                  )
                }
                className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
              />
              <label htmlFor="is_external" className="text-sm">
                External link (opens in new tab)
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalActions>
          <Button
            variant="primary"
            onClick={saveLink}
            disabled={!currentLink?.label || !currentLink.href}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            className="mr-2"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
