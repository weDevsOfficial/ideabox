import React, { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import classNames from 'classnames';
import { Button } from '@wedevs/tail-react';
import {
  ChevronDownIcon,
  LightBulbIcon,
  MapIcon,
} from '@heroicons/react/24/outline';

import Dropdown from '@/Components/Dropdown';
import { PageProps } from '@/types';

const FrontendLayout = ({ children }: PropsWithChildren) => {
  const { auth, appName, appLogo, boards } = usePage<PageProps>().props;

  return (
    <div className="dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <div className="w-[960px] mx-auto">
          <div className="flex justify-between py-3 mb-1 items-center">
            <div className="">
              <Link href="/" className="flex items-center">
                <img
                  alt={`${appName} Logo`}
                  src={appLogo || '/images/logo.svg'}
                  loading="lazy"
                  className="w-10 h-10 mr-3"
                />
                <span className="text-xl font-semibold dark:text-gray-300">
                  {appName}
                </span>
              </Link>
            </div>
            <div className="">
              {auth.user ? (
                <div className="flex items-center">
                  {auth.user.role === 'admin' && (
                    <Button
                      as={Link}
                      href={route('admin.feedbacks.index')}
                      variant="primary"
                      style="outline"
                      className="mr-2 font-medium text-[13px] py-1.5 px-2"
                    >
                      Admin Dashboard
                    </Button>
                  )}
                  <Dropdown>
                    <Dropdown.Trigger>
                      <span className="inline-flex rounded-md">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white dark:bg-gray-800 hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                        >
                          {auth.user.name}

                          <svg
                            className="ms-2 -me-0.5 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </span>
                    </Dropdown.Trigger>

                    <Dropdown.Content>
                      <Dropdown.Link
                        href={route('logout')}
                        method="post"
                        as="button"
                      >
                        Log Out
                      </Dropdown.Link>
                    </Dropdown.Content>
                  </Dropdown>
                </div>
              ) : (
                <>
                  <Button
                    as={Link}
                    href={route('login')}
                    variant="secondary"
                    size="medium"
                  >
                    Log in
                  </Button>

                  <Button
                    size="medium"
                    as={Link}
                    href={route('register')}
                    className="ml-2"
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 -mb-[1px]">
              <Link
                href={route('home')}
                className={classNames(
                  'inline-flex items-center text-sm px-3 py-3',
                  route().current('home')
                    ? 'text-indigo-600 dark:text-indigo-300 font-semibold hover:text-indigo-700 border-b border-indigo-500'
                    : 'dark:text-gray-400'
                )}
              >
                <MapIcon className="h-5 w-5 mr-1.5" />
                <span>Roadmap</span>
              </Link>

              {boards.length === 1 ? (
                <Link
                  href={route('board.show', boards[0].slug)}
                  className={classNames(
                    'inline-flex items-center text-sm mr-3 px-3 py-2',
                    route().current('board.show', boards[0].slug)
                      ? 'text-indigo-600 dark:text-indigo-300 font-semibold hover:text-indigo-700 border-b border-indigo-500'
                      : 'dark:text-gray-400'
                  )}
                >
                  <LightBulbIcon className="h-5 w-5 mr-1.5" />
                  <span>{boards[0].name}</span>
                </Link>
              ) : (
                <Dropdown>
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      className={classNames(
                        'inline-flex items-center text-sm px-3 py-3',
                        route().current('board.show')
                          ? 'text-indigo-600 dark:text-indigo-300 font-semibold hover:text-indigo-700 border-b border-indigo-500'
                          : 'dark:text-gray-400'
                      )}
                    >
                      <LightBulbIcon className="h-5 w-5 mr-1.5" />
                      <span>Boards</span>
                      <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-400" />
                    </button>
                  </Dropdown.Trigger>

                  <Dropdown.Content>
                    {boards.map((board) => (
                      <Dropdown.Link
                        key={board.id}
                        href={route('board.show', board.slug)}
                        className={classNames(
                          route().current('board.show', board.slug)
                            ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20'
                            : ''
                        )}
                      >
                        {board.name}
                      </Dropdown.Link>
                    ))}
                  </Dropdown.Content>
                </Dropdown>
              )}
            </div>

            {/* <div className="relative">
              <input
                type="search"
                placeholder="Search"
                className="px-4 pl-9 py-1.5 rounded border-0 text-sm ring-1 ring-indigo-50 focus:outline-none focus:ring-1"
              />
              <div className="absolute inset-y-0 left-2 flex items-center pr-3 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div> */}
          </div>
        </div>
      </header>

      <main className="w-[960px] mx-auto">{children}</main>

      <footer className="border-t border-gray-200 dark:border-gray-700 mt-12 py-4">
        <div className="w-[960px] mx-auto text-sm text-gray-600 dark:text-gray-300">
          &copy; {appName}
        </div>
      </footer>
    </div>
  );
};

export default FrontendLayout;
