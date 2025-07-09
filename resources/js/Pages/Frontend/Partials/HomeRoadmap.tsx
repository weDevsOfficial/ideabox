import React from 'react';
import { Link } from '@inertiajs/react';

import { RoadmapType, PostType, BoardType, PageProps, User } from '@/types';
import VoteButton from '@/Components/VoteButton';

type Props = {
  boards: BoardType[];
  roadmaps: RoadmapType[];
  posts: PostType[];
};

const HomeRoadmap = ({ roadmaps, posts, boards }: Props) => {
  const postsByRoadmapId = (roadmapId: number) => {
    return posts.filter((post) => post.status_id === roadmapId);
  };

  const getBoardById = (boardId: number) => {
    return boards.find((board) => board.id === boardId);
  };

  return (
    <div>
      <h2 className="mb-4 mt-6 text-base font-semibold sm:mt-8 dark:text-gray-300">
        Roadmap
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {roadmaps.map((roadmap) => (
          <div
            key={roadmap.id}
            className="flex flex-col rounded-md border border-gray-300 dark:border-gray-700"
          >
            <div className="flex items-center rounded-t-md border-b border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div
                className="mr-2 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: roadmap.color }}
              ></div>
              <div className="truncate text-sm font-semibold dark:text-gray-300">
                {roadmap.name}
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-4 pb-4">
              <div className="max-h-96 space-y-4 overflow-y-auto sm:max-h-[500px]">
                {postsByRoadmapId(roadmap.id).map((post) => {
                  let board = getBoardById(post.board_id);

                  return (
                    <div key={post.id} className="mt-4 flex first:mt-4">
                      <div className="mr-3 flex-shrink-0 sm:mr-4">
                        <VoteButton post={post} />
                      </div>

                      <Link
                        href={route('post.show', [board?.slug, post.slug])}
                        className="group flex min-w-0 flex-1 flex-col"
                      >
                        <div className="mb-1.5 line-clamp-2 text-sm font-semibold text-gray-700 transition-colors duration-200 group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-400">
                          {post.title}
                        </div>
                        <div className="truncate text-xs font-semibold uppercase text-gray-500">
                          {board?.name}
                        </div>
                      </Link>
                    </div>
                  );
                })}

                {postsByRoadmapId(roadmap.id).length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No feedback in this roadmap yet
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeRoadmap;
