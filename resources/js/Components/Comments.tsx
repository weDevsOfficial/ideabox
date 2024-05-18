import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import classNames from 'classnames';
import { usePage } from '@inertiajs/react';

import { BoardType, CommentType, PageProps, PostType, User } from '@/types';
import { formatDate } from '@/utils';
import CommentBox from './CommentBox';

type CommentsProps = {
  post: PostType;
  board: BoardType;
};

type CommentProps = {
  comment: CommentType;
  post: PostType;
  parentId?: number;
  onCommentDelete: (commentId: number) => void;
};

const Comments: React.FC<CommentsProps> = ({ post }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [sort, setSort] = useState('latest');
  const [isFetching, setIsFetching] = useState(false);

  const fetchComments = useCallback( async () => {
      setIsFetching(true);

      if (post.merged_with_post){
        return;
      }
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
    }, [sort, post]);

  useEffect(() => {
    fetchComments();
  }, [sort, post]);

  const appendToComments = (comment: CommentType) => {
    setComments([comment, ...comments]);
  };

  return (
    <div className="mt-8">
      <div className="mb-8 ml-12">
        <CommentBox post={post} onComment={appendToComments} />
      </div>

      {comments.length > 0 && !isFetching && (
        <div className="flex justify-between items-center text-gray-700 ml-12 mb-8 pb-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-gray-300">Comments</h3>

          <div className="flex items-center">
            <div className="text-sm mr-2 dark:text-gray-400">Sort By</div>
            <select
              className="px-2 min-w-28 text-sm py-1.5 rounded border border-gray-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
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

const Comment = ({
  post,
  comment,
  parentId,
  onCommentDelete,
}: CommentProps) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const { auth } = usePage<PageProps>().props;

  const toggleReplyBox = () => {
    setShowReplyBox(!showReplyBox);
  };

  const deleteComment = (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    axios
      .delete(route('admin.comments.destroy', [commentId]))
      .then(() => {
        onCommentDelete(commentId);
      })
      .catch((error) => {
        alert(error.response.data.message);
      });
  };

  return (
    <div className="flex py-3">
      <div className="w-9 mr-3">
        <img
          src={comment.user?.avatar}
          className={classNames(
            'rounded-full h-7 w-7',
            comment.user?.role === 'admin' ? 'ring-2 ring-indigo-500' : ''
          )}
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center text-sm mb-2">
          <div className="font-semibold dark:text-gray-300">
            {comment.user?.name}
          </div>
          {comment.status && (
            <div className="text-sm text-gray-700 ml-2">
              <span>marked this post as</span>
              <span
                className="uppercase text-xs font-bold ml-2 text-white px-2 py-1 rounded"
                style={{ backgroundColor: comment.status.color }}
              >
                {comment.status.name}
              </span>
            </div>
          )}
        </div>
        <div
          className="text-sm text-gray-800 dark:text-gray-300 mb-2"
          dangerouslySetInnerHTML={{ __html: comment.body }}
        ></div>
        <div className="flex text-xs text-gray-500">
          <div className="">{formatDate(comment.created_at)}</div>
          <div className="mx-1">•</div>
          <div
            className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
            onClick={toggleReplyBox}
          >
            Reply
          </div>
          {auth.user?.role === 'admin' && (
            <>
              <div className="mx-1">•</div>
              <div className="">
                <button
                  className="text-xs text-red-500 dark:text-red-300"
                  onClick={() => deleteComment(comment.id)}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {comment.children.length > 0 && (
          <div className="mt-3">
            {comment.children.map((child) => (
              <Comment
                key={child.id}
                post={post}
                comment={child}
                parentId={comment.id}
                onCommentDelete={() => {}}
              />
            ))}
          </div>
        )}

        {showReplyBox && (
          <div className="mt-4">
            <CommentBox post={post} parent={parentId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
