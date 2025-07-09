import React, { PropsWithChildren, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import classNames from 'classnames';
import { Button } from '@wedevs/tail-react';
import {
  ChevronDownIcon,
  LightBulbIcon,
  MapIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import Dropdown from '@/Components/Dropdown';
import { PageProps } from '@/types';

const FrontendLayout = ({ children }: PropsWithChildren) => {
  const { auth, appName, appLogo, boards, siteSettings } =
    usePage<PageProps>().props;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get settings with fallbacks
  const siteName = siteSettings?.app_name || appName;
  const logo = siteSettings?.app_logo || appLogo || '/images/logo.svg';
  const darkLogo = siteSettings?.app_logo_dark || logo;
  const footerLinks = siteSettings?.footer_links || [];
  const headerLinks = siteSettings?.header_links || [];
  const footerText = siteSettings?.footer_text || '';

  return (
    <div className="dark:bg-gray-900">
      <header className="mb-4 border-b border-gray-200 sm:mb-8 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-1 flex items-center justify-between py-3">
            <div className="">
              <Link href="/" className="flex items-center">
                <img
                  alt={`${siteName} Logo`}
                  src={logo}
                  loading="lazy"
                  className="mr-3 h-8 w-8 sm:h-10 sm:w-10"
                />
                <span className="text-lg font-semibold sm:text-xl dark:text-gray-300">
                  {siteName}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center md:flex">
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden items-center justify-between md:flex">
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
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {/* Main Navigation */}
                <Link
                  href={route('home')}
                  className={classNames(
                    'block px-3 py-2 text-base font-medium',
                    route().current('home')
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300',
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <MapIcon className="mr-2 h-5 w-5" />
                    Roadmap
                  </div>
                </Link>

                {/* Boards */}
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={route('board.show', board.slug)}
                    className={classNames(
                      'block px-3 py-2 text-base font-medium',
                      route().current('board.show', board.slug)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <LightBulbIcon className="mr-2 h-5 w-5" />
                      {board.name}
                    </div>
                  </Link>
                ))}

                {/* Header Links */}
                {headerLinks.map((link, index) => (
                  <MobileHeaderLink
                    key={index}
                    link={link}
                    onClose={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>

              {/* Auth buttons */}
              <div className="border-t border-gray-200 pb-3 pt-4 dark:border-gray-700">
                {auth.user ? (
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <img
                        className="h-8 w-8 rounded-full"
                        src={auth.user.avatar || '/images/default-avatar.png'}
                        alt=""
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                        {auth.user.name}
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {auth.user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 px-4">
                    <Button
                      as={Link}
                      href={route('login')}
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Button>
                    <Button
                      as={Link}
                      href={route('register')}
                      className="w-full justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Button>
                  </div>
                )}

                {auth.user && (
                  <div className="mt-3 space-y-1">
                    {auth.user.role === 'admin' && (
                      <Link
                        href={route('admin.feedbacks.index')}
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href={route('profile.edit')}
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href={route('logout')}
                      method="post"
                      as="button"
                      className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log Out
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</main>

      <footer className="mt-8 border-t border-gray-200 py-6 sm:mt-12 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div className="mb-4 w-full sm:mb-0 sm:w-1/2">
              <p
                className="text-center text-sm text-gray-600 sm:text-left dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: footerText }}
              />
            </div>

            {/* Footer Links */}
            {footerLinks.length > 0 && (
              <div className="w-full sm:w-1/2">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
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

// Helper component for mobile header links
const MobileHeaderLink = ({
  link,
  onClose,
}: LinkProps & { onClose: () => void }) => {
  if (link.is_external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        onClick={onClose}
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      onClick={onClose}
    >
      {link.label}
    </Link>
  );
};

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
