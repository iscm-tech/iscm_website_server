import {
  CollaborationStudioCardType,
  CollaborationStudioProjectType,
} from "@/schemaValidation/studiolab.schema";

export interface CollaborationStudioListResType {
  data: Array<CollaborationStudioCardType>;
  // headerPageInfo: {
  //   title: string;
  //   description: string;
  //   bg_image: string;
  //   [key: string]: any;
  // };
  // totalPage: number;
  message: string;
}

export interface CollaborationStudioProjectResType {
  data: CollaborationStudioProjectType;
  // headerPageInfo: {
  //   title: string;
  //   [key: string]: string;
  // };
  message: string;
}
