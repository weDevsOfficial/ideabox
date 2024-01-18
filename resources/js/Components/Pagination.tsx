import React from 'react';
import { Link } from '@inertiajs/react';
import classnames from 'classnames';
import { PaginatedLink } from '@/types';

type Props = {
  links: PaginatedLink[];
};

const Pagination = ({ links }: Props) => {
  return (
    <div className="isolate inline-flex -space-x-px rounded-md shadow-sm">
      {links.map((link, index) => {
        const linkClasses = classnames(
          'inline-flex px-4 py-2 text-sm font-semibold focus:outline-offset-0',
          link.active
            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            : 'hover:bg-gray-50 ring-1 ring-inset ring-gray-300 text-gray-900',
          {
            'text-gray-400 border-gray-300': !link.url,
          }
        );

        return (
          <Link
            key={index}
            href={link.url}
            className={linkClasses}
            dangerouslySetInnerHTML={{ __html: link.label }}
            onClick={(e) => {
              if (!link.url) e.preventDefault();
            }}
            preserveScroll
          />
        );
      })}
    </div>
  );
};

export default Pagination;
