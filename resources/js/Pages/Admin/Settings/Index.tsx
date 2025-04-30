import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@wedevs/tail-react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import SettingInput from '@/Components/Settings/SettingInput';
import classNames from 'classnames';

interface Setting {
  id: number | null;
  key: string;
  value: string | null;
  type: string;
  group: string;
  label: string;
  description: string | null;
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

  const validateJson = (index: number, value: any): boolean => {
    if (typeof value === 'object' && value !== null) {
      // If it's already an object, it's valid
      if (jsonErrors[index]) {
        const newErrors = { ...jsonErrors };
        delete newErrors[index];
        setJsonErrors(newErrors);
      }
      return true;
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all object fields first
    let hasErrors = false;
    settings.forEach((setting, index) => {
      if (setting.type === 'json' && data.settings[index].value) {
        if (!validateJson(index, data.settings[index].value)) {
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      return;
    }

    // Pass the current group as a query parameter to maintain tab position
    post(route('admin.settings.update', { group: currentGroup }));
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
                  <SettingInput
                    setting={setting}
                    value={data.settings[index].value}
                    onChange={(value) => updateSetting(index, value)}
                  />
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
