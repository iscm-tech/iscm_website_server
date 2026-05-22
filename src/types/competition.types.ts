import {
  CompetitionCardType,
  CompetitionType,
} from "@/schemaValidation/competition.schema";

export interface CompetitionParamsRequestType {
  slug: string;
}

export interface CompetitionListResType {
  data: Array<CompetitionCardType>;
  // headerPageInfo: {
  //   title: string;
  //   description: string;
  //   bg_image?: string;
  //   [key: string]: any;
  // };
  totalPage: number;
  message: string;
}

export interface CompetitionResType {
  data: CompetitionType;
  headerPageInfo: {
    title: string;
    bg_image?: string;
    [key: string]: any;
  };
  message: string;
}
