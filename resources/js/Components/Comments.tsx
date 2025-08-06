import React, { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

import CommentBox from './CommentBox';
import Comment from '@/Components/Comment';
import { BoardType, CommentType, PageProps, PostType } from '@/types';
import { Button } from '@wedevs/tail-react';

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
        }),
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

  const handleUnmerge = (comment: CommentType) => {
    const sourcePostId = comment.body.match(/#(\d+)/)?.[1];

    if (sourcePostId) {
      router.post(
        route('admin.feedbacks.unmerge', { post: sourcePostId }),
        {},
        {
          onSuccess: () => {
            // You might want to refresh the page or update the state accordingly
          },
        },
      );
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-8 ml-12">
        {auth.user && <CommentBox post={post} onComment={appendToComments} />}

        {!auth.user && (
          <div className="rounded border bg-gray-50 py-4 text-center text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
        <div className="mb-8 ml-12 flex items-center justify-between border-b pb-4 text-gray-700 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-gray-300">Comments</h3>

          <div className="flex items-center">
            <div className="mr-2 text-sm dark:text-gray-400">Sort By</div>
            <select
              className="min-w-28 rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
