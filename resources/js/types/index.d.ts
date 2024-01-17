export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  email_verified_at: string;
  role: string;
}

export type PageProps<
  T extends Record<string, unknown> = Record<string, unknown>
> = T & {
  auth: {
    user: User;
  };
  appName: string;
  appLogo: string;
  error: string;
  success: string;
};

export interface StatusType {
  color: string;
  id: number;
  name: string;
  in_roadmap: boolean;
  order: number;
}

export interface BoardType {
  id: number;
  name: string;
  slug: string;
  posts: number;
  allow_posts: boolean;
  settings?: {
    form: {
      heading: string;
      description: string;
      button: string;
      fields: {
        title: {
          label: string;
          placeholder: string;
        };
        details: {
          label: string;
          placeholder: string;
        };
      };
    };
  };
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
  status: null | StatusType;
}

export interface RoadmapType {
  id: number;
  name: string;
  color: string;
}

export interface VoteType {
  id: number;
  user_id: number;
  user: User;
}
