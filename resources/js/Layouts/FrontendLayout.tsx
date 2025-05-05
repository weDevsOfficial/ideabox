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
  const { auth, appName, appLogo, boards, siteSettings } =
    usePage<PageProps>().props;

  // Get settings with fallbacks
  const siteName = siteSettings?.app_name || appName;
  const logo = siteSettings?.app_logo || appLogo || '/images/logo.svg';
  const darkLogo = siteSettings?.app_logo_dark || logo;
  const footerLinks = siteSettings?.footer_links || [];
  const headerLinks = siteSettings?.header_links || [];
  const footerText = siteSettings?.footer_text || '';

  return (
    <div className="dark:bg-gray-900">
      <header className="mb-8 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto w-[960px]">
          <div className="mb-1 flex items-center justify-between py-3">
            <div className="">
              <Link href="/" className="flex items-center">
                <img
                  alt={`${siteName} Logo`}
                  src={logo}
                  loading="lazy"
                  className="mr-3 h-10 w-10"
                />
                <span className="text-xl font-semibold dark:text-gray-300">
                  {siteName}
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              {/* Header Links */}
              {headerLinks.length > 0 && (
                <div className="mr-4 flex items-center space-x-4">
                  {headerLinks.map((link, index) => (
                    <HeaderLink key={index} link={link} />
                  ))}
                </div>
              )}

              <div className="">
                {auth.user ? (
                  <div className="flex items-center">
                    {auth.user.role === 'admin' && (
                      <Button
                        as={Link}
                        href={route('admin.feedbacks.index')}
                        variant="primary"
                        style="outline"
                        className="mr-2 px-2 py-1.5 text-[13px] font-medium"
                      >
                        Admin Dashboard
                      </Button>
                    )}

                    <Dropdown>
                      <Dropdown.Trigger>
                        <span className="inline-flex rounded-md">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800"
                          >
                            {auth.user.name}

                            <ChevronDownIcon className="-me-0.5 ms-2 h-4 w-4" />
                          </button>
                        </span>
                      </Dropdown.Trigger>

                      <Dropdown.Content>
                        <Dropdown.Link
                          href={route('profile.edit')}
                          className="font-medium"
                        >
                          Profile
                        </Dropdown.Link>

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
          </div>

          <div className="flex items-center justify-between">
            <div className="-mb-[1px] flex items-center gap-3">
              <Link
                href={route('home')}
                className={classNames(
                  'inline-flex items-center px-3 py-3 text-sm',
                  route().current('home')
                    ? 'border-b border-indigo-500 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300'
                    : 'dark:text-gray-400',
                )}
              >
                <MapIcon className="mr-1.5 h-5 w-5" />
                <span>Roadmap</span>
              </Link>

              {boards.length === 1 ? (
                <Link
                  href={route('board.show', boards[0].slug)}
                  className={classNames(
                    'mr-3 inline-flex items-center px-3 py-3 text-sm',
                    route().current('board.show', boards[0].slug)
                      ? 'border-b border-indigo-500 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300'
                      : 'dark:text-gray-400',
                  )}
                >
                  <LightBulbIcon className="mr-1.5 h-5 w-5" />
                  <span>{boards[0].name}</span>
                </Link>
              ) : (
                <Dropdown>
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      className={classNames(
                        'inline-flex items-center px-3 py-3 text-sm',
                        route().current('board.show')
                          ? 'border-b border-indigo-500 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300'
                          : 'dark:text-gray-400',
                      )}
                    >
                      <LightBulbIcon className="mr-1.5 h-5 w-5" />
                      <span>Boards</span>
                      <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
                    </button>
                  </Dropdown.Trigger>

                  <Dropdown.Content>
                    {boards.map((board) => (
                      <Dropdown.Link
                        key={board.id}
                        href={route('board.show', board.slug)}
                        className={classNames(
                          route().current('board.show', board.slug)
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300'
                            : '',
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

      <main className="mx-auto w-[960px]">{children}</main>

      <footer className="mt-12 border-t border-gray-200 py-6 dark:border-gray-700">
        <div className="mx-auto w-[960px]">
          <div className="flex items-center justify-between">
            <div className="w-full sm:w-1/2">
              <p
                className="text-sm text-gray-600 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: footerText }}
              />
            </div>

            {/* Footer Links */}
            {footerLinks.length > 0 && (
              <div className="w-full sm:w-1/2">
                <div className="flex items-center justify-end gap-2">
                  {footerLinks.map((link, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <span className="text-gray-400 dark:text-gray-600">
                          &middot;
                        </span>
                      )}
                      <FooterLink link={link} />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

interface LinkProps {
  link: {
    label: string;
    href: string;
    is_external: boolean;
  };
}

// Helper component for header links
const HeaderLink = ({ link }: LinkProps) => {
  if (link.is_external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
    >
      {link.label}
    </Link>
  );
};

// Helper component for footer links
const FooterLink = ({ link }: LinkProps) => {
  if (link.is_external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
    >
      {link.label}
    </Link>
  );
};

export default FrontendLayout;
