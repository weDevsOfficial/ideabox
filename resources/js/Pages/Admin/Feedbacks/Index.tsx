import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button, SelectInput, TextField } from '@wedevs/tail-react';
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
  hasOpenAIKey: boolean;
};

const Feedbacks = ({ posts, boards, statuses, hasOpenAIKey }: Props) => {
  const urlParams = new URLSearchParams(window.location.search);

  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    urlParams.get('status') || 'all',
  );
  const [selectedBoard, setSelectedBoard] = useState(
    urlParams.get('board') || 'all',
  );
  const [sortKey, setSortKey] = useState(urlParams.get('sort') || 'voted');
  const [search, setSearch] = useState(urlParams.get('search') || '');

  const sortOptions = [
    { value: 'Latest', key: 'latest' },
    { value: 'Oldest', key: 'oldest' },
    { value: 'Top Voted', key: 'voted' },
    { value: 'Most Commented', key: 'commented' },
  ];

  const statusOptions = [
    { value: 'All', key: 'all' },
    { value: 'Open', key: 'open' },
    { value: 'No Status', key: 'none' },
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
        search: search || undefined,
      }),
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Feedback
          </h2>

          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
            className="inline-flex items-center"
          >
            <PlusIcon className="mr-1.5 inline-block h-4 w-4" />
            Create Feedback
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden bg-white shadow sm:rounded-lg dark:bg-gray-800">
        <Head title="Feedbacks" />

        <CreateModal
          showModal={showModal}
          setShowModal={setShowModal}
          statuses={statusOptions}
          boards={boardOptions}
          hasOpenAIKey={hasOpenAIKey}
        />

        <div className="p-6 text-gray-900 dark:text-gray-100">
          <div className="gap-6 sm:flex">
            <div className="border-gray-100 sm:w-52 sm:border-r sm:pr-5 dark:border-gray-700">
              <SelectInput
                label="Sort By"
                selectedKey={sortKey}
                options={sortOptions}
                onChange={(option) => setSortKey(option.key)}
              />

              <TextField
                label="Search"
                value={search}
                placeholder="Search feedbacks..."
                onChange={(value) => setSearch(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') filterRequest();
                }}
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
                  className="flex justify-between rounded p-4 hover:bg-slate-50 hover:dark:bg-slate-900"
                >
                  <Link
                    href={route('admin.feedbacks.show', [post])}
                    className="flex flex-1 flex-col"
                    playsInline
                  >
                    <div className="mb-1 text-sm font-semibold">
                      {post.title}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <div>
                        <ChevronUpIcon className="mr-1.5 inline-block h-4 w-4" />
                        <span>{post.vote}</span>
                      </div>

                      <div>
                        <ChatBubbleLeftIcon className="mr-1.5 inline-block h-4 w-4" />
                        <span>{post.comments}</span>
                      </div>

                      <div>{post.board?.name}</div>

                      {post.status_id && (
                        <div
                          className="rounded px-1.5 py-0.5 text-xs font-bold uppercase text-white"
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

              {posts.data.length === 0 && (
                <div className="mt-4">
                  <p className="text-gray-500">No feedbacks found.</p>
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
