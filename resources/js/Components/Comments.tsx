import { BoardType, CommentType, PageProps, PostType, User } from '@/types';
import React, { useEffect, useState } from 'react';

import { formatDate } from '@/utils';
import CommentBox from './CommentBox';
import classNames from 'classnames';

type CommentsProps = {
  post: PostType;
  board: BoardType;
};

type CommentProps = {
  comment: CommentType;
  post: PostType;
  parentId?: number;
};

const Comments: React.FC<CommentsProps> = ({ post }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [sort, setSort] = useState('latest');
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
    setComments([comment, ...comments]);
  };

  return (
    <div className="mt-8">
      <div className="mb-8 ml-12">
        <CommentBox post={post} onComment={appendToComments} />
      </div>

      {comments.length > 0 && !isFetching && (
        <div className="flex justify-between items-center text-gray-700 ml-12 mb-8 pb-4 border-b">
          <h3 className="text-lg font-semibold">Comments</h3>

          <div className="flex items-center">
            <div className="text-sm mr-2">Sort By</div>
            <select
              className="px-2 min-w-28 text-sm py-1.5 rounded border border-gray-200"
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
          <Comment key={comment.id} post={post} comment={comment} />
        ))}
      </div>
    </div>
  );
};

const Comment = ({ post, comment, parentId }: CommentProps) => {
  const [showReplyBox, setShowReplyBox] = useState(false);

  const toggleReplyBox = () => {
    setShowReplyBox(!showReplyBox);
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
          <div className="font-semibold">{comment.user?.name}</div>
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
        <div className="text-sm text-gray-800 mb-2">{comment.body}</div>
        <div className="flex text-xs text-gray-500">
          <div className="">{formatDate(comment.created_at)}</div>
          <div className="mx-1">•</div>
          <div
            className="cursor-pointer hover:text-gray-800"
            onClick={toggleReplyBox}
          >
            Reply
          </div>
        </div>

        {comment.children.length > 0 && (
          <div className="mt-3">
            {comment.children.map((child) => (
              <Comment
                key={child.id}
                post={post}
                comment={child}
                parentId={comment.id}
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
