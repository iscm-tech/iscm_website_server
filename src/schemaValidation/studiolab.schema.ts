import envConfig from "config";
import z from "zod";

export const CollaborationStudioCard = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${url}`;
  }),
  date: z.string().nullable(),
  location: z.string(),
});

export type CollaborationStudioCardType = z.TypeOf<
  typeof CollaborationStudioCard
>;

export const CollaborationStudioProject = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    url = url.startsWith("/") ? url : "/" + url;
    return `/${process.env.STATIC_DIR}/static${url}`;
  }),
  members: z.string().array(),
  description: z.string(),
  supervisor: z.string().array(),
  // date: z
  //   .string()
  //   .transform((date) => (date ? new Date(date) : null))
  //   .optional(),
  location: z.string(),
  galley: z
    .string()
    .transform((url) => {
      if (!url.startsWith("/")) {
        url = "/" + url;
      }
      return `/${process.env.STATIC_DIR}/static${url}`;
    })
    .array()
    .optional(),
});

export type CollaborationStudioProjectType = z.TypeOf<
  typeof CollaborationStudioProject
>;

export const CollaborationStudioBody = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    url = url.startsWith("/") ? url : "/" + url;
    return `/${process.env.STATIC_DIR}/static${url}`;
  }),
  members: z.string().array(),
  description: z.string(),
  supervisor: z.string().array(),
  date: z.date().optional(),
  location: z.string(),
  galley: z
    .string()
    .transform((url) => {
      if (!url.startsWith("/")) {
        url = "/" + url;
      }
      return `/${process.env.STATIC_DIR}/static${url}`;
    })
    .array()
    .optional(),
  draft: z.boolean().default(false),
});

export type CollaborationStudioBodyType = z.TypeOf<
  typeof CollaborationStudioBody
>;
