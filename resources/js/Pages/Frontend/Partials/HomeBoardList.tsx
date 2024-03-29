import React from 'react';
import { Link } from '@inertiajs/react';

import { BoardType } from '@/types';

type Props = {
  boards: BoardType[];
};

const HomeBoardList = ({ boards }: Props) => {
  return (
    <>
      <h2 className="text-base font-semibold dark:text-gray-300">Boards</h2>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {boards.map((board) => (
          <div key={board.id}>
            <Link
              href={route('board.show', board.slug)}
              className="flex py-3 px-4 justify-between items-center font-semibold text-gray-900 dark:text-gray-300 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="text-sm">{board.name}</div>
              <div className="text-xs">{board.posts}</div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
};

export default HomeBoardList;
