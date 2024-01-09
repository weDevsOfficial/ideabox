import React, { useState } from 'react';
import classNames from 'classnames';
import axios from 'axios';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { PostType, BoardType, PageProps, User } from '@/types';
import { usePage } from '@inertiajs/react';
import LoginModal from './LoginModal';

type Props = {
  post: PostType;
};

const VoteButton = ({ post }: Props) => {
  const { auth } = usePage<PageProps>().props;
  const [hasVoted, setHasVoted] = useState(post.has_voted);
  const [vote, setVote] = useState(post.vote);
  const [showModal, setShowModal] = useState(false);

  const toggleVote = (post: PostType) => {
    if (!auth.user) {
      setShowModal(true);
      return;
    }

    axios.post(route('post.vote', [post.slug])).then((response) => {
      setVote(response.data.vote);
      setHasVoted(response.data.has_voted);
    });
  };

  return (
    <>
      <button
        className={classNames(
          'flex flex-col self-start w-9 text-sm text-gray-700 rounded-md border py-2 items-center hover:bg-gray-100',
          hasVoted ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        )}
        onClick={() => toggleVote(post)}
      >
        <ChevronUpIcon
          className={classNames(
            'h-3 w-3 mb-1',
            hasVoted ? 'text-indigo-600' : 'text-gray-400'
          )}
        />
        <span className="text-xs">{vote}</span>
      </button>

      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default VoteButton;
