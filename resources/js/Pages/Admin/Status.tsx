import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CirclePicker } from 'react-color';
import * as Popover from '@radix-ui/react-popover';

import { PageProps, StatusType } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SwitchInput,
  TextField,
} from '@wedevs/tail-react';
import { PlusIcon } from '@heroicons/react/24/outline';
import useSearchParams from '@/hooks/useSearchParams';

type Props = {
  statuses: StatusType[];
};

type ColorProps = {
  color: string;
  onChange: (color: string) => void;
};

const colorList = [
  '#a50000',
  '#cd4a12',
  '#fd563d',
  '#f0787a',
  '#fa7d9b',
  '#fd7f00',
  '#f4ae27',
  '#ff930a',
  '#7c0088',
  '#a60174',
  '#c50a8b',
  '#9a4fb9',
  '#b118c6',
  '#c17aff',
  '#fd37f1',
  '#ee82ff',
  '#040077',
  '#0063ae',
  '#1e58ed',
  '#6b69ff',
  '#1fa0ff',
  '#00c0fd',
  '#81b1ff',
  '#81c8c8',
  '#436652',
  '#00652a',
  '#048944',
  '#1e907a',
  '#1cbc9c',
  '#04c168',
  '#6cd345',
  '#00e4a1',
];

const StatusPage = ({ statuses }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<{
    statuses: StatusType[];
    deleted: number[];
  }>({
    statuses: statuses,
    deleted: [],
  });

  useEffect(() => {
    form.setData({
      statuses: statuses,
      deleted: [],
    });
  }, [statuses]);

  const updateItem = (id: number, key: string, value: any) => {
    form.setData(
      'statuses',
      form.data.statuses.map((status) => {
        if (status.id === id) {
          return {
            ...status,
            [key]: value,
          };
        }

        return status;
      })
    );
  };

  const confirmDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this status?')) {
      form.setData({
        statuses: form.data.statuses.filter((status) => status.id !== id),
        deleted: [...form.data.deleted, id],
      });
    }
  };

  const updateForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.put(route('admin.statuses.update'), {
      preserveScroll: true,
      onSuccess: () => {
        //
      },
    });
  };

  const onClose = () => {
    setIsModalOpen(false);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Statuses
          </h2>

          <Button
            variant="primary"
            className="inline-flex"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            <span>Add Status</span>
          </Button>
        </div>
      }
    >
      <div className="">
        <Head title="Dashboard" />

        <CreateModal isOpen={isModalOpen} onClose={onClose} />

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow sm:rounded-lg">
          <div className="sm:flex gap-6 p-6 text-gray-900 dark:text-gray-100">
            <div className="mb-4 sm:mb-0 sm:w-96 sm:border-r sm:pr-5 border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold mb-2">About Statuses</h3>
              <p className="text-sm">
                Statuses are the integral part of product roadmap. Only 3
                statuses can be shown in the roadmap at a time.
              </p>
            </div>
            <form onSubmit={updateForm} className="flex-1">
              {form.data.statuses.map((status) => (
                <div
                  key={status.id}
                  className="sm:flex items-center justify-between mb-6 sm:mb-2"
                >
                  <div className="mb-2 sm:mb-0 flex items-center">
                    <div className="mr-2">
                      <ColorPicker
                        color={status.color}
                        onChange={(color) =>
                          updateItem(status.id, 'color', color)
                        }
                      />
                    </div>
                    <div>
                      <span
                        className="uppercase font-medium"
                        style={{
                          color: status.color,
                        }}
                      >
                        <TextField
                          value={status.name}
                          wrapperClassName="mb-0"
                          style={{
                            color: status.color,
                          }}
                          onChange={(value) =>
                            updateItem(status.id, 'name', value)
                          }
                        />
                      </span>
                    </div>
                  </div>

                  <div className="flex">
                    <SwitchInput
                      label="Show in Roadmap"
                      initialValue={status.in_roadmap}
                      onChange={(checked) =>
                        updateItem(status.id, 'in_roadmap', checked)
                      }
                    />

                    <Button
                      variant="danger"
                      style="outline"
                      size="small"
                      className="ml-3"
                      onClick={() => confirmDelete(status.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {form.errors.statuses && (
                <div className="mt-4 text-right">
                  <p className="text-red-600 text-sm">{form.errors.statuses}</p>
                </div>
              )}

              <div className="text-right">
                <Button
                  className="mt-4"
                  variant="primary"
                  type="submit"
                  loading={form.processing}
                  disabled={form.processing}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

const ColorPicker = ({ color, onChange }: ColorProps) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="IconButton" aria-label="Update dimensions">
          <div
            className="h-6 w-6 rounded-full"
            style={{
              backgroundColor: color,
            }}
          ></div>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white px-4 py-4 rounded shadow z-20"
          sideOffset={5}
        >
          <CirclePicker
            color={color}
            width="340px"
            colors={colorList}
            onChangeComplete={(color) => {
              onChange(color.hex);
            }}
          />
          <Popover.Arrow className="fill-gray-50" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type CreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CreateModal = ({ isOpen, onClose }: CreateModalProps) => {
  const form = useForm<{
    name: string;
    color: string;
  }>({
    name: '',
    color: colorList[Math.floor(Math.random() * colorList.length)],
  });

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(route('admin.statuses.store'), {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={submitForm}>
        <ModalHeader>Add Status</ModalHeader>
        <ModalBody>
          <div className="mb-4 w-full">
            <div className="mb-2">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Choose Color
              </label>
            </div>

            <ColorPicker
              color={form.data.color}
              onChange={(color) => form.setData('color', color)}
            />
          </div>
          <TextField
            label="Status Name"
            placeholder="In Progress"
            className="font-semibold"
            value={form.data.name}
            onChange={(value) => form.setData('name', value)}
            style={{
              color: form.data.color,
            }}
            error={form.errors.name}
          />
        </ModalBody>
        <ModalActions>
          <Button variant="primary" type="submit">
            Create Status
          </Button>
          <Button variant="secondary" onClick={onClose} className="mr-2">
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default StatusPage;
