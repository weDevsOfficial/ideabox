import React, { useState } from 'react';
import { Head } from '@inertiajs/react';

import FrontendLayout from '@/Layouts/FrontendLayout';
import { BoardType, PageProps, PostType, RoadmapType } from '@/types';
import HomeBoardList from './Partials/HomeBoardList';
import HomeRoadmap from './Partials/HomeRoadmap';

type Props = {
  boards: BoardType[];
  roadmaps: RoadmapType[];
  posts: PostType[];
};

const Home = ({ boards, roadmaps, posts, siteSettings }: PageProps<Props>) => {
  const [allPosts, setAllPosts] = useState<PostType[]>(posts);

  return (
    <div className="mb-6 sm:mb-8">
      <Head>
        <title>{siteSettings?.meta_title}</title>
        <meta name="description" content={siteSettings?.meta_description} />

        {/* OpenGraph */}
        <meta property="og:title" content={siteSettings?.meta_title} />
        <meta
          property="og:description"
          content={siteSettings?.meta_description}
        />
        <meta property="og:type" content="website" />

        {siteSettings?.og_image && (
          <meta property="og:image" content={siteSettings.og_image} />
        )}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteSettings?.meta_title} />
        <meta
          name="twitter:description"
          content={siteSettings?.meta_description}
        />
        {siteSettings?.og_image && (
          <meta name="twitter:image" content={siteSettings.og_image} />
        )}
      </Head>

      <div className="space-y-6 sm:space-y-8">
        <HomeBoardList boards={boards} />
        <HomeRoadmap boards={boards} roadmaps={roadmaps} posts={allPosts} />
      </div>
    </div>
  );
};

Home.layout = (page: React.ReactNode) => (
  <FrontendLayout children={page}></FrontendLayout>
);

export default Home;
