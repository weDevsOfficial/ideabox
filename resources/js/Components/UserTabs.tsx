import React from 'react';
import { Link } from '@inertiajs/react';
import classNames from 'classnames';

interface Tab {
  name: string;
  route: string;
  active: boolean;
}

interface UserTabsProps {
  currentTab: 'admins' | 'users';
}

const UserTabs: React.FC<UserTabsProps> = ({ currentTab }) => {
  const tabs: Tab[] = [
    {
      name: 'Admins',
      route: route('admin.users.index'),
      active: currentTab === 'admins',
    },
    {
      name: 'Users',
      route: route('admin.users.all'),
      active: currentTab === 'users',
    },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center ml-4 mt-2">
        {tabs.map((tab) => (
          <li className="mr-2" key={tab.name}>
            <Link
              href={tab.route}
              className={classNames(
                'inline-block p-4 border-b-2 rounded-t-lg',
                {
                  'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500':
                    tab.active,
                  'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-400 dark:hover:border-gray-600':
                    !tab.active,
                }
              )}
              aria-current={tab.active ? 'page' : undefined}
            >
              {tab.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserTabs;
