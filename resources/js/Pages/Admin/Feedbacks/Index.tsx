import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, SelectInput } from '@wedevs/tail-react';
import {
  ChevronUpIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { BoardType, PaginatedResponse, PostType, StatusType } from '@/types';
import Pagination from '@/Components/Pagination';
import CreateModal from './Create';

type Props = {
  posts: PaginatedResponse<PostType>;
  boards: BoardType[];
  statuses: StatusType[];
};

const Feedbacks = ({ posts, boards, statuses }: Props) => {
  const urlParams = new URLSearchParams(window.location.search);

  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    urlParams.get('status') || 'all'
  );
  const [selectedBoard, setSelectedBoard] = useState(
    urlParams.get('board') || 'all'
  );
  const [sortKey, setSortKey] = useState(urlParams.get('sort') || 'voted');

  const sortOptions = [
    { value: 'Latest', key: 'latest' },
    { value: 'Oldest', key: 'oldest' },
    { value: 'Top Voted', key: 'voted' },
    { value: 'Most Commented', key: 'commented' },
  ];

  const statusOptions = [
    { value: 'All', key: 'all' },
    ...statuses.map((status) => ({
      value: status.name,
      key: status.id.toString(),
    })),
  ];

  const boardOptions = [
    { value: 'All', key: 'all' },
    ...boards.map((board) => ({
      value: board.name,
      key: board.id.toString(),
    })),
  ];

  const filterRequest = () => {
    router.replace(
      route('admin.feedbacks.index', {
        status: selectedStatus,
        board: selectedBoard,
        sort: sortKey,
      })
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Feedback
          </h2>

          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
            className="inline-flex items-center"
          >
            <PlusIcon className="h-4 w-4 inline-block mr-1.5" />
            Create Feedback
          </Button>
        </div>
      }
    >
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow sm:rounded-lg">
        <Head title="Feedbacks" />

        <CreateModal
          showModal={showModal}
          setShowModal={setShowModal}
          statuses={statusOptions}
          boards={boardOptions}
        />

        <div className="p-6 text-gray-900 dark:text-gray-100">
          <div className="sm:flex gap-6">
            <div className="sm:w-52 sm:border-r sm:pr-5 border-gray-100 dark:border-gray-700">
              <SelectInput
                label="Sort By"
                selectedKey={sortKey}
                options={sortOptions}
                onChange={(option) => setSortKey(option.key)}
              />

              <SelectInput
                label="Status"
                selectedKey={selectedStatus || 'all'}
                options={statusOptions}
                onChange={(option) => setSelectedStatus(option.key)}
              />
              <SelectInput
                label="Board"
                selectedKey={selectedBoard || 'all'}
                options={boardOptions}
                onChange={(option) => setSelectedBoard(option.key)}
              />

              <Button
                onClick={filterRequest}
                className="mt-1"
                variant="primary"
                style="outline"
              >
                Apply Filter
              </Button>
            </div>

            <div className="flex-1">
              {posts.data.map((post) => (
                <div
                  key={post.id}
                  className="p-4 flex justify-between hover:bg-slate-50 hover:dark:bg-slate-900 rounded"
                >
                  <Link
                    href={route('admin.feedbacks.show', [post])}
                    className="flex flex-col flex-1"
                    playsInline
                  >
                    <div className="text-sm font-semibold mb-1">
                      {post.title}
                    </div>
                    <div className="flex text-xs text-gray-500 mt-2 gap-4 items-center">
                      <div>
                        <ChevronUpIcon className="h-4 w-4 inline-block mr-1.5" />
                        <span>{post.vote}</span>
                      </div>

                      <div>
                        <ChatBubbleLeftIcon className="h-4 w-4 inline-block mr-1.5" />
                        <span>{post.comments}</span>
                      </div>

                      <div>{post.board?.name}</div>

                      {post.status_id && (
                        <div
                          className="uppercase text-xs font-bold text-white px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: post.status?.color }}
                        >
                          {post.status?.name}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}

              {posts.last_page > 1 && (
                <div className="mt-4">
                  <Pagination links={posts.links} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Feedbacks;
