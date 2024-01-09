import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';

import FrontendLayout from '@/Layouts/FrontendLayout';
import { BoardType, PageProps, PostType, RoadmapType } from '@/types';
import HomeBoardList from './Partials/HomeBoardList';
import HomeRoadmap from './Partials/HomeRoadmap';

type Props = {
  boards: BoardType[];
  roadmaps: RoadmapType[];
  posts: PostType[];
};

const Home = ({ boards, roadmaps, posts, auth }: PageProps<Props>) => {
  const [allPosts, setAllPosts] = useState<PostType[]>(posts);

  return (
    <div className="mb-8">
      <Head title="Roadmap" />

      <HomeBoardList boards={boards} />
      <HomeRoadmap boards={boards} roadmaps={roadmaps} posts={allPosts} />
    </div>
  );
};

Home.layout = (page: React.ReactNode) => (
  <FrontendLayout children={page}></FrontendLayout>
);

export default Home;
