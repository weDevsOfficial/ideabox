import React from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

import { RoadmapType, PostType, BoardType } from '@/types';
import { Link } from '@inertiajs/react';

type Props = {
  boards: BoardType[];
  roadmaps: RoadmapType[];
  posts: PostType[];
};

const HomeRoadmap = ({ roadmaps, posts, boards }: Props) => {
  const postsByRoadmapId = (roadmapId: number) => {
    return posts.filter((post) => post.status_id === roadmapId);
  };

  const getBoardNameById = (boardId: number) => {
    return boards.find((board) => board.id === boardId)?.name;
  };

  return (
    <>
      <h2 className="text-base font-semibold mt-8 mb-4">Roadmap</h2>

      <div className="grid grid-cols-3 gap-4">
        {roadmaps.map((roadmap) => (
          <div key={roadmap.id} className="border border-gray-300 rounded-md">
            <div className="flex items-center px-4 py-3 border-b border-gray-300">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: roadmap.color }}
              ></div>
              <div className="text-sm font-semibold">{roadmap.name}</div>
            </div>

            <div className="px-4 pb-4 min-h-80 h-[500px] overflow-y-auto">
              {postsByRoadmapId(roadmap.id).map((post) => (
                <div key={post.id} className="flex mt-6">
                  <button className="flex flex-col self-start w-9 mr-4 rounded-md border border-gray-300 py-2 items-center hover:bg-gray-100">
                    <ChevronUpIcon className="h-3 w-3 text-gray-400 mb-1" />
                    <span className="text-xs">{post.vote}</span>
                  </button>

                  <Link
                    href={route('post.show', ['feature-request', post.slug])}
                    className="flex flex-col flex-1 group"
                  >
                    <div className="mb-1.5 text-sm font-semibold text-gray-700 group-hover:text-indigo-600">
                      {post.title}
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">
                      {getBoardNameById(post.board_id)}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default HomeRoadmap;
