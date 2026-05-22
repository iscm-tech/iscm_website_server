import envConfig from "config";
import z from "zod";

//  ---------------------------------------------------------------- publications ----------------------------------------------------------------
export const PublicationSchema = z.object({
  id: z.number(),
  title: z.string(),
  link: z.string(),
});

export type PublicationType = z.TypeOf<typeof PublicationSchema>;

export const CreatePublicationBody = z.object({
  id: z.number(),
  title: z.string(),
  link: z.string(),
});

export type CreatePublicationType = z.TypeOf<typeof CreatePublicationBody>;

export const UpdatePublicationBody = z.object({
  title: z.string().optional(),
  link: z.string().optional(),
  year: z.number().optional(),
});

export type UpdatePublicationType = z.TypeOf<typeof UpdatePublicationBody>;

export const BookSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${url}`;
  }),
  year: z.number(),
  description: z.string(),
  authors: z.string().array(),
  shop_link: z.string().nullable().optional(),
});

export type BookType = z.TypeOf<typeof BookSchema>;
