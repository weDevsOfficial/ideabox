import React, { useState } from 'react';
import axios from 'axios';
import classNames from 'classnames';
import { usePage } from '@inertiajs/react';

import { CommentType, PageProps, PostType, User } from '@/types';
import { formatDate } from '@/utils';
import CommentBox from './CommentBox';

type CommentProps = {
  comment: CommentType;
  post: PostType;
  onCommentDelete: (commentId: number) => void;
  level?: number;
};

const Comment = ({
  post,
  comment,
  onCommentDelete,
  level = 0,
}: CommentProps) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const { auth } = usePage<PageProps>().props;
  const [commentState, setCommentState] = useState<CommentType>(comment);

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

  const appendComment = (comment: CommentType) => {
    setCommentState({
      ...commentState,
      children: [...commentState.children, comment],
    });

    setShowReplyBox(false);
  };

  return (
    <div className="flex py-3">
      <div className="mr-3 w-9">
        <img
          src={commentState.user?.avatar}
          className={classNames(
            'h-7 w-7 rounded-full',
            commentState.user?.role === 'admin' ? 'ring-2 ring-indigo-500' : '',
          )}
        />
      </div>

      <div className="flex-1">
        <div className="mb-2 flex items-center text-sm">
          <div className="font-semibold dark:text-gray-300">
            {commentState.user?.name}
          </div>
          {commentState.status && (
            <div className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              <span>marked this post as</span>
              <span
                className="ml-2 rounded px-2 py-1 text-xs font-bold uppercase text-white"
                style={{ backgroundColor: commentState.status.color }}
              >
                {commentState.status.name}
              </span>
            </div>
          )}
        </div>
        <div
          className="comment-body mb-2 text-sm text-gray-800 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: commentState.body }}
        ></div>
        <div className="flex text-xs text-gray-500">
          <div className="">{formatDate(commentState.created_at)}</div>

          {(level === 0 || level === 1) && auth.user !== null && (
            <>
              <div className="mx-1">•</div>
              <div
                className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300"
                onClick={(_) => setShowReplyBox((prev) => !prev)}
              >
                Reply
              </div>
            </>
          )}

          {auth.user?.role === 'admin' && (
            <>
              <div className="mx-1">•</div>
              <div className="">
                <button
                  className="text-xs text-red-500 dark:text-red-300"
                  onClick={() => deleteComment(commentState.id)}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {commentState.children.length > 0 && (
          <div className="mt-3">
            {commentState.children.map((child) => (
              <Comment
                key={child.id}
                post={post}
                comment={child}
                level={level + 1}
                onCommentDelete={() => {}}
              />
            ))}
          </div>
        )}

        {showReplyBox && (
          <div className="mt-4">
            <CommentBox
              post={post}
              parent={comment.id}
              onComment={appendComment}
              focus={showReplyBox}
              onCancel={() => setShowReplyBox(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
