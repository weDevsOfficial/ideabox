import React from 'react';

import FrontendLayout from '@/Layouts/FrontendLayout';
import { Head } from '@inertiajs/react';
import VoteButton from '@/Components/VoteButton';
import { BoardType, PageProps, PostType } from '@/types';
import CommentBox from '@/Components/CommentBox';
import Comments from '@/Components/Comments';

type Props = {
  post: PostType;
  board: BoardType;
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  const month = d.toLocaleString('default', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();

  return `${month} ${day}, ${year}`;
};

const Post = ({ auth, post, board }: PageProps<Props>) => {
  return (
    <div>
      <Head title="Post" />

      <div className="flex gap-8 mb-8">
        <div className="w-72">
          <div className="px-4 py-4 border rounded">
            <h3 className="text-base font-semibold mb-3">Voters</h3>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center mb-6">
            <div className="mr-3">
              <VoteButton post={post} board={board} auth={auth} />
            </div>

            <div className="flex flex-col flex-1">
              <div className="text-xl font-semibold">{post.title}</div>
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

          <Comments board={board} post={post} auth={auth} />
        </div>
      </div>
    </div>
  );
};

Post.layout = (page: React.ReactNode) => (
  <FrontendLayout children={page}></FrontendLayout>
);

export default Post;
