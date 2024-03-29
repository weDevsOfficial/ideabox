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
    <>
      <h2 className="text-base font-semibold mt-8 mb-4 dark:text-gray-300">
        Roadmap
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {roadmaps.map((roadmap) => (
          <div
            key={roadmap.id}
            className="border border-gray-300 dark:border-gray-700 rounded-md"
          >
            <div className="flex items-center px-4 py-3 border-b border-gray-300 dark:border-gray-700">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: roadmap.color }}
              ></div>
              <div className="text-sm font-semibold dark:text-gray-300">
                {roadmap.name}
              </div>
            </div>

            <div className="px-4 pb-4 min-h-80 h-[500px] overflow-y-auto">
              {postsByRoadmapId(roadmap.id).map((post) => {
                let board = getBoardById(post.board_id);

                return (
                  <div key={post.id} className="flex mt-6">
                    <div className="mr-4">
                      <VoteButton post={post} />
                    </div>

                    <Link
                      href={route('post.show', [board?.slug, post.slug])}
                      className="flex flex-col flex-1 group"
                    >
                      <div className="mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-500 uppercase font-semibold">
                        {board?.name}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default HomeRoadmap;
