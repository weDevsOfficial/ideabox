import React, { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import classNames from 'classnames';
import { Button } from '@wedevs/tail-react';
import { LightBulbIcon, MapIcon } from '@heroicons/react/24/outline';

import Dropdown from '@/Components/Dropdown';
import { PageProps } from '@/types';

const FrontendLayout = ({ children }: PropsWithChildren) => {
  const { auth, appName, appLogo } = usePage<PageProps>().props;

  return (
    <div>
      <header className="border-b border-gray-200 mb-8">
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
                <span className="text-xl font-semibold">{appName}</span>
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
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition ease-in-out duration-150"
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
            <div className="flex -mb-[1px]">
              <Link
                href={route('home')}
                className={classNames(
                  'inline-flex items-center text-sm mr-3 px-3 py-3',
                  route().current('home')
                    ? 'text-indigo-600 font-semibold hover:text-indigo-700 border-b border-indigo-500'
                    : ''
                )}
              >
                <MapIcon className="h-5 w-5 mr-1.5" />
                <span>Roadmap</span>
              </Link>
              <Link
                href={route('board.show', 'feature-requests')}
                className={classNames(
                  'inline-flex items-center text-sm mr-3 px-3 py-2',
                  route().current('board.show')
                    ? 'text-indigo-600 font-medium hover:text-indigo-700 border-b border-indigo-500'
                    : ''
                )}
              >
                <LightBulbIcon className="h-5 w-5 mr-1.5" />
                <span>Feature Requests</span>
              </Link>
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

      <footer className="border-t border-gray-200 mt-12 py-4">
        <div className="w-[960px] mx-auto text-sm text-gray-600">
          &copy; {appName}
        </div>
      </footer>
    </div>
  );
};

export default FrontendLayout;
