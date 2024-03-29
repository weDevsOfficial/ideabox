import { PostType } from '@/types';
import { useForm } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  TextField,
  Textarea,
} from '@wedevs/tail-react';
import React from 'react';

type Props = {
  post: PostType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

const EditFeedback: React.FC<Props> = ({ isOpen, onClose, post, onUpdate }) => {
  const form = useForm({
    title: post.title,
    body: post.raw_body,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.put(
      route('admin.feedbacks.update-content', {
        post: post.slug,
      }),
      {
        preserveScroll: true,
        onSuccess: () => {
          onClose();

          if (onUpdate) {
            onUpdate();
          }
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Edit Feedback</ModalHeader>
        <ModalBody>
          <TextField
            label="Title"
            value={form.data.title}
            onChange={(value) => form.setData('title', value)}
          />

          <Textarea
            label="Feedback"
            value={form.data.body}
            rows={10}
            onChange={(value) => form.setData('body', value)}
          />
        </ModalBody>
        <ModalActions>
          <Button type="submit" className="ml-2">
            Update
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default EditFeedback;
