import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
} from '@wedevs/tail-react';
import { PostType, User } from '@/types';
import UserSearchDropdown from './UserSearchDropdown';
import CreateUserModal from './CreateUserModal';

type VoteModalProps = {
  show: boolean;
  onClose: () => void;
  post: PostType;
};

const VoteModal = ({ show, onClose, post }: VoteModalProps) => {
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

export default VoteModal;
