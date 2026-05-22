import {
  EventPostType,
  PostCardType,
  PostType,
} from "@/schemaValidation/post.schema";

export interface PostResType {
  data: PostType | EventPostType;
  message: string;
  posted_portal?: {
    portalCategories: number[];
    thumbnail: string;
    background: string;
  };
  // headerPageInfo: {
  //   title: string;
  //   [key: string]: string;
  // };
}

export interface PostParamsRequestType {
  slug: string;
  title: string;
  "*": string;
}

export interface PostListResType<T = PostCardType> {
  data: Array<T>;
  // headerPageInfo: {
  //   title: string;
  //   description: string;
  //   bg_image: string;
  //   [key: string]: any;
  // };
  totalPage: number;
  message: string;
}

export interface UpdateResType {
  message: string;
}
export interface CreateResType {
  message: string;
  data: PostType;
}
