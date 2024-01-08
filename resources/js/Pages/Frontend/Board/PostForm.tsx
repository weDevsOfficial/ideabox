import React from 'react';
import { Button, TextField, Textarea } from '@wedevs/tail-react';
import { BoardType } from '@/types';
import { useForm } from '@inertiajs/react';

type Props = {
  board: BoardType;
};

const PostForm = ({ board }: Props) => {
  const form = useForm<{
    title: string;
    body: string;
  }>({
    title: '',
    body: '',
  });
  const createPost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.post(route('board.posts.store', board.slug), {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div className="w-72">
      <form
        className="px-4 py-4 border rounded text-center"
        onSubmit={createPost}
      >
        <h3 className="text-base font-semibold mb-3">Create a Post</h3>

        <div className="text-sm text-gray-500 mb-3">
          Let us know which features would help you better collect and manage
          user feedback.
        </div>

        <div className="text-left">
          <TextField
            label="Title"
            placeholder="Enter a short title"
            required
            value={form.data.title}
            onChange={(value) => form.setData('title', value)}
            error={form.errors.title}
          />

          <Textarea
            label="Details"
            placeholder="Describe what you'd like to be able to do"
            required
            value={form.data.body}
            error={form.errors.body}
            onChange={(value) => form.setData('body', value)}
          />
        </div>

        <Button
          type="submit"
          loading={form.processing}
          disabled={form.processing}
          className="w-full"
        >
          Create Post
        </Button>
      </form>
    </div>
  );
};

export default PostForm;
