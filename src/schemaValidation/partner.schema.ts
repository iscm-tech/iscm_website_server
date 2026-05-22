import envConfig from "config";
import z from "zod";

export const PartnerCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().transform((url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  link: z.string().nullable().default(null),
  weight: z.number(),
  draft: z.boolean(),
  author: z.string().nullable().optional(),
});

export type PartnerCardType = z.TypeOf<typeof PartnerCardSchema>;

export const CreatePartnerBody = z.object({
  title: z.string(),
  image: z.string().transform((url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  link: z.string().nullable().default(null),
  weight: z.number(),
  draft: z.boolean(),
});

export const UpdatePartnerBody = z.object({
  title: z.string().optional(),
  image: z
    .string()
    .transform((imgName) => {
      if (imgName.startsWith("/images")) return imgName;

      return `/images/${imgName}`;
    })
    .optional(),
  link: z.string().nullable().default(null),
  weight: z.number().optional(),
  draft: z.boolean().optional(),
});

export type UpdatePartnerBodyType = z.TypeOf<typeof UpdatePartnerBody>;
