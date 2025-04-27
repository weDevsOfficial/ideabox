import { useEffect, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { User } from '@/types';

type Props = {
  selectedUser: User | null;
  onSelect: (user: any) => void;
  onCreate: () => void;
  onClear: () => void;
};

const UserSearchDropdown = ({
  selectedUser,
  onSelect,
  onCreate,
  onClear,
}: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setUser(selectedUser);
  }, [selectedUser]);

  const fetchUsers = async (searchTerm: string) => {
    const response = await fetch(
      route('admin.users.search', { query: searchTerm })
    );

    return response.json();
  };

  const handleSelect = (user: any) => {
    setUser(user);
    onSelect(user);
  };

  const handleClear = () => {
    setUser(null);
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
      {user === null && (
        <Combobox value={selectedUser} onChange={handleSelect}>
          <Combobox.Input
            className="w-full px-3 py-2 text-sm border-0 ring-1 ring-inset ring-gray-300 dark:ring-gray-500 dark:bg-white/5 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search for a user by name or email"
            onKeyUp={handleSearch}
          />
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {users.length === 0 && query !== '' ? (
              <div className="relative cursor-pointer select-none py-2 px-4 text-gray-700 dark:text-gray-300">
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
                    `relative cursor-pointer select-none py-2 pl-4 pr-4 ${
                      active
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-900 dark:text-gray-300'
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
                            active
                              ? 'text-gray-700 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400'
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

      {user && (
        <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-2 py-2 rounded border border-gray-200 dark:border-gray-600">
          <div className="flex">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-6 w-6 flex-shrink-0 rounded-full mr-2"
            />
            <span className="block font-medium text-sm text-gray-900 dark:text-white">
              {user.name}
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
  );
};

export default UserSearchDropdown;
