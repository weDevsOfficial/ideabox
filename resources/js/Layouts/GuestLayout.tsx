import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
  const { appLogo } = usePage<PageProps>().props;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 px-4 pt-6 sm:justify-center sm:px-6 sm:pt-0 dark:bg-gray-900">
      <div>
        <Link href="/">
          <img src={appLogo} alt="logo" className="h-20 w-20" />
        </Link>
      </div>

      <div className="mt-6 w-full overflow-hidden rounded-lg bg-white px-6 py-4 shadow-md sm:max-w-md dark:bg-gray-800">
        {children}
      </div>
    </div>
  );
}
