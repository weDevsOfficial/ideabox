export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  email_verified_at: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface SiteSettings {
  app_name?: string;
  company_legal_name?: string;
  copyright_text?: string;
  footer_text?: string;
  app_logo?: string;
  app_logo_dark?: string;
  meta_title?: string;
  meta_description?: string;
  footer_links?: Array<{ label: string; href: string; is_external: boolean }>;
  header_links?: Array<{ label: string; href: string; is_external: boolean }>;
  [key: string]: any;
}

export type PageProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
  auth: {
    user: User | null;
  };
  appName: string;
  appLogo: string;
  boards: BoardType[];
  siteSettings?: SiteSettings;
  success?: string;
  error?: string;
};

export interface PaginatedLink {
  url: string;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
  links: PaginatedLink[];
}

export interface StatusType {
  color: string;
  id: number;
  name: string;
  in_roadmap: boolean;
  in_frontend?: boolean;
  order: number;
}

export interface BoardType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  posts: number;
  allow_posts: boolean;
  privacy: 'public' | 'private';
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
  raw_body: string;
  vote: number;
  comments: number;
  status_id: null | number;
  board_id: number;
  has_voted: boolean;
  created_at: Date;
  updated_at: Date;
  creator?: User;
  board: BoardType;
  status?: StatusType;
  by: User | null;
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
  is_merge_comment: boolean;
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

export interface IntegrationRepository {
  id: number;
  integration_provider_id: number;
  name: string;
  full_name: string;
}

export interface PostIntegrationLink {
  id: number;
  post_id: number;
  integration_provider_id: number;
  integration_repository_id: number;
  external_id: string;
  external_url: string;
  status: string;
  settings: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export interface Provider {
  id: number;
  name: string;
  type: string;
  repositories?: IntegrationRepository[];
  is_connected?: boolean;
  authenticated_at?: Date;
}
