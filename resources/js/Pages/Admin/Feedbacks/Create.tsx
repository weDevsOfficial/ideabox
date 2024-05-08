import { useState } from 'react';
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
import { User } from '@/types';
import axios from 'axios';
import UserSearchDropdown from '@/Components/UserSearchDropdown';
import CreateUserModal from '@/Components/CreateUserModal';

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
  const [showUserForm, setShowUserForm] = useState(false);
  const [behalfUser, setBehalfUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
  });

  const form = useForm({
    title: '',
    body: '',
    board_id: '',
    status_id: '',
    behalf_id: null,
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
          <div className="mb-4 border bg-slate-50 p-3 rounded dark:bg-slate-800 dark:border-gray-700 dark:text-gray-300">
            <div className="block text-sm font-medium leading-6 text-gray-900 mb-2 dark:text-gray-200">
              Post on behalf of a user (optional)
            </div>
            <UserSearchDropdown
              selectedUser={behalfUser}
              onCreate={() => setShowUserForm(true)}
              onSelect={(user) => {
                setBehalfUser(user);
                form.setData('behalf_id', user.id);
              }}
              onClear={() => form.setData('behalf_id', null)}
            />
          </div>

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

      <CreateUserModal
        show={showUserForm}
        onClose={() => setShowUserForm(false)}
        onSubmit={(data) => {
          setBehalfUser(data);
          form.setData('behalf_id', data.id);
        }}
      />
    </Modal>
  );
};

export default CreateModal;
