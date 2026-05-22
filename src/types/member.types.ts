import { MemberCardType, MemberType } from "@/schemaValidation/member.schema";

export interface MemberParamsRequestType {
  category: "members" | "advisory" | "adjunctprofessors" | "network";
  id_member: string;
}

export interface MemberResType {
  data: MemberType;
  message: string;
  // headerPageInfo: {
  //   title: string;
  //   [key: string]: string;
  // };
}

export interface MemberListResType {
  data: Array<MemberCardType>;
  // headerPageInfo: {
  //   title: string;
  //   description: string;
  //   bg_image?: string;
  //   [key: string]: any;
  // };
  message: string;
}

export interface CreateUpdateMemberResType {
  data: MemberType;
  message: string;
}
