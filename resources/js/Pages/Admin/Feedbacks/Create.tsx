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
import { SparklesIcon } from '@heroicons/react/24/outline';

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
  hasOpenAIKey?: boolean;
};

const CreateModal = ({
  showModal,
  setShowModal,
  onSubmit,
  statuses,
  boards,
  hasOpenAIKey = false,
}: Props) => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [behalfUser, setBehalfUser] = useState<User | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const generateDescription = async () => {
    if (!form.data.title) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(
        route('api.generate-feature-description'),
        {
          title: form.data.title,
        }
      );
      form.setData('body', response.data.description);
    } catch (error) {
      console.error('Failed to generate description:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Create Feedback</ModalHeader>
        <ModalBody>
          <div className="mb-4 border bg-slate-50 dark:bg-gray-800 dark:border-slate-700 p-3 rounded">
            <div className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
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

          <div className="space-y-2">
            <Textarea
              label="Details"
              name="body"
              placeholder="Enter the details of the feature"
              required={true}
              value={form.data.body}
              onChange={(value) => form.setData('body', value)}
              error={form.errors.body}
            />
            {hasOpenAIKey && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={generateDescription}
                  disabled={isGenerating || !form.data.title}
                  loading={isGenerating}
                  className="flex items-center gap-1"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Generate with AI</span>
                </Button>
              </div>
            )}
          </div>

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
