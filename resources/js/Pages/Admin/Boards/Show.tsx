import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Button,
  SelectCard,
  SwitchInput,
  TextField,
  Textarea,
} from '@wedevs/tail-react';

import Authenticated from '@/Layouts/AuthenticatedLayout';
import { BoardType } from '@/types';
import { TrashIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

type Props = {
  board: BoardType;
};

type FieldType = {
  label: string;
  placeholder: string;
};

type FormFields = {
  title: FieldType;
  details: FieldType;
  [key: string]: FieldType;
};

const Show = ({ board }: Props) => {
  const form = useForm<{
    name: string;
    slug: string;
    privacy: string;
    allow_posts: boolean;
    settings: {
      heading: string;
      description: string;
      fields: FormFields;
      button: string;
    };
  }>({
    name: board.name,
    slug: board.slug,
    privacy: board.privacy,
    allow_posts: board.allow_posts,
    settings: {
      heading: board.settings?.form.heading || '',
      description: board.settings?.form.description || '',
      fields: {
        title: {
          label: board.settings?.form.fields.title.label || '',
          placeholder: board.settings?.form.fields.title.placeholder || '',
        },
        details: {
          label: board.settings?.form.fields.details.label || '',
          placeholder: board.settings?.form.fields.details.placeholder || '',
        },
      },
      button: board.settings?.form.button || '',
    },
  });

  const updateFormSetting = (key: string, value: string) => {
    form.setData({
      ...form.data,
      settings: {
        ...form.data.settings,
        [key]: value,
      },
    });
  };

  const updateFormFieldSetting = (
    field: string,
    key: string,
    value: string
  ) => {
    form.setData({
      ...form.data,
      settings: {
        ...form.data.settings,
        fields: {
          ...form.data.settings.fields,
          [field]: {
            ...form.data.settings.fields[field],
            [key]: value,
          },
        },
      },
    });
  };

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.put(route('admin.boards.update', [board]), {
      preserveScroll: false,
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
      <Link
        className="flex mb-6 items-center text-sm text-gray-600 "
        href={route('admin.boards.index')}
      >
        <ChevronLeftIcon className="h-5 w-5 mr-2" />
        Back
      </Link>

      <form onSubmit={submitForm}>
        <Head title={`Edit ${board.name}`} />

        <TextField
          label="Board Name"
          value={form.data.name}
          onChange={(value) => form.setData('name', value)}
        />

        <TextField
          label="Slug"
          value={form.data.slug}
          onChange={(value) => form.setData('slug', value)}
        />

        <SelectCard
          label="Board Privacy"
          help="Public boards are visible to anyone, while private boards have restricted access."
          selectedKey={form.data.privacy}
          options={[
            { value: 'Public', key: 'public' },
            { value: 'Private', key: 'private' },
          ]}
          onChange={(option) => {
            if (option.key === 'public' || option.key === 'private') {
              form.setData('privacy', option.key);
            }
          }}
          renderItem={(option) => (
            <div className="text-sm w-20">{option.value}</div>
          )}
        />

        <SwitchInput
          label="Allow new posts from end users"
          initialValue={form.data.allow_posts}
          onChange={(value) => form.setData('allow_posts', value)}
        />

        {form.data.allow_posts && (
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded mt-4">
            <h3 className="font-semibold text-base mb-4">Form Settings</h3>

            <TextField
              label="Form Heading"
              value={form.data.settings.heading}
              onChange={(value) => updateFormSetting('heading', value)}
            />

            <Textarea
              label="Form Description"
              value={form.data.settings.description}
              onChange={(value) => updateFormSetting('description', value)}
            />

            <div className="border border-dashed border-indigo-200 p-4 rounded mb-4">
              <div className="mb-4 bg-indigo-50 dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 p-4 rounded">
                <div className="mb-4 text-sm font-semibold dark:text-gray-300">
                  Title Field
                </div>

                <div className="sm:flex gap-4">
                  <TextField
                    label="Field Label"
                    value={form.data.settings.fields.title.label}
                    onChange={(value) =>
                      updateFormFieldSetting('title', 'label', value)
                    }
                  />

                  <TextField
                    label="Placeholder"
                    value={form.data.settings.fields.title.placeholder}
                    onChange={(value) =>
                      updateFormFieldSetting('title', 'placeholder', value)
                    }
                  />
                </div>
              </div>

              <div className="mb-4 bg-indigo-50 dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 p-4 rounded">
                <div className="mb-4 text-sm font-semibold dark:text-gray-300">
                  Description Field
                </div>

                <div className="sm:flex gap-4">
                  <TextField
                    label="Field Label"
                    value={form.data.settings.fields.details.label}
                    onChange={(value) =>
                      updateFormFieldSetting('details', 'label', value)
                    }
                  />

                  <TextField
                    label="Placeholder"
                    value={form.data.settings.fields.details.placeholder}
                    onChange={(value) =>
                      updateFormFieldSetting('details', 'placeholder', value)
                    }
                  />
                </div>
              </div>
            </div>

            <TextField
              label="Button Text"
              value={form.data.settings.button}
              onChange={(value) => updateFormSetting('button', value)}
            />
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Link
            as="button"
            type="button"
            href={route('admin.boards.destroy', [board])}
            method="delete"
            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
            onBefore={() =>
              confirm('Are you sure you want to delete this board?')
            }
          >
            <TrashIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Delete
          </Link>

          <Button
            variant="primary"
            type="submit"
            disabled={form.processing}
            loading={form.processing}
          >
            Update Board
          </Button>
        </div>
      </form>
    </div>
  );
};

Show.layout = (page: React.ReactNode) => (
  <Authenticated
    children={page}
    header={
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        Boards
      </h2>
    }
  />
);

export default Show;
