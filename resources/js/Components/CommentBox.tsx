import React, { useState } from 'react';
import { Button } from '@wedevs/tail-react';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';

import { BoardType, PageProps, PostType, CommentType, User } from '@/types';

type Props = {
  post: PostType;
  parent?: number;
  onComment?: (comment: CommentType) => void;
};

const CommentBox = ({ post, parent, onComment }: Props) => {
  const { auth } = usePage<PageProps>().props;
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rows, setRows] = useState(1);
  const [form, setForm] = useState<{
    body: string;
    post_id: number;
    parent_id: number;
  }>({
    body: '',
    post_id: post.id,
    parent_id: parent || 0,
  });

  const showButtons = isFocused || form.parent_id !== 0 || form.body.length > 0;

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const lineHeight = parseInt(
      window.getComputedStyle(textarea).lineHeight,
      10
    );
    const padding =
      parseInt(window.getComputedStyle(textarea).paddingTop, 10) +
      parseInt(window.getComputedStyle(textarea).paddingBottom, 10);

    // Resetting the height to 'auto' allows the scrollHeight to correctly represent the content height
    textarea.style.height = 'auto';
    const contentHeight = textarea.scrollHeight - padding;

    // Calculate the number of rows (consider both new lines and wrapped text)
    let rows = Math.floor(contentHeight / lineHeight);

    // Define minimum and maximum number of rows
    const minRows = 1;
    const maxRows = 10;

    // Clamp the rows value between min and max
    rows = Math.max(minRows, Math.min(rows, maxRows));

    setRows(rows);

    setForm({
      ...form,
      body: textarea.value,
    });
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    createComment();
  };

  const createComment = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    axios
      .post(route('post.comments.store', [post.slug]), form)
      .then((response) => {
        setForm({
          ...form,
          body: '',
        });

        if (onComment) {
          onComment(response.data);
        }
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <form className="border border-gray-300 rounded" onSubmit={onFormSubmit}>
      <textarea
        className="w-full border-0 text-sm px-3 py-2 mt-1 focus:ring-0"
        autoComplete="off"
        rows={rows}
        value={form.body}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Write a comment..."
        onChange={onTextareaChange}
        onKeyDown={(e) => {
          if (e.metaKey && e.key === 'Enter') {
            createComment();
          }
        }}
      ></textarea>

      {showButtons && (
        <div className="flex border-t border-gray-300 px-3 py-2 justify-between items-center">
          <div className="text-xs text-gray-500">
            {parent ? (
              <span>&nbsp;</span>
            ) : (
              <span>
                The post author and the voters will get an email notification.
              </span>
            )}
          </div>
          <div className="">
            <Button
              variant="primary"
              type="submit"
              disabled={isProcessing || form.body === '' || !auth.user}
              loading={isProcessing}
            >
              Submit
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

export default CommentBox;
