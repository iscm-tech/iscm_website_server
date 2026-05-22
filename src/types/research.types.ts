import { BookType, PublicationType } from "@/schemaValidation/research.schema";

export interface ResearchParamsRequestType {
  slug: string;
}

export interface ResearchResType<T = PublicationType> {
  data: T;
  message: string;
  // headerPageInfo: {
  //   title: string;
  //   [key: string]: string;
  // };
}

export interface ResearchListResType<T = PublicationType> {
  data: Array<{ year: number; publications_list: T[] }>;
  // headerPageInfo: {
  //   title: string;
  //   description: string;
  //   bg_image?: string;
  //   [key: string]: any;
  // };
  message: string;
}

export interface BookListResType<T = BookType> {
  data: Array<T>;
  // headerPageInfo: {
  //   title: string;
  //   description: string;
  //   bg_image?: string;
  //   [key: string]: any;
  // };
  message: string;
}

export interface CreateUpdateResearchResType {
  message: string;
  data: PublicationType;
}
