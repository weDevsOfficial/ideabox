import React from 'react';
import { Head, Link } from '@inertiajs/react';

import FrontendLayout from '@/Layouts/FrontendLayout';
import VoteButton from '@/Components/VoteButton';
import { BoardType, PageProps, PostType, StatusType, VoteType } from '@/types';
import Comments from '@/Components/Comments';
import { formatDate } from '@/utils';

type Props = {
  post: PostType;
  board: BoardType;
  status: null | StatusType;
  votes: VoteType[];
};

const Post = ({ post, status, board, votes }: PageProps<Props>) => {
  return (
    <div>
      <Head title="Post" />

      <div className="flex gap-8 mb-8">
        <div className="w-72">
          <div className="px-4 py-4 border rounded">
            <h3 className="text-base font-semibold mb-3">Voters</h3>

            {votes.length > 0 ? (
              <>
                <ul>
                  {votes.map((vote) => (
                    <li key={vote.id} className="flex items-center mb-2">
                      <div className="mr-3">
                        <img
                          src={vote.user.avatar}
                          className="rounded-full h-7 w-7"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {vote.user.name}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {post.vote > 10 && (
                  <div className="text-sm text-gray-500 mt-2">
                    + {post.vote - 10} more votes
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">No voters yet.</div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center mb-6">
            <div className="mr-3">
              <VoteButton post={post} />
            </div>

            <div className="flex flex-col flex-1">
              <div className="text-xl font-semibold mb-2">{post.title}</div>
              <div className="flex text-sm text-gray-500">
                {status && (
                  <>
                    <span
                      className="uppercase font-bold"
                      style={{
                        color: status.color,
                      }}
                    >
                      {status.name}
                    </span>
                    <span className="mx-1">·</span>
                  </>
                )}{' '}
                <Link
                  href={route('board.show', board.slug)}
                  className="hover:text-gray-800"
                >
                  {board.name}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex mb-6">
            <div className="w-9 mr-3">
              <img
                src={post.creator?.avatar}
                className="rounded-full h-7 w-7"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold mb-3">
                {post.creator?.name}
              </div>
              <div className="text-sm text-gray-800 mb-3">{post.body}</div>
              <div className="text-xs text-gray-500">
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>

          <Comments board={board} post={post} />
        </div>
      </div>
    </div>
  );
};

Post.layout = (page: React.ReactNode) => (
  <FrontendLayout children={page}></FrontendLayout>
);

export default Post;
