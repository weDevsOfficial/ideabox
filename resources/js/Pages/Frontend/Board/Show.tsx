import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

import FrontendLayout from '@/Layouts/FrontendLayout';
import { BoardType, PageProps, PostType, User } from '@/types';
import PostForm from './PostForm';
import axios from 'axios';
import VoteButton from '@/Components/VoteButton';
import BackToTop from '@/Components/BackToTop';

type Props = {
  posts: {
    data: PostType[];
    next_page_url: string | null;
  };
  board: BoardType;
  filters: {
    sort: string;
    search: string;
  };
};

const ShowBoard = ({
  auth,
  posts,
  board,
  filters,
  siteSettings,
}: PageProps<Props>) => {
  const [allPosts, setAllPosts] = useState<PostType[]>(posts.data);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(
    posts.next_page_url,
  );
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Get sort key from URL param
  const [sortKey, setSortKey] = useState(filters.sort || 'voted');
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  // Reset posts when props change (e.g. after sort/search changes)
  useEffect(() => {
    setAllPosts(posts.data);
    setNextPageUrl(posts.next_page_url);
  }, [posts]);

  const toggleVote = (post: PostType) => {
    if (!auth.user) return;

    // send a ajax request for vote
    axios.post(route('post.vote', [board.slug, post.slug])).then((response) => {
      const newPosts = allPosts.map((p) => {
        if (p.id === post.id) {
          p.has_voted = response.data.has_voted;
          p.vote = response.data.vote;
        }

        return p;
      });

      setAllPosts(newPosts);
    });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      router.visit(
        route('board.show', {
          board: board.slug,
          search: searchQuery.trim(),
          sort: sortKey,
        }),
      );
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSortKey(value);
    router.visit(route('board.show', { board: board.slug, sort: value }));
  };

  const loadMorePosts = useCallback(() => {
    if (loading || loadingRef.current || !nextPageUrl) return;

    setLoading(true);
    loadingRef.current = true;

    const url = new URL(nextPageUrl);
    url.searchParams.set('sort', sortKey);
    if (searchQuery.trim()) {
      url.searchParams.set('search', searchQuery.trim());
    }

    axios
      .get(url.toString())
      .then((response) => {
        // Check for duplicate posts by ID
        if (response.data.posts?.data) {
          const newPostsData = response.data.posts.data;
          const existingIds = new Set(allPosts.map((post) => post.id));
          const uniqueNewPosts = newPostsData.filter(
            (post: PostType) => !existingIds.has(post.id),
          );

          setAllPosts((prevPosts) => [...prevPosts, ...uniqueNewPosts]);
          setNextPageUrl(response.data.posts.next_page_url);
        }
      })
      .catch((error) => {
        console.error('Error loading more posts:', error);
      })
      .finally(() => {
        setLoading(false);
        loadingRef.current = false;
      });
  }, [nextPageUrl, sortKey, searchQuery, allPosts]);

  const lastPostRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && nextPageUrl) {
            loadMorePosts();
          }
        },
        {
          rootMargin: '100px',
        },
      );

      if (node) observer.current.observe(node);
    },
    [loading, loadMorePosts, nextPageUrl],
  );

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return (
    <div>
      <Head>
        <title>{`${board.name} - ${siteSettings?.meta_title}`}</title>
        <meta
          name="description"
          content={board.description || siteSettings?.meta_description}
        />

        {/* OpenGraph */}
        <meta
          property="og:title"
          content={`${board.name} - ${siteSettings?.meta_title}`}
        />
        <meta
          property="og:description"
          content={board.description || siteSettings?.meta_description}
        />
        <meta property="og:type" content="website" />
        {siteSettings?.og_image && (
          <meta property="og:image" content={siteSettings.og_image} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${board.name} - ${siteSettings?.meta_title}`}
        />
        <meta
          name="twitter:description"
          content={board.description || siteSettings?.meta_description}
        />
        {siteSettings?.og_image && (
          <meta name="twitter:image" content={siteSettings.og_image} />
        )}
      </Head>

      <div className="mb-8 flex w-full gap-8">
        <PostForm board={board} user={auth.user} />

        <div className="flex-1">
          <div className="rounded border dark:border-gray-700">
            <div className="flex justify-between border-b bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2 dark:text-gray-300">
                <div className="">Showing</div>
                <div className="">
                  <select
                    className="rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                    onChange={handleSortChange}
                    value={sortKey}
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="voted">Top Voted</option>
                    <option value="commented">Most Commented</option>
                  </select>
                </div>
                <div className="">posts</div>
              </div>

              <div className="">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    className="rounded border-0 px-4 py-2 pl-9 text-sm ring-1 ring-indigo-50 focus:outline-none focus:ring-1 dark:bg-gray-800 dark:ring-gray-700"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center pr-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y dark:divide-gray-700">
              {allPosts.map((post, index) => {
                if (allPosts.length === index + 1) {
                  return (
                    <div
                      key={post.id}
                      ref={lastPostRef}
                      className="flex justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Link
                        href={route('post.show', [board.slug, post.slug])}
                        className="flex flex-1 flex-col"
                      >
                        <div className="mb-1 text-sm font-semibold dark:text-gray-300">
                          {post.title}
                        </div>
                        <div className="line-clamp-2 text-sm text-gray-500">
                          {post.body}
                        </div>
                        <div className="mt-2 flex text-xs text-gray-500">
                          <ChatBubbleLeftIcon className="mr-1.5 inline-block h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                      </Link>
                      <div className="text-sm text-gray-500">
                        <div className="ml-4">
                          <VoteButton post={post} />
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={post.id}
                      className="flex justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Link
                        href={route('post.show', [board.slug, post.slug])}
                        className="flex flex-1 flex-col"
                      >
                        <div className="mb-1 text-sm font-semibold dark:text-gray-300">
                          {post.title}
                        </div>
                        <div className="line-clamp-2 text-sm text-gray-500">
                          {post.body}
                        </div>
                        <div className="mt-2 flex text-xs text-gray-500">
                          <ChatBubbleLeftIcon className="mr-1.5 inline-block h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                      </Link>
                      <div className="text-sm text-gray-500">
                        <div className="ml-4">
                          <VoteButton post={post} />
                        </div>
                      </div>
                    </div>
                  );
                }
              })}

              {allPosts.length === 0 && (
                <div className="p-4 text-center text-sm dark:text-gray-300">
                  No posts found.
                </div>
              )}
            </div>

            {loading && (
              <div className="p-4 text-center text-sm dark:text-gray-300">
                Loading more posts...
              </div>
            )}
          </div>
        </div>
      </div>
      <BackToTop />
    </div>
  );
};

ShowBoard.layout = (page: React.ReactNode) => (
  <FrontendLayout children={page}></FrontendLayout>
);

export default ShowBoard;
