import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import FrontendLayout from '@/Layouts/FrontendLayout';
import { BoardType, PageProps, PostType } from '@/types';
import PostForm from './PostForm';
import axios from 'axios';
import VoteButton from '@/Components/VoteButton';
import { debounce } from 'lodash';
import BackToTop from '@/Components/BackToTop';

type Props = {
  posts: {
    data: PostType[];
    next_page_url: string | null;
  };
  board: BoardType;
};

type UrlParams = {
  board: string;
  search?: string;
  sort?: string;
};

const ShowBoard = ({ auth, posts, board }: PageProps<Props>) => {
  const [allPosts, setAllPosts] = useState<PostType[]>(posts.data);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(
    posts.next_page_url
  );
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // Get sort key from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const sort = urlParams.get('sort');
  const search = urlParams.get('search');
  const [searchUrlParam, setSearchUrlParam] = useState({
    search: search || '',
    sort: sort || 'voted',
  });

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    setSearchUrlParam({
      ...searchUrlParam,
      sort: value,
    });
    let params: UrlParams = {
      board: board.slug,
      sort: value,
      search: searchUrlParam.search,
    };

    if (searchUrlParam.search.length === 0) {
      delete params['search'];
    }

    router.visit(route('board.show', params), {
      replace: true,
    });
  };

  const handleSearch = useCallback(
    debounce((search: string) => {
      let params: UrlParams = {
        board: board.slug,
        sort: searchUrlParam.sort,
        search: search,
      };
      if (search.length === 0) {
        delete params['search'];
      }
      router.visit(route('board.show', params), {
        replace: true,
      });
    }, 500),
    []
  );

  const loadMorePosts = useCallback(() => {
    if (loading || !nextPageUrl) return;
    setLoading(true);

    console.log('Loading more posts...', {
      loading,
      nextPageUrl,
    });

    const url = new URL(nextPageUrl);
    // @TODO: Need to add search query later
    // url.searchParams.set('sort', sortKey);

    axios.get(url.toString()).then((response) => {
      setAllPosts((prevPosts) => [...prevPosts, ...response.data.posts.data]);
      setNextPageUrl(response.data.posts.next_page_url);
      setLoading(false);
    });
  }, [loading, nextPageUrl]);

  const lastPostRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadMorePosts]
  );

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return (
    <div>
      <Head title={board.name} />

      <div className="flex gap-8 mb-8">
        <PostForm board={board} user={auth.user} />

        <div className="flex-1">
          <div className="border dark:border-gray-700 rounded">
            <div className="flex border-b dark:border-gray-700 px-3 py-3 bg-gray-50 dark:bg-gray-800 justify-between">
              <div className="flex gap-2 items-center dark:text-gray-300">
                <div className="">Showing</div>
                <div className="">
                  <select
                    className="px-2 text-sm py-1.5 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                    onChange={handleSortChange}
                    value={searchUrlParam.sort}
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="voted">Top Voted</option>
                    <option value="commented">Most Commented</option>
                  </select>
                </div>
                <div className="">posts</div>
              </div>

              <div className="flex">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search"
                    value={searchUrlParam.search}
                    onChange={(e) => {
                      setSearchUrlParam({
                        ...searchUrlParam,
                        search: e.target.value,
                      });
                      handleSearch(e.target.value);
                    }}
                    className="px-4 pl-9 py-2 dark:bg-gray-800 rounded border-0 text-sm ring-1 ring-indigo-50 dark:ring-gray-700 focus:outline-none focus:ring-1 dark:text-gray-300"
                    autoFocus={searchUrlParam.search.length > 0}
                  />
                  <div className="absolute inset-y-0 left-2 flex items-center pr-3 pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {search ||
                searchUrlParam.search.length > 0 ||
                searchUrlParam.sort !== 'voted' ? (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => {
                        setSearchUrlParam({
                          ...searchUrlParam,
                          search: '',
                          sort: '',
                        });
                        router.visit(
                          route('board.show', {
                            board: board.slug,
                          }),
                          {
                            replace: true,
                          }
                        );
                      }}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Clear</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="divide-y dark:divide-gray-700">
              {allPosts.map((post, index) => {
                return (
                  <div
                    ref={index === allPosts.length - 1 ? lastPostRef : null}
                    key={post.id}
                    className="p-4 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Link
                      href={route('post.show', [board.slug, post.slug])}
                      className="flex flex-col flex-1"
                    >
                      <div className="text-sm font-semibold dark:text-gray-300 mb-1">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {post.body}
                      </div>
                      <div className="text-xs text-gray-500 flex mt-2">
                        <ChatBubbleLeftIcon className="h-4 w-4 inline-block mr-1.5" />
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
              })}

              {allPosts.length === 0 && (
                <div className="p-4 text-sm text-center dark:text-gray-300">
                  No posts found.
                </div>
              )}
            </div>

            {loading && (
              <div className="p-4 text-sm text-center dark:text-gray-300">
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
