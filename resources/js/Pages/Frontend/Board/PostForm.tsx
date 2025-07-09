import React from 'react';
import { Button, TextField, Textarea } from '@wedevs/tail-react';
import { BoardType, User } from '@/types';
import { Link, useForm } from '@inertiajs/react';

type Props = {
  board: BoardType;
  user: User | null;
};

const PostForm = ({ board, user }: Props) => {
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
    <div className="w-full lg:w-72 lg:min-w-72 lg:flex-shrink-0">
      <form
        className="rounded border px-4 py-4 text-center dark:border-gray-700"
        onSubmit={createPost}
      >
        {board.allow_posts && (
          <h3 className="mb-3 text-base font-semibold dark:text-gray-300">
            {board.settings?.form.heading || 'Create a post'}
          </h3>
        )}

        {board.settings?.form.description && (
          <div className="mb-3 text-sm text-gray-500">
            {board.settings.form.description}
          </div>
        )}

        {board.allow_posts && (
          <>
            <div className="text-left">
              <TextField
                label={board.settings?.form.fields.title.label || 'Title'}
                placeholder={
                  board.settings?.form.fields.title.placeholder ||
                  'Enter a short title'
                }
                required
                value={form.data.title}
                onChange={(value) => form.setData('title', value)}
                error={form.errors.title}
              />

              <Textarea
                label={board.settings?.form.fields.details.label || 'Details'}
                placeholder={
                  board.settings?.form.fields.details.placeholder ||
                  "Describe what you'd like to be able to do"
                }
                required
                value={form.data.body}
                error={form.errors.body}
                onChange={(value) => form.setData('body', value)}
              />
            </div>

            <Button
              type="submit"
              loading={form.processing}
              disabled={form.processing || !user}
              className="w-full"
            >
              {board.settings?.form.button || 'Submit'}
            </Button>
          </>
        )}
      </form>

      {!user && (
        <div className="mt-3 text-center">
          <div className="mb-3 text-sm text-gray-500">
            Want to post?{' '}
            <Link
              href={route('login')}
              className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Log in
            </Link>{' '}
            or{' '}
            <Link
              href={route('register')}
              className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostForm;
