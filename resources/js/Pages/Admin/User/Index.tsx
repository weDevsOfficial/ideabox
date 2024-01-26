import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SwitchInput,
  Table,
  TableHeader,
  TextField,
} from '@wedevs/tail-react';
import { PlusIcon } from '@heroicons/react/24/outline';

import Authenticated from '@/Layouts/AuthenticatedLayout';
import { User } from '@/types';

type Props = {
  users: User[];
};

const UserIndex = ({ users }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const form = useForm({
    name: '',
    email: '',
  });
  const updateForm = useForm({
    name: '',
  });

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(route('admin.users.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsModalOpen(false);
        form.reset();
      },
    });
  };

  const editUser = (user: User) => {
    setEditingUserId(user.id);
    updateForm.setData('name', user.name);
    setIsEditModalOpen(true);
  };

  const updateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingUserId) {
      return;
    }

    updateForm.put(route('admin.users.update', editingUserId), {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditModalOpen(false);
        updateForm.reset();
        setEditingUserId(null);
      },
    });
  };

  const deleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      form.delete(route('admin.users.destroy', id), {
        preserveScroll: true,
      });
    }
  };

  return (
    <Authenticated
      header={
        <div className="flex justify-between">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Users
          </h2>

          <Button
            variant="primary"
            className="inline-flex"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            <span>Add User</span>
          </Button>
        </div>
      }
    >
      <Head title="Users" />

      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow sm:rounded-lg">
        <div className="space-y-4 p-6 text-gray-900 dark:text-gray-100">
          {users.length > 0 &&
            users.map((user) => (
              <div className="flex items-center" key={user.id}>
                <div className="flex-1 items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.avatar}
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 pt-1">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => editUser(user)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    size="small"
                    style="outline"
                    className="ml-2"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={submitForm}>
          <ModalHeader>Add New User</ModalHeader>

          <ModalBody>
            <TextField
              label="Name"
              placeholder="John Doe"
              value={form.data.name}
              onChange={(value) => form.setData('name', value)}
              error={form.errors.name}
            />

            <TextField
              label="Email"
              type="email"
              placeholder="john@doe.com"
              value={form.data.email}
              onChange={(value) => form.setData('email', value)}
              error={form.errors.email}
            />
          </ModalBody>

          <ModalActions>
            <Button
              type="submit"
              className="ml-2"
              loading={form.processing}
              disabled={form.processing}
            >
              Add User
            </Button>

            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={updateUser}>
          <ModalHeader>Edit User</ModalHeader>

          <ModalBody>
            <TextField
              label="Name"
              placeholder="John Doe"
              value={updateForm.data.name}
              onChange={(value) => updateForm.setData('name', value)}
              error={updateForm.errors.name}
            />
          </ModalBody>

          <ModalActions>
            <Button
              type="submit"
              className="ml-2"
              loading={updateForm.processing}
              disabled={updateForm.processing}
            >
              Update User
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </Authenticated>
  );
};

export default UserIndex;
