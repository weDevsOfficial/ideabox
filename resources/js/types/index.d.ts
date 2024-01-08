export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  email_verified_at: string;
}

export type PageProps<
  T extends Record<string, unknown> = Record<string, unknown>
> = T & {
  auth: {
    user: User;
  };
};

export interface BoardType {
  id: number;
  name: string;
  slug: string;
  posts: number;
}

export interface PostType {
  id: number;
  title: string;
  slug: string;
  body: string;
  vote: number;
  comments: number;
  status_id: number;
  board_id: number;
  has_voted: boolean;
  created_at: Date;
  updated_at: Date;
  creator?: User;
}

export interface CommentType {
  id: number;
  body: string;
  vote: number;
  post_id: number;
  parent_id: null | number;
  created_at: Date;
  updated_at: Date;
  user?: User;
  children: CommentType[];
}

export interface RoadmapType {
  id: number;
  name: string;
  color: string;
}
