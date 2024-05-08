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
import React, { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import axios from 'axios';

type Props = {
  post: PostType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

const MergeFeedback: React.FC<Props> = ({ isOpen, onClose, post, onUpdate }) => {
  const form = useForm({
    mergedPosts: [] as number[]
  });
  const [search, setSearch] = useState('');
  const [searchedData, setSearchedData] = useState([] as PostType[]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(
      route('admin.feedbacks.merge', {
        post_id: post.id,
        merge_ids: form.data.mergedPosts,
      }),
      {
        preserveScroll: true,
        onSuccess: () => {
          onClose();
          setSearchedData([] as PostType[]);
          setSearch('');

          if (onUpdate) {
            onUpdate();
          }
        },
      }
    );
  };

  const handleSearch = useCallback( debounce((search: string) => {
    axios.get(route('admin.feedbacks.search', {
      isApi: true,
      search: search,
    })).then((response) => {
      setSearchedData(response.data);
    });
  }, 500), []);
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>Merge Feedback with {post.title}</ModalHeader>
        <ModalBody>
          <TextField
            label="Search feedback"
            value={search}
            onChange={(value) => {
              setSearch(value);
              handleSearch(value);
            }}
          />
          <div className="max-h-64 overflow-y-auto">
            <fieldset>
              <legend className="sr-only">Ideas</legend>
              <div className="space-y-5">
                {searchedData.length === 0 && (
                  <div className="flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No feedback found.
                    </p>
                  </div>
                )}
                {searchedData && searchedData.map((feedback) => (
                  <div key={feedback.id} className="relative flex items-start">
                    <div className="flex h-6 items-center ml-2">
                      <input
                        key={feedback.id}
                        id={`feedback-${feedback.id}`}
                        name={`feedback-${feedback.id}`}
                        type="checkbox"
                        value={feedback.id}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        onChange={(event)=>{
                          if (event.target.checked) {
                            form.setData('mergedPosts', [...form.data.mergedPosts, feedback.id]);
                          } else {
                            form.setData('mergedPosts', form.data.mergedPosts.filter(item => item !== feedback.id));
                          }
                        }}
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label
                        htmlFor={`feedback-${feedback.id}`}
                        className="font-medium text-gray-900 dark:text-gray-100"
                      >
                        {feedback.title}
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                        {feedback.body}
                      </span>
                        <div
                          className="uppercase text-xs font-bold text-white px-1.5 py-0.5 rounded w-20"
                          style={{ backgroundColor: feedback.status?.color }}
                        >
                          {feedback.status?.name}
                        </div>
                      </label>
                      <span
                        id="comments-description"
                        className="text-gray-500 dark:text-gray-400"
                      >
                        <span className="sr-only">{feedback.body} - {feedback.by?.name}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </ModalBody>
        <ModalActions>
          <Button
            type="submit"
            className="ml-2"
          >
            Merge
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default MergeFeedback;
