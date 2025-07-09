import React from 'react';
import { Link } from '@inertiajs/react';

import { BoardType } from '@/types';

type Props = {
  boards: BoardType[];
};

const HomeBoardList = ({ boards }: Props) => {
  return (
    <div>
      <h2 className="text-base font-semibold dark:text-gray-300">Boards</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <div key={board.id}>
            <Link
              href={route('board.show', board.slug)}
              className="flex items-center justify-between rounded-md border bg-white px-4 py-3 font-semibold text-gray-900 transition-colors duration-200 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <div className="text-sm">{board.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {board.posts}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeBoardList;
