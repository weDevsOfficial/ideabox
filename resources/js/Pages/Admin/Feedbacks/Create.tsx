import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Combobox } from '@headlessui/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SelectInput,
  TextField,
  Textarea,
} from '@wedevs/tail-react';
import classNames from 'classnames';
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { User } from '@/types';

type Option = {
  value: string;
  key: string;
};

type Props = {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onSubmit?: () => void;
  statuses: Option[];
  boards: Option[];
};

type SearchProps = {
  onSelect: (user: any) => void;
  onCreate: () => void;
  onClear: () => void;
};

const CreateModal = ({
  showModal,
  setShowModal,
  onSubmit,
  statuses,
  boards,
}: Props) => {
  const [showUserForm, setShowUserForm] = useState(false);
  const form = useForm({
    title: '',
    body: '',
    board_id: '',
    status_id: '',
    behalf_id: 0,
  });

  const statusOptions = statuses.map((status) => ({
    value: status.key === 'all' ? '- Select - ' : status.value,
    key: status.key === 'all' ? '' : status.key,
  }));

  const boardOptions = boards.map((board) => ({
    value: board.key === 'all' ? '- Select - ' : board.value,
    key: board.key === 'all' ? '' : board.key,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    form.post(route('admin.feedbacks.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowModal(false);
        form.reset();
      },
    });

    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Create Feedback</ModalHeader>
        <ModalBody>
          <div className="mb-4 border p-3 rounded">
            <div className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Post on behalf of a user (optional)
            </div>
            <UserSearchDropdown
              onCreate={() => setShowUserForm(true)}
              onSelect={(user) => form.setData('behalf_id', user.id)}
              onClear={() => form.setData('behalf_id', 0)}
            />
          </div>

          <TextField
            label="Title"
            name="title"
            placeholder="Enter a short title"
            required={true}
            value={form.data.title}
            onChange={(value) => form.setData('title', value)}
            error={form.errors.title}
          />

          <Textarea
            label="Details"
            name="body"
            placeholder="Enter the details of the feature"
            required={true}
            value={form.data.body}
            onChange={(value) => form.setData('body', value)}
            error={form.errors.body}
          />

          <SelectInput
            label="Status"
            options={statusOptions}
            onChange={(option) => form.setData('status_id', option.key)}
            error={form.errors.status_id}
          />
          <SelectInput
            label="Board"
            options={boardOptions}
            onChange={(option) => form.setData('board_id', option.key)}
            error={form.errors.board_id}
          />
        </ModalBody>

        <ModalActions>
          <Button
            type="submit"
            variant="primary"
            disabled={form.processing}
            loading={form.processing}
          >
            Create
          </Button>
          <Button
            onClick={() => setShowModal(false)}
            variant="secondary"
            className="mr-2"
          >
            Cancel
          </Button>
        </ModalActions>
      </form>

      <Modal isOpen={showUserForm} onClose={() => setShowUserForm(false)}>
        <form>
          <ModalHeader>Create User</ModalHeader>
          <ModalBody>
            <TextField
              label="Name"
              placeholder="Enter a name"
              value={''}
              onChange={function (value: string): void {
                throw new Error('Function not implemented.');
              }}
            />
            <TextField
              label="Email"
              placeholder="Enter an email"
              value={''}
              onChange={function (value: string): void {
                throw new Error('Function not implemented.');
              }}
            />
          </ModalBody>
          <ModalActions>
            <Button type="submit" variant="primary">
              Create
            </Button>
            <Button onClick={() => setShowUserForm(false)} variant="secondary">
              Cancel
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </Modal>
  );
};

export default CreateModal;

const UserSearchDropdown = ({ onSelect, onCreate, onClear }: SearchProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');

  const fetchUsers = async (searchTerm: string) => {
    const response = await fetch(
      route('admin.users.search', { query: searchTerm })
    );

    return response.json();
  };

  const handleSelect = (user: any) => {
    setSelectedUser(user);
    onSelect(user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    onClear();
  };

  const handleSearch = debounce((e: React.KeyboardEvent<HTMLInputElement>) => {
    setQuery((e.target as HTMLInputElement).value);
    fetchUsers((e.target as HTMLInputElement).value).then((fetchedUsers) =>
      setUsers(fetchedUsers)
    );
  }, 300);

  return (
    <div className="relative z-10">
      {selectedUser === null && (
        <Combobox value={selectedUser} onChange={handleSelect}>
          <Combobox.Input
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search for a user by name or email"
            onKeyUp={handleSearch}
          />
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {users.length === 0 && query !== '' ? (
              <div className="relative cursor-pointer select-none py-2 px-4 text-gray-700">
                <button
                  type="button"
                  className="inline-flex items-center"
                  onClick={() => onCreate()}
                >
                  <PlusIcon className="h-4 w-4 inline-block mr-1.5" />
                  Create New User
                </button>
              </div>
            ) : (
              users.map((user) => (
                <Combobox.Option
                  key={user.id}
                  value={user}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-100 text-gray-700' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-6 w-6 flex-shrink-0 rounded-full"
                        />
                        <span
                          className={classNames(
                            'ml-3 truncate',
                            selected && 'font-semibold'
                          )}
                        >
                          {user.name} ({user.email})
                        </span>
                      </div>

                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-white' : 'text-indigo-600'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Combobox>
      )}

      {selectedUser && (
        <div className="mt-2 flex items-center justify-between bg-indigo-50 px-2 py-2 rounded border">
          <div className="flex">
            <img
              src={selectedUser.avatar}
              alt={selectedUser.name}
              className="h-6 w-6 flex-shrink-0 rounded-full mr-2"
            />
            <span className="block font-medium text-sm">
              {selectedUser.name}
            </span>
          </div>

          <button className="" onClick={handleClear}>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
