import React from 'react';
import classNames from 'classnames';
import axios from 'axios';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { PostType, BoardType, PageProps } from '@/types';

type Props = {
  post: PostType;
  board: BoardType;
};

const VoteButton = ({ auth, post, board }: PageProps<Props>) => {
  const toggleVote = (post: PostType) => {
    if (!auth.user) {
      return;
    }

    // send a ajax request for vote
    axios.post(route('post.vote', [board.slug, post.slug])).then((response) => {
      // const newPosts = allPosts.map((p) => {
      //   if (p.id === post.id) {
      //     p.has_voted = response.data.has_voted;
      //     p.vote = response.data.vote;
      //   }
      //   return p;
      // });
      // setAllPosts(newPosts);
    });
  };

  return (
    <button
      className={classNames(
        'flex flex-col self-start w-9 text-sm text-gray-700 rounded-md border py-2 items-center hover:bg-gray-100',
        post.has_voted ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
      )}
      onClick={() => toggleVote(post)}
    >
      <ChevronUpIcon
        className={classNames(
          'h-3 w-3 mb-1',
          post.has_voted ? 'text-indigo-600' : 'text-gray-400'
        )}
      />
      <span className="text-xs">{post.vote}</span>
    </button>
  );
};

export default VoteButton;
