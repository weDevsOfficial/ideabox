import React, { useState } from 'react';
import {
  Modal,
  Button,
  TextField,
  ModalHeader,
  ModalBody,
  ModalActions,
} from '@wedevs/tail-react';
import axios from 'axios';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl: string;
}

export default function ConnectAccountModal({
  isOpen,
  onClose,
  callbackUrl,
}: ConnectAccountModalProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    client_secret: '',
  });

  const [errors, setErrors] = useState<{
    client_id?: string;
    client_secret?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const endpoint = route('admin.integrations.github.connect');
      const data = {
        client_id: formData.client_id,
        client_secret: formData.client_secret,
        type: 'github',
      };

      const response = await axios.post(endpoint, data);

      // If response has auth_url, redirect to it
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      } else {
        // If no auth_url, just refresh the page
        window.location.reload();
      }
    } catch (error: any) {
      // Handle validation errors
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert('An error occurred while submitting the form. Please try again.');
        console.error('Form submission error:', error);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h2 className="text-lg font-semibold mb-4">Connect GitHub Account</h2>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            To connect with GitHub, you'll need to{' '}
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              create an OAuth application
            </a>
            . Use this callback URL:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4 font-mono text-sm text-gray-800 dark:text-gray-300">
            {callbackUrl}
          </div>

          <div className="space-y-4">
            <div>
              <TextField
                label="Client ID"
                placeholder="GitHub OAuth Client ID"
                value={formData.client_id}
                onChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
                error={errors.client_id}
                required
              />
            </div>

            <div>
              <TextField
                label="Client Secret"
                placeholder="GitHub OAuth Client Secret"
                value={formData.client_secret}
                onChange={(value) =>
                  setFormData({ ...formData, client_secret: value })
                }
                error={errors.client_secret}
                required
              />
            </div>
          </div>
        </ModalBody>
        <ModalActions>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connecting...' : 'Connect Account'}
          </Button>
          <Button variant="secondary" onClick={onClose} className="mr-2">
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
