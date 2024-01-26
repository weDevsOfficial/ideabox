import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button, Checkbox, SelectInput, Textarea } from '@wedevs/tail-react';
import {
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/utils';
import { PostType, StatusType, BoardType } from '@/types';
import Comments from '@/Components/Comments';
import classNames from 'classnames';

type Props = {
  post: PostType;
  statuses: StatusType[];
  boards: BoardType[];
};

const FeedbackShow = ({ post, statuses, boards }: Props) => {
  const [localPost, setLocalPost] = useState(post);
  const form = useForm({
    status_id: post.status_id,
    board_id: post.board_id,
    comment: '',
    notify: true,
  });

  const statusOptions = [
    { value: '- Select Status -', key: '' },
    ...statuses.map((status) => ({
      value: status.name,
      key: status.id.toString(),
    })),
  ];

  const boardOptions = boards.map((board) => ({
    value: board.name,
    key: board.id.toString(),
  }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(route('admin.feedbacks.update', [post]), {
      onSuccess: (resp) => {
        console.log(resp);
        form.reset();
      },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow sm:rounded-lg p-6">
      <Head title={post.title} />

      <div className="sm:flex gap-6">
        <div className="flex-1">
          <Link
            className="flex mb-6 items-center text-sm text-gray-600 "
            href={route('admin.feedbacks.index')}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Link>

          <div className="text-xl font-semibold mb-4 ml-12">
            {localPost.title}
          </div>

          <div className="flex mb-6">
            <div className="relative w-9 mr-3">
              <img
                src={localPost.creator?.avatar}
                className={classNames(
                  'rounded-full h-7 w-7',
                  localPost.creator?.role === 'admin'
                    ? 'ring-2 ring-indigo-500'
                    : ''
                )}
              />

              {localPost.creator?.role === 'admin' && (
                <div className="absolute top-0 right-0 h-3 w-3 bg-indigo-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold mb-3">
                {localPost.creator?.name}
              </div>
              <div className="text-sm text-gray-800 mb-3">{localPost.body}</div>

              <div className="flex text-xs text-gray-500 gap-4 items-center">
                <div className="text-xs">
                  {formatDate(localPost.created_at)}
                </div>

                <div>
                  <ChevronUpIcon className="h-4 w-4 inline-block mr-1.5" />
                  <span>{localPost.vote}</span>
                </div>

                <div>
                  <ChatBubbleLeftIcon className="h-4 w-4 inline-block mr-1.5" />
                  <span>{localPost.comments}</span>
                </div>
              </div>
            </div>
          </div>

          <Comments post={localPost} board={localPost.board} />
        </div>

        <div className="sm:w-96 sm:border-l sm:pl-5 border-gray-100">
          <Button
            as="a"
            href={route('post.show', {
              board: post.board?.slug,
              post: post.slug,
            })}
            variant="secondary"
            className="inline-flex mb-4"
            target="_blank"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
            View Feedback
          </Button>

          <form onSubmit={onSubmit}>
            <SelectInput
              label="Board"
              selectedKey={form.data.board_id.toString()}
              options={boardOptions}
              onChange={(option) =>
                form.setData('board_id', Number(option.key))
              }
            />

            <SelectInput
              label="Status"
              selectedKey={form.data.status_id?.toString()}
              options={statusOptions}
              onChange={(option) =>
                form.setData('status_id', Number(option.key))
              }
            />

            {form.data.status_id !== localPost.status_id && (
              <>
                <Textarea
                  label="Comment"
                  value={form.data.comment}
                  onChange={(value) => form.setData('comment', value)}
                  placeholder="Add an update comment (optional)"
                  wrapperClassName="mt-4"
                />

                <Checkbox
                  label="Notify all voters"
                  checked={form.data.notify}
                  onChange={(checked) => form.setData('notify', checked)}
                />
              </>
            )}

            {form.isDirty && (
              <div className="text-right">
                <Button type="submit">Save</Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

FeedbackShow.layout = (page: React.ReactNode) => (
  <AuthenticatedLayout
    children={page}
    header={
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        Feedback
      </h2>
    }
  ></AuthenticatedLayout>
);

export default FeedbackShow;
