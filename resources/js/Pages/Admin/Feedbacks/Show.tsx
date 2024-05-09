import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Button,
  Checkbox,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SelectInput,
  Textarea,
} from '@wedevs/tail-react';
import {
  ArrowTopRightOnSquareIcon,
  ChevronUpIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  TrashIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/utils';
import { PostType, StatusType, BoardType, VoteType, User } from '@/types';
import Comments from '@/Components/Comments';
import classNames from 'classnames';
import UserSearchDropdown from '@/Components/UserSearchDropdown';
import CreateUserModal from '@/Components/CreateUserModal';
import EditFeedback from './EditFeedback';
import ActionMenu from '@/Components/ActionMenu';
import MergeFeedback from '@/Pages/Admin/Feedbacks/MergeFeedback';

type Props = {
  post: PostType;
  statuses: StatusType[];
  boards: BoardType[];
  votes: VoteType[];
};

type VoteProps = {
  show: boolean;
  onClose: () => void;
  post: PostType;
};

const FeedbackShow = ({ post, statuses, boards, votes }: Props) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMergeForm, setShowMergeForm] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showVoteModal, setShowVoteModal] = useState(false);
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

          <div className="text-xl font-semibold dark:text-gray-300 mb-4 ml-12">
            {localPost.title}
            {post.merged_with_post && (
              <span className="text-sm text-gray-500 ml-2">
                (Merged with{' '}
                <Link
                  href={route('admin.feedbacks.show', {
                    post: post.merged_with_post.slug,
                  })}
                  className="text-blue-500"
                >
                  {post.merged_with_post.title}
                </Link>
                )
              </span>
            )}
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
              <div className="text-sm font-semibold dark:text-gray-300 mb-3">
                {localPost.creator?.name}
              </div>

              <div
                className="text-sm text-gray-800 dark:text-gray-300 mb-3"
                dangerouslySetInnerHTML={{ __html: localPost.body }}
              ></div>

              <div className="flex text-xs text-gray-500 gap-4 items-center">
                {localPost.by && (
                  <div className="text-xs">Created by {localPost.by?.name}</div>
                )}

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

        <div className="sm:w-96 sm:border-l sm:pl-5 border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="">
              <Button
                as="a"
                href={route('post.show', {
                  board: post.board?.slug,
                  post: post.slug,
                })}
                variant="secondary"
                className="inline-flex"
                target="_blank"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                View
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ActionMenu
                menuItems={[
                  {
                    label: 'Merge',
                    onClick: () => setShowMergeForm(true),
                  },
                  {
                    label: 'Edit',
                    onClick: () => setShowEditForm(true),
                  },
                  {
                    label: 'Delete',
                    onClick: () => {
                      if (
                        confirm(
                          'Are you sure you want to delete this feedback? This action cannot be undone.'
                        )
                      ) {
                        form.delete(
                          route('admin.feedbacks.destroy', {
                            post: post.slug,
                          })
                        );
                      }
                    },
                  },
                ]}
              />
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

          <div className="mt-8 py-4">
            <div className="flex items-center justify-between mb-3">
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
                    <li key={vote.id} className="flex items-center mb-2">
                      <div className="mr-3">
                        <img
                          src={vote.user.avatar}
                          className="rounded-full h-7 w-7"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm dark:text-gray-300 font-semibold">
                          {vote.user.name}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {localPost.vote > 10 && (
                  <div className="text-sm text-gray-500 mt-2">
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

      <MergeFeedback
        post={localPost}
        isOpen={showMergeForm}
        onClose={() => setShowMergeForm(false)}
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
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        Feedback
      </h2>
    }
  ></AuthenticatedLayout>
);

const VoteModal = ({ show, onClose, post }: VoteProps) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<null | User>(null);
  const form = useForm({
    user_id: '',
  });

  const submitVote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(route('admin.feedbacks.vote', [post]), {
      onSuccess: () => {
        onClose();
        form.reset();
        setSelectedUser(null);
      },
    });
  };

  const onSelect = (user: User) => {
    form.setData('user_id', user.id.toString());
    setSelectedUser(user);
  };

  const onUserCreate = (user: User) => {
    form.setData('user_id', user.id.toString());
    setSelectedUser(user);
  };

  return (
    <Modal isOpen={show} onClose={onClose}>
      <form onSubmit={submitVote}>
        <ModalHeader>Add Voter</ModalHeader>

        <ModalBody className="min-h-20">
          <UserSearchDropdown
            onSelect={onSelect}
            onCreate={() => setShowUserModal(true)}
            onClear={() => form.setData('user_id', '')}
            selectedUser={selectedUser}
          />
        </ModalBody>

        <ModalActions>
          <Button
            className="ml-2"
            type="submit"
            disabled={form.data.user_id === '' || form.processing}
          >
            Add Vote
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </ModalActions>
      </form>

      <CreateUserModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSubmit={onUserCreate}
      />
    </Modal>
  );
};

export default FeedbackShow;
