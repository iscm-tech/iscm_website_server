import { PartnerCardType } from "@/schemaValidation/partner.schema";

export interface PartnerListResType {
  data: Array<PartnerCardType>;
  headerPageInfo: {
    title: string;
    description: string;
    bg_image?: string;
    [key: string]: any;
  };
  message: string;
}

export interface CreateUpdatePartnerType {
  data: PartnerCardType;
  message: string;
}
