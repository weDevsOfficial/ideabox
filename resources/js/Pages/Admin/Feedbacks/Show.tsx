import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Button,
  Checkbox,
  SelectInput,
  Textarea,
  Tooltip,
} from '@wedevs/tail-react';
import classNames from 'classnames';
import {
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/utils';
import { PostType, StatusType, BoardType, VoteType } from '@/types';
import Comments from '@/Components/Comments';
import EditFeedback from './EditFeedback';
import GitHubIssueLinker from '@/Components/GitHub/GitHubIssueLinker';
import { IntegrationRepository, PostIntegrationLink } from '@/types';
import MergePostModal from '@/Components/MergePostModal';
import VoteModal from '@/Components/VoteModal';

type Props = {
  post: PostType;
  statuses: StatusType[];
  boards: BoardType[];
  votes: VoteType[];
  repositories: IntegrationRepository[];
  linkedIssues: PostIntegrationLink[];
};

const FeedbackShow = ({
  post,
  statuses,
  boards,
  votes,
  repositories,
  linkedIssues,
}: Props) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const form = useForm({
    status_id: post.status_id,
    board_id: post.board_id,
    comment: '',
    notify: true,
  });

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

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
        form.reset();
      },
    });
  };

  const hasGitHubIntegration = repositories.length > 0;

  return (
    <div className="overflow-hidden bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
      <Head title={post.title} />

      <div className="gap-6 sm:flex">
        <div className="flex-1">
          <Link
            className="mb-6 flex items-center text-sm text-gray-600"
            href={route('admin.feedbacks.index')}
          >
            <ChevronLeftIcon className="mr-2 h-5 w-5" />
            Back
          </Link>

          <div className="mb-4 ml-12 text-xl font-semibold dark:text-gray-300">
            {localPost.title}
          </div>

          <div className="mb-6 flex">
            <div className="relative mr-3 w-9">
              <img
                src={localPost.creator?.avatar}
                className={classNames(
                  'h-7 w-7 rounded-full',
                  localPost.creator?.role === 'admin'
                    ? 'ring-2 ring-indigo-500'
                    : '',
                )}
              />

              {localPost.creator?.role === 'admin' && (
                <div className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-indigo-500"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-3 text-sm font-semibold dark:text-gray-300">
                {localPost.creator?.name}
              </div>

              <div
                className="mb-3 text-sm text-gray-800 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: localPost.body }}
              ></div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {localPost.by && (
                  <div className="text-xs">Created by {localPost.by?.name}</div>
                )}

                <div className="text-xs">
                  {formatDate(localPost.created_at)}
                </div>

                <div>
                  <ChevronUpIcon className="mr-1.5 inline-block h-4 w-4" />
                  <span>{localPost.vote}</span>
                </div>

                <div>
                  <ChatBubbleLeftIcon className="mr-1.5 inline-block h-4 w-4" />
                  <span>{localPost.comments}</span>
                </div>
              </div>
            </div>
          </div>

          <Comments post={localPost} board={localPost.board} />
        </div>

        <div className="border-gray-100 sm:w-96 sm:border-l sm:pl-5 dark:border-gray-700">
          <div className="mb-4 border-b border-gray-100 pb-4 dark:border-gray-700">
            <div className="flex justify-between gap-2">
              {/* Edit and Merge Button Group */}
              <div className="flex">
                <Button
                  as="a"
                  href={route('post.show', {
                    board: post.board?.slug,
                    post: post.slug,
                  })}
                  variant="secondary"
                  className="inline-flex gap-2 rounded-r-none border-r-0"
                  target="_blank"
                >
                  <Tooltip content="View Feedback">
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </Tooltip>
                </Button>
                <Button
                  variant="secondary"
                  className="-ml-px inline-flex gap-2 rounded-l-none rounded-r-none"
                  onClick={() => setShowEditForm(true)}
                >
                  <Tooltip content="Edit Feedback">
                    <PencilSquareIcon className="h-5 w-5" />
                  </Tooltip>
                </Button>

                <Button
                  variant="secondary"
                  className="-ml-px inline-flex gap-2 rounded-l-none"
                  onClick={() => setShowMergeModal(true)}
                >
                  <Tooltip content="Merge Feedback">
                    <ArrowsPointingInIcon className="h-5 w-5" />
                  </Tooltip>
                </Button>
              </div>

              {/* Delete Button - Standalone */}
              <Button
                variant="danger"
                style="outline"
                className="inline-flex"
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to delete this feedback? This action cannot be undone.',
                    )
                  ) {
                    form.delete(
                      route('admin.feedbacks.destroy', {
                        post: post.slug,
                      }),
                    );
                  }
                }}
              >
                <Tooltip content="Delete Feedback">
                  <TrashIcon className="h-5 w-5" />
                </Tooltip>
              </Button>
            </div>
          </div>

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

          {/* GitHub Integration Section */}
          {hasGitHubIntegration && (
            <GitHubIssueLinker
              post={post}
              repositories={repositories}
              linkedIssues={linkedIssues}
            />
          )}

          {!hasGitHubIntegration && (
            <div className="mt-8">
              <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Complete the{' '}
                <Link
                  href={route('admin.integrations.github.settings')}
                  className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  GitHub integration
                </Link>{' '}
                to link issues to feedbacks.
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold dark:text-gray-300">
                Voters
              </h3>

              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowVoteModal(true)}
              >
                Add Vote
              </Button>
            </div>
            {votes.length > 0 ? (
              <>
                <ul>
                  {votes.map((vote) => (
                    <li key={vote.id} className="mb-2 flex items-center">
                      <div className="mr-3">
                        <img
                          src={vote.user.avatar}
                          className="h-7 w-7 rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold dark:text-gray-300">
                          {vote.user.name}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {localPost.vote > 10 && (
                  <div className="mt-2 text-sm text-gray-500">
                    + {localPost.vote - 10} more votes
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">No voters yet.</div>
            )}
          </div>
        </div>
      </div>

      <VoteModal
        show={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        post={localPost}
      />

      <MergePostModal
        post={post}
        show={showMergeModal}
        onClose={() => setShowMergeModal(false)}
      />

      <EditFeedback
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        post={localPost}
        onUpdate={() => {
          // inertia reload
        }}
      />
    </div>
  );
};

FeedbackShow.layout = (page: React.ReactNode) => (
  <AuthenticatedLayout
    children={page}
    header={
      <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
        Feedback
      </h2>
    }
  ></AuthenticatedLayout>
);

export default FeedbackShow;
