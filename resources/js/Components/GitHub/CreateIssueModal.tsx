import React from 'react';
import { IntegrationRepository, PostType } from '@/types';
import {
  ModalHeader,
  Modal,
  ModalBody,
  ModalActions,
  Button,
  TextField,
  Textarea,
  SelectInput,
} from '@wedevs/tail-react';
import { useForm } from '@inertiajs/react';

type Props = {
  post: PostType;
  repositories: IntegrationRepository[];
  isOpen: boolean;
  onClose: () => void;
};

const CreateIssueModal = ({ post, repositories, isOpen, onClose }: Props) => {
  const form = useForm({
    title: post.title,
    body: post.raw_body,
    repository_id: repositories[0].id,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.post(
      route('admin.integrations.github.create-issue', {
        post: post,
      }),
      {
        onSuccess: () => onClose(),
      }
    );
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Create Issue</ModalHeader>
        <ModalBody>
          <SelectInput
            label="Select Repository"
            options={repositories.map((repository) => ({
              value: repository.name,
              key: repository.id.toString(),
            }))}
            onChange={(value) =>
              form.setData('repository_id', parseInt(value.key))
            }
          />

          {form.data.repository_id && (
            <>
              <TextField
                label="Issue Title"
                value={form.data.title}
                onChange={(value) => form.setData('title', value)}
              />

              <Textarea
                label="Issue Body"
                value={form.data.body}
                onChange={(value) => form.setData('body', value)}
              />
            </>
          )}
        </ModalBody>
        <ModalActions>
          <Button
            variant="primary"
            type="submit"
            disabled={
              !form.data.title || !form.data.body || !form.data.repository_id
            }
            loading={form.processing}
          >
            Create Issue
          </Button>
          <Button variant="secondary" className="mr-2" onClick={onClose}>
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default CreateIssueModal;
