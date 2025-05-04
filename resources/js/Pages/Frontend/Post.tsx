import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

import FrontendLayout from '@/Layouts/FrontendLayout';
import VoteButton from '@/Components/VoteButton';
import { BoardType, PageProps, PostType, StatusType, VoteType } from '@/types';
import Comments from '@/Components/Comments';
import { formatDate, getExcerpt } from '@/utils';

interface Props {
  post: PostType;
  status: StatusType | null;
  board: BoardType;
  votes: VoteType[];
}

const Post = ({ post, status, board, votes }: Props) => {
  const { siteSettings } = usePage<PageProps>().props;

  const postExcerpt = getExcerpt(post.body);
  const pageTitle = `${post.title} - ${siteSettings?.meta_title}`;

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={postExcerpt} />

        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={postExcerpt} />
        <meta property="og:type" content="article" />
        {siteSettings?.og_image && (
          <meta property="og:image" content={siteSettings.og_image} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={postExcerpt} />
        {siteSettings?.og_image && (
          <meta name="twitter:image" content={siteSettings.og_image} />
        )}

        {/* Article specific */}
        <meta
          property="article:published_time"
          content={post.created_at.toString()}
        />
        {post.creator && (
          <meta property="article:author" content={post.creator.name} />
        )}
        {status && <meta property="article:section" content={status.name} />}
      </Head>

      <div className="mb-8 flex gap-8">
        <div className="w-72 min-w-72">
          <div className="rounded border px-4 py-4 dark:border-gray-700">
            <h3 className="mb-3 text-base font-semibold dark:text-gray-300">
              Voters
            </h3>

            {votes.length > 0 ? (
              <>
                <ul>
                  {votes.map((vote) => (
                    <li key={vote.id} className="mb-2 flex items-center">
                      <div className="mr-3">
                        <img
                          src={vote.user.avatar}
                          className="h-7 w-7 rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold dark:text-gray-300">
                          {vote.user.name}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {post.vote > 10 && (
                  <div className="mt-2 text-sm text-gray-500">
                    + {post.vote - 10} more votes
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">No voters yet.</div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-6 flex items-center">
            <div className="mr-3">
              <VoteButton post={post} />
            </div>

            <div className="flex flex-1 flex-col">
              <div className="mb-2 text-xl font-semibold dark:text-gray-300">
                {post.title}
              </div>
              <div className="flex text-sm text-gray-500">
                {status && (
                  <>
                    <span
                      className="font-bold uppercase"
                      style={{
                        color: status.color,
                      }}
                    >
                      {status.name}
                    </span>
                    <span className="mx-1">·</span>
                  </>
                )}{' '}
                <Link
                  href={route('board.show', board.slug)}
                  className="hover:text-gray-800"
                >
                  {board.name}
                </Link>
              </div>
            </div>
          </div>

          <div className="mb-6 flex">
            <div className="mr-3 w-9">
              <img
                src={post.creator?.avatar}
                className="h-7 w-7 rounded-full"
              />
            </div>
            <div className="flex-1">
              <div className="mb-3 text-sm font-semibold dark:text-gray-300">
                {post.creator?.name}
              </div>
              <div
                className="mb-3 text-sm text-gray-800 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: post.body }}
              ></div>
              <div className="text-xs text-gray-500">
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>

          <Comments board={board} post={post} />
        </div>
      </div>
    </div>
  );
};

Post.layout = (page: React.ReactNode) => (
  <FrontendLayout children={page}></FrontendLayout>
);

export default Post;
