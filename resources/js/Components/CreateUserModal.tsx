import React, { useState } from 'react';
import axios from 'axios';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  TextField,
} from '@wedevs/tail-react';

type Props = {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
};

const CreateUserModal = ({ show, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    axios.post(route('admin.users.store'), form).then((response) => {
      onClose();
      setForm({
        name: '',
        email: '',
      });

      onSubmit(response.data);
    });
  };

  return (
    <Modal isOpen={show} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Create User</ModalHeader>
        <ModalBody>
          <TextField
            label="Name"
            placeholder="Enter a name"
            value={form.name}
            required={true}
            onChange={(value) => setForm({ ...form, name: value })}
          />
          <TextField
            label="Email"
            placeholder="Enter an email"
            required={true}
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
          />
        </ModalBody>
        <ModalActions>
          <Button type="submit" variant="primary" className="ml-2">
            Create User
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
