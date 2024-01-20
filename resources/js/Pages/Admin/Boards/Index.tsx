import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SwitchInput,
  TextField,
} from '@wedevs/tail-react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { BoardType } from '@/types';

type Props = {
  boards: BoardType[];
};

const BoardsIndex = ({ boards }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const form = useForm({
    name: '',
  });

  const createBoard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(route('admin.boards.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsModalOpen(false);
        form.reset();
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between">
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Boards
          </h2>

          <Button
            variant="primary"
            className="inline-flex"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            <span>Add Board</span>
          </Button>
        </div>
      }
    >
      <Head title="Boards" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <Link
            key={board.id}
            className="rounded-lg bg-white shadow"
            href={route('admin.boards.show', [board])}
          >
            <div className="space-x-6 p-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">{board.name}</span>
                <span className="text-sm">{board.posts}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={createBoard}>
          <ModalHeader>Add Board</ModalHeader>
          <ModalBody>
            <TextField
              label="Name"
              value={form.data.name}
              onChange={(value) => form.setData('name', value)}
            />
          </ModalBody>
          <ModalActions>
            <Button variant="primary">Add Board</Button>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </AuthenticatedLayout>
  );
};

export default BoardsIndex;
