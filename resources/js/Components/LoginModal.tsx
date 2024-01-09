import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalActions,
  Button,
} from '@wedevs/tail-react';
import { Link } from '@inertiajs/react';

type Props = {
  isOpen: boolean;
  onClose: (showModal: boolean) => void;
};

const LoginModal = ({ isOpen, onClose }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)} maxWidth="sm">
      <ModalHeader className="text-center">Login Required</ModalHeader>
      <ModalBody className="text-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 mb-6">
            Please Log in or Sign up to post, comment, and vote.
          </p>

          <div className="flex items-center mb-6">
            <Button as={Link} href={route('login')} className="btn btn-primary">
              Log in
            </Button>
            <div className="mx-2">or</div>
            <Button
              as={Link}
              variant="secondary"
              href={route('register')}
              className="btn btn-secondary"
            >
              Sign up
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default LoginModal;
