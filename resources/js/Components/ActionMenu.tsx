import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import classNames from 'classnames';

type ActionMenuProps = {
  menuItems: {
    label: string;
    onClick: () => void;
  }[];
  menuName?: string;
};

export default function ActionMenu({ menuItems, menuName = 'Actions' }: ActionMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:text-gray-200">
          <span className="sr-only">Open options</span>
          <span>{menuName}</span>
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 dark:ring-gray-700">
          <div className="py-1">
            {menuItems.map((item) => (
              <Menu.Item key={item.label}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300',
                      'block px-4 py-2 text-sm w-full text-left dark:hover:bg-slate-700'
                    )}
                  >
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
