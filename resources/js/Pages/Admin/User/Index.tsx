import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  TextField,
  SelectInput,
} from '@wedevs/tail-react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

import Authenticated from '@/Layouts/AuthenticatedLayout';
import UserTabs from '@/Components/UserTabs';
import { User, PaginatedResponse } from '@/types';
import { formatDate, generateRandomPassword } from '@/utils';
import Pagination from '@/Components/Pagination';

type Props = {
  users: PaginatedResponse<User>;
  filters: {
    search: string;
  };
};

const UserIndex = ({ users, filters }: Props) => {
  // Determine current tab based on the route
  const isAdminTab = route().current('admin.users.index');
  const currentTab = isAdminTab ? 'admins' : 'users';
  const defaultRole = isAdminTab ? 'admin' : 'user';
  const searchRoute = isAdminTab
    ? route('admin.users.index')
    : route('admin.users.all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const form = useForm({
    name: '',
    email: '',
    role: defaultRole,
    password: '',
  });
  const updateForm = useForm({
    name: '',
    role: '',
    password: '',
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
    updateForm.setData({
      name: user.name,
      role: user.role,
      password: '',
    });
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

  // Generate password for add form
  const generateAddPassword = () => {
    form.setData('password', generateRandomPassword());
  };

  // Generate password for edit form
  const generateEditPassword = () => {
    updateForm.setData('password', generateRandomPassword());
  };

  // Create a debounced search function
  const debouncedSearch = React.useCallback(
    debounce((search: string) => {
      router.get(
        searchRoute,
        { search },
        {
          preserveState: true,
          replace: true,
          only: ['users'],
        }
      );
    }, 300),
    [searchRoute]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Update the search term when the filters change
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Generate button for trailing addon
  const generateButton = (onClickHandler: () => void) => (
    <button
      type="button"
      onClick={onClickHandler}
      className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300 px-2 rounded-md"
    >
      <KeyIcon className="h-4 w-4 mr-1" />
      Generate
    </button>
  );

  const pageTitle = isAdminTab ? 'Admins' : 'Users';

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
      <Head title={pageTitle} />

      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow sm:rounded-lg">
        <UserTabs currentTab={currentTab} />

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border-0 ring-1 ring-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-600 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="space-y-4 p-6 text-gray-900 dark:text-gray-100">
          {users.data.length > 0 ? (
            users.data.map((user) => (
              <div className="flex items-center justify-between" key={user.id}>
                <div className="flex-1 items-center">
                  <div className="flex flex-1 items-center justify-between">
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
                    <div className="text-xs text-gray-500 pt-1 pr-4">
                      {formatDate(new Date(user.created_at))}
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
            ))
          ) : (
            <div className="text-center text-sm py-4 text-gray-500 dark:text-gray-400">
              No users found
            </div>
          )}
        </div>
      </div>

      {users.last_page > 1 && (
        <div className="mt-4">
          <Pagination links={users.links} />
        </div>
      )}

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

            <SelectInput
              label="Role"
              selectedKey={form.data.role}
              options={[
                { value: 'Admin', key: 'admin' },
                { value: 'User', key: 'user' },
              ]}
              onChange={(option) => form.setData('role', option.key)}
              error={form.errors.role}
            />

            <TextField
              label="Password"
              type="text"
              placeholder="Password"
              value={form.data.password}
              onChange={(value) => form.setData('password', value)}
              error={form.errors.password}
              trailingAddon={generateButton(generateAddPassword)}
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

            <SelectInput
              label="Role"
              selectedKey={updateForm.data.role}
              options={[
                { value: 'Admin', key: 'admin' },
                { value: 'User', key: 'user' },
              ]}
              onChange={(option) => updateForm.setData('role', option.key)}
              error={updateForm.errors.role}
            />

            <TextField
              label="New Password"
              type="text"
              placeholder="Leave blank to keep current password"
              value={updateForm.data.password}
              onChange={(value) => updateForm.setData('password', value)}
              error={updateForm.errors.password}
              trailingAddon={generateButton(generateEditPassword)}
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
