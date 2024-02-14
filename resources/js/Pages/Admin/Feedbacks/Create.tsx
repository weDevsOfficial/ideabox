import React from 'react';
import { useForm } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  SelectInput,
  TextField,
  Textarea,
} from '@wedevs/tail-react';

type Option = {
  value: string;
  key: string;
};

type Props = {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  onSubmit?: () => void;
  statuses: Option[];
  boards: Option[];
};

const CreateModal = ({
  showModal,
  setShowModal,
  onSubmit,
  statuses,
  boards,
}: Props) => {
  const form = useForm({
    title: '',
    body: '',
    board_id: '',
    status_id: '',
  });

  const statusOptions = statuses.map((status) => ({
    value: status.key === 'all' ? '- Select - ' : status.value,
    key: status.key === 'all' ? '' : status.key,
  }));

  const boardOptions = boards.map((board) => ({
    value: board.key === 'all' ? '- Select - ' : board.value,
    key: board.key === 'all' ? '' : board.key,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    form.post(route('admin.feedbacks.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowModal(false);
        form.reset();
      },
    });

    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Create Feedback</ModalHeader>
        <ModalBody>
          <TextField
            label="Title"
            name="title"
            placeholder="Enter a short title"
            required={true}
            value={form.data.title}
            onChange={(value) => form.setData('title', value)}
            error={form.errors.title}
          />

          <Textarea
            label="Details"
            name="body"
            placeholder="Enter the details of the feature"
            required={true}
            value={form.data.body}
            onChange={(value) => form.setData('body', value)}
            error={form.errors.body}
          />

          <SelectInput
            label="Status"
            options={statusOptions}
            onChange={(option) => form.setData('status_id', option.key)}
            error={form.errors.status_id}
          />
          <SelectInput
            label="Board"
            options={boardOptions}
            onChange={(option) => form.setData('board_id', option.key)}
            error={form.errors.board_id}
          />
        </ModalBody>

        <ModalActions>
          <Button
            type="submit"
            variant="primary"
            disabled={form.processing}
            loading={form.processing}
          >
            Create
          </Button>
          <Button
            onClick={() => setShowModal(false)}
            variant="secondary"
            className="mr-2"
          >
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default CreateModal;
