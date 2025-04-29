import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

import CommentBox from './CommentBox';
import Comment from '@/Components/Comment';
import { BoardType, CommentType, PageProps, PostType } from '@/types';

type CommentsProps = {
  post: PostType;
  board: BoardType;
};

const Comments: React.FC<CommentsProps> = ({ post }) => {
  const { auth } = usePage<PageProps>().props;
  const [comments, setComments] = useState<CommentType[]>([]);
  const [sort, setSort] = useState<'latest' | 'oldest'>('oldest');
  const [isFetching, setIsFetching] = useState(false);

  const fetchComments = async () => {
    setIsFetching(true);

    try {
      const response = await fetch(
        route('post.comments.index', {
          post: post.slug,
          sort: sort,
        })
      );

      const data = await response.json();
      setIsFetching(false);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [sort]);

  const appendToComments = (comment: CommentType) => {
    setComments([...comments, comment]);
  };

  return (
    <div className="mt-8">
      <div className="mb-8 ml-12">
        {auth.user && <CommentBox post={post} onComment={appendToComments} />}

        {!auth.user && (
          <div className="border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 py-4 text-sm text-center text-gray-700 dark:text-gray-300">
            <Link href={route('login')} className="underline">
              Log in
            </Link>{' '}
            or{' '}
            <Link href={route('register')} className="underline">
              register
            </Link>{' '}
            to leave a comment
          </div>
        )}
      </div>

      {comments.length > 0 && !isFetching && (
        <div className="flex justify-between items-center text-gray-700 ml-12 mb-8 pb-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-gray-300">Comments</h3>

          <div className="flex items-center">
            <div className="text-sm mr-2 dark:text-gray-400">Sort By</div>
            <select
              className="px-2 text-gray-700 dark:text-gray-300 dark:bg-gray-800 min-w-28 text-sm py-1.5 rounded border border-gray-200 dark:border-gray-700"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'latest' | 'oldest')}
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-4">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            post={post}
            comment={comment}
            onCommentDelete={() => {
              setComments(comments.filter((c) => c.id !== comment.id));
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Comments;
