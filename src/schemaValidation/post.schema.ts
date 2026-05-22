import z from "zod";
import envConfig from "config";

export const MetaDataSchema = z.object({
  id: z.number(),
  title: z.string(),
  publishDate: z
    .date()
    .or(z.string().transform((val) => new Date(val)))
    .default(new Date()),
  draft: z.boolean().default(false),
  thumbnail: z.string().transform((val) => {
    if (val.trim().startsWith("http")) return val;

    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${
      val.startsWith("/") ? val : "/" + val
    }`.trim();
  }),
  author: z.string().default("unknown"),
  description: z.string().default(""),
  sdgs: z.number().array().nonempty().max(3),
  categories: z.number().array().optional(),
  slug: z.string(),
});

export type MetaDataType = z.TypeOf<typeof MetaDataSchema>;

export const PostSchema = z
  .object({
    content: z.string(),
    metadata: MetaDataSchema,
  })
  .describe("metadata");

export type PostType = z.TypeOf<typeof PostSchema>;

export const PostCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  publishDate: z.date(),
  draft: z.boolean().default(false),
  thumbnail: z.string().transform((url) => {
    if (url.startsWith("http")) return url;

    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${url}`.trim();
  }),
  sdgs: z.number().array().nonempty(),
  slug: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
});

export const EventCardSchema = PostCardSchema.extend({
  eventTime: z.date().nullable(),
});

export type EventCardType = z.TypeOf<typeof EventCardSchema>;

export const EventPostSchema = PostSchema.extend({
  metadata: PostSchema.shape.metadata.extend({
    eventTime: z.date().nullable(),
  }),
});

export type EventPostType = z.TypeOf<typeof EventPostSchema>;

export type PostCardType = z.TypeOf<typeof PostCardSchema>;

export const LatestPostSchema = PostCardSchema.extend({
  category: z.string(),
});

export type LatestPostType = z.TypeOf<typeof LatestPostSchema>;

export const LatestAdmissionCardSchema = LatestPostSchema.extend({
  content: z.string(),
});

export type LatestAdmissionCardType = z.TypeOf<
  typeof LatestAdmissionCardSchema
>;

export const PendingPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  publishDate: z.date(),
  draft: z.boolean().default(false),
  thumbnail: z.string(),
  categories: z.number().array().nonempty(),
  author: z.string(),
  sdgs: z.number().array().nonempty().max(3),
  lang: z.enum(["vi", "en"]),
});

export type PendingPostSchema = z.TypeOf<typeof PendingPostSchema>;

export const CreatePostBody = z.object({
  metadata: z.object({
    title: z.string().min(1),
    thumbnail: z.string().transform((imgName) => {
      if (
        imgName.trim().startsWith(envConfig.MEDIA_UPLOAD_FOLDER) ||
        imgName.trim().startsWith("http")
      )
        return imgName;

      const normalizePath = imgName.startsWith("/") ? imgName : "/" + imgName;

      return `${envConfig.MEDIA_UPLOAD_FOLDER}${normalizePath}`;
    }),
    draft: z.boolean().default(false),
    publishDate: z
      .date()
      .or(z.string())
      .default(new Date())
      .transform((date) => new Date(date)),
    sdgs: z.number().array().nonempty().max(3),
    description: z.string().default(""),
    author: z.string().default("ISCM"),
    slug: z.string(),
  }),
  content: z.string().min(1),
});

export type CreatePostBodyType = z.TypeOf<typeof CreatePostBody>;

export const CreateEventBodySchema = CreatePostBody.extend({
  metadata: CreatePostBody.shape.metadata.extend({
    eventTime: z.date().or(z.string()),
  }),
});

export type CreateEventBodyType = z.TypeOf<typeof CreateEventBodySchema>;

export const CreateInTheMediaBodySchema = z.object({
  title: z.string(),
  author: z.string().default("ISCM"),
  description: z.string().optional(),
  publishDate: z
    .date()
    .or(z.string())
    .transform((date) => new Date(date)),
  type: z.enum(["pdf", "link"]),
  url: z.string(),
});

export type CreateInTheMediaBodyType = z.TypeOf<
  typeof CreateInTheMediaBodySchema
>;

export const UpdatePostBody = z.object({
  metadata: z
    .object({
      title: z.string().min(1).optional(),
      thumbnail: z
        .string()
        .transform((imgName) => {
          if (
            imgName.trim().startsWith(envConfig.MEDIA_UPLOAD_FOLDER) ||
            imgName.trim().startsWith("http")
          )
            return imgName;

          const normalizePath = imgName.startsWith("/")
            ? imgName
            : "/" + imgName;

          return `${envConfig.MEDIA_UPLOAD_FOLDER}${normalizePath}`;
        })
        .optional(),
      draft: z.boolean().optional(),
      publishDate: z.date().or(z.string()).optional(),
      sdgs: z.number().array().max(3).optional(),
      description: z.string().optional(),
      categories: z.number().array().optional(),
      eventTime: z.date().or(z.string()).optional(),
      portal_thumb: z.string().optional(),
      portal_background: z.string().optional(),
    })
    .optional(),
  content: z.string().min(1).optional(),
});

export type UpdatePostBodyType = z.TypeOf<typeof UpdatePostBody>;

// Pending Post
export const PortalSchema = z.object({
  id: z.string().or(z.number()),
  title: z.string(),
  publishDate: z.date(),
  thumbnail: z.string(),
  author: z.string().default("Portal"),
  description: z.string().default(""),
  sdgs: z.number().array().nonempty().max(3).optional(),
  content: z.string(),
  categories: z.number().array().nonempty(),
});

export type PortalType = z.TypeOf<typeof PortalSchema>;

export const ExternalPostBody = z
  .object({
    id: z.number(),
    lang: z.enum(["vi", "en"]),
    title: z.string(),
    publishDate: z.string().default(new Date().toISOString()),
    thumbnail: z.string().transform((url) => {
      if (url.startsWith("http")) return url;

      url = url.startsWith("/") ? url : "/" + url;
      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${envConfig.MEDIA_UPLOAD_FOLDER}${url}`.trim();
    }),
    content: z.string(),
    shortDesc: z.string(),
    sdgs: z.number().array().nonempty().max(3),
    categories: z.number().array().nonempty(),
    background: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    background: data.background ?? data.thumbnail,
  }));

export type ExternalPostBodyType = z.TypeOf<typeof ExternalPostBody>;

// For Post From ISCM -> Portal
export const CreatePortalPostBody = z.object({
  id: z.number(),
  lang: z.enum(["vi", "en"]),
  title: z.string(),
  publishDate: z.string().default(new Date().toISOString()),
  thumbnail: z.string().transform((url) => {
    if (url.startsWith("http")) return url;

    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${envConfig.MEDIA_UPLOAD_FOLDER}${url}`.trim();
  }),
  content: z.string(),
  shortDesc: z.string(),
  sdgs: z.number().array().nonempty().max(3),
  categories: z.number().array().nonempty(),
  background: z.string().transform((url) => {
    if (url.startsWith("http")) return url;

    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${envConfig.MEDIA_UPLOAD_FOLDER}${url}`.trim();
  }),
  local_cate: z.enum([
    "news",
    "student_life",
    "evolving_research",
    "open_admission",
  ]),
});

export type CreatePortalPostBodyType = z.TypeOf<typeof CreatePortalPostBody>;

export const UpdatePortalPostBody = z.object({
  id: z
    .string()
    .or(z.number())
    .transform((val) => {
      return Number(val);
    }),
  lang: z.enum(["vi", "en"]),
  title: z.string().min(1).optional(),
  categories: z.number().array().nonempty(),
  thumbnail: z
    .string()
    .transform((url) => {
      if (url.startsWith("http")) return url;

      url = url.startsWith("/") ? url : "/" + url;
      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${envConfig.MEDIA_UPLOAD_FOLDER}${url}`.trim();
    })
    .optional(),
  content: z.string().min(1).optional(),
  shortDesc: z.string().optional(),
  sdgs: z.number().array().nonempty().max(3).optional(),
  background: z
    .string()
    .transform((url) => {
      if (url.startsWith("http")) return url;

      url = url.startsWith("/") ? url : "/" + url;
      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${envConfig.MEDIA_UPLOAD_FOLDER}${url}`.trim();
    })
    .optional(),
  updateDate: z.string().default(new Date().toISOString()),
});

export type UpdatePortalPostBodyType = z.TypeOf<typeof UpdatePortalPostBody>;

export const InTheMediaSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  description: z.string().optional(),
  publishDate: z.date(),
  type: z.enum(["pdf", "link"]),
  url: z.string(),
});

export type InTheMediaType = z.TypeOf<typeof InTheMediaSchema>;

export const RecruitmentListSchema = z.object({
  id: z.number(),
  title: z.string(),
  publishDate: z
    .date()
    .or(z.string().transform((val) => new Date(val)))
    .default(new Date()),
  applicationPeriod: z.date().nullable(),
  progress: z.boolean().default(true),
  slug: z.string(),
  thumbnail: z
    .string()
    .nullable()
    .transform((val) => {
      if (!val) return null;

      if (val.trim().startsWith("http")) return val;

      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${
        val.startsWith("/") ? val : "/" + val
      }`.trim();
    }),
  jobType: z.string().nullable(),
});
export type RecruitmentListType = z.TypeOf<typeof RecruitmentListSchema>;

export const RecruitmentSchema = z.object({
  metadata: z.object({
    id: z.number(),
    title: z.string(),
    publishDate: z
      .date()
      .or(z.string().transform((val) => new Date(val)))
      .default(new Date()),
    progress: z.boolean().default(true),
    thumbnail: z
      .string()
      .nullable()
      .transform((val) => {
        if (!val) return null;

        if (val.trim().startsWith("http")) return val;

        return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${
          val.startsWith("/") ? val : "/" + val
        }`.trim();
      }),
    slug: z.string(),
  }),
  content: z.string(),
});
export type RecruitmentType = z.TypeOf<typeof RecruitmentSchema>;
