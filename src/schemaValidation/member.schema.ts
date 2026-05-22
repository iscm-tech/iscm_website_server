import envConfig from "config";
import z from "zod";

export const MemberMetadata = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  image: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${url}`;
  }),
  interest: z.array(z.string()).nullable().default(null),
  bio: z.string(),
  email: z.string().nullable(),
  draft: z.boolean().default(false),
  order: z.number().default(-1),
});

export const MemberSchema = z
  .object({
    metadata: MemberMetadata,
    detail: z.string().default(""),
  })
  .describe("metadata");

export type MemberType = z.TypeOf<typeof MemberSchema>;

export const MemberCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  order: z.number().default(-1),
  draft: z.boolean().default(false),
  image: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}${url}`;
  }),
});

export type MemberCardType = z.TypeOf<typeof MemberCardSchema>;

export const CreateMemberBody = z.object({
  metadata: z.object({
    id: z.string(),
    name: z.string().min(1),
    title: z.string().min(1),
    image: z.string().transform((url) => {
      url = url.startsWith("/") ? url : "/" + url;
      return `/${process.env.STATIC_DIR}/static${url}`;
    }),
    interest: z.array(z.string()).nullable().default(null),
    bio: z.string(),
    email: z.string().nullable(),
    draft: z.boolean().default(false),
    order: z.number().default(-1),
  }),
  detail: z.string(),
});

export type CreateMemberType = z.TypeOf<typeof CreateMemberBody>;

export const UpdateMemberBody = z.object({
  metadata: z
    .object({
      name: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      image: z
        .string()
        .transform((imgName) => {
          if (imgName.startsWith("/images")) return imgName;

          return `/images/${imgName}`;
        })
        .optional(),
      interest: z.array(z.string()).nullable().default(null).optional(),
      bio: z.string().optional(),
      email: z.string().nullable().optional(),
      draft: z.boolean().optional(),
      order: z.number().optional(),
    })
    .optional(),
  detail: z.string().optional(),
});

export type UpdateMemberType = z.TypeOf<typeof UpdateMemberBody>;
