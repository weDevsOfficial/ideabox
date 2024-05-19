import { PostType, StatusType } from '@/types';
import { useForm } from '@inertiajs/react';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  TextField,
  Textarea, SelectInput
} from '@wedevs/tail-react';
import React, { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import axios from 'axios';

type Props = {
  post: PostType;
  statuses: StatusType[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

const MergeFeedback: React.FC<Props> = ({ isOpen, onClose, post, statuses, onUpdate }) => {
  const form = useForm({
    mergedPosts: [] as number[],
    status_id: post.status_id,
  });
  const [search, setSearch] = useState('');
  const [searchedData, setSearchedData] = useState([] as PostType[]);

  const statusOptions = [
    { value: '- Select Status -', key: '' },
    ...statuses.map((status) => ({
      value: status.name,
      key: status.id.toString(),
    })),
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.clearErrors();
    if (!form.data.mergedPosts.length) {
      form.setError('mergedPosts', 'Please select at least one feedback to merge');
      return;
    }
    if (!form.data.status_id) {
      form.setError('status_id', 'Please select a status');
      return;
    }

    form.post(
      route('admin.feedbacks.merge', {
        post_id: post.id,
        status_id: form.data.status_id,
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
    if (!search) {
      setSearchedData([] as PostType[]);
      return;
    }
    axios.get(route('admin.feedbacks.search', {
      search: search,
      parent_id: post.id,
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
          {form.errors.mergedPosts && (
            <p className="text-red-500 text-xs my-4">{form.errors.mergedPosts}</p>
          )}
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
                            form.clearErrors();
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
          {searchedData && searchedData.length > 0 && (
            <div>
              <SelectInput
                required={true}
                selectedKey={statuses.find((status) => status.id === post.status_id)?.id.toString()}
                options={statusOptions}
                onChange={(option) => {
                  form.clearErrors();
                  form.setData('status_id', Number(option.key));
                }}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button
                  type="submit"
                >
                  Merge
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </ModalActions>
      </form>
    </Modal>
  );
};

export default MergeFeedback;
