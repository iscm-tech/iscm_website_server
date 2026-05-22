import envConfig from "config";
import { title } from "node:process";
import z, { object } from "zod";

export const CourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  duration: z.string(),
  program_structure: z
    .array(
      z.object({
        years: z.string(),
        image: z.string().transform((url) => {
          url = url.startsWith("/") ? url : "/" + url;
          return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
        }),
      }),
    )
    .optional(),
  content: z.string(),
  gallery: z
    .array(
      z.string().transform((url) => {
        url = url.startsWith("/") ? url : "/" + url;
        return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
      }),
    )
    .optional(),
});

export type CourseType = z.TypeOf<typeof CourseSchema>;

export const CourseCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  duration: z.string(),
  slug: z.string(),
});

export type CourseCardType = z.TypeOf<typeof CourseCardSchema>;

export const UpdateCourseBodySchema = z.object({
  title: z.string().optional(),
  thumbnail: z.string().optional(),
  duration: z.string().optional(),
  program_structure: z
    .array(
      z.object({
        years: z.string(),
        image: z.string(),
      }),
    )
    .optional(),
  content: z.string().optional(),
  order: z.number().optional(),
});

export type UpdateCourseBodyType = z.TypeOf<typeof UpdateCourseBodySchema>;

export const CreateCourseBodySchema = z.object({
  title: z.string(),
  thumbnail: z.string(),
  duration: z.string(),
  program_structure: z
    .array(
      z.object({
        years: z.string(),
        image: z.string(),
      }),
    )
    .optional(),
  content: z.string(),
});

export type CreateCourseBodyType = z.TypeOf<typeof CreateCourseBodySchema>;

export const NondegreeCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  duration: z.object({
    value: z.number(),
    unit: z.string(),
  }),
  thumbnail: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  location: z.string(),
  language: z.enum(["vi", "en"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  experienceRequirements: z.string().nullable().optional(),
  description: z.string(),
  slug: z.string(),
  objectives: z.string(),
  structure: z.array(
    z.object({
      title: z.string(),
      content: z.string().nullable().optional(),
      thumb: z.string().transform((url) => {
        url = url.startsWith("/") ? url : "/" + url;
        return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
      }),
    }),
  ),
  instructors: z.array(
    z.object({
      name: z.string(),
      title: z.string().nullable().optional(),
      avatar: z.string().transform((url) => {
        url = url.startsWith("/") ? url : "/" + url;
        return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
      }),
    }),
  ),
  offerBy: z
    .array(
      z.object({
        name: z.string(),
        avatar: z.string().transform((url) => {
          url = url.startsWith("/") ? url : "/" + url;
          return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
        }),
      }),
    )
    .nullable()
    .optional(),
  summarize: z.array(
    z.object({
      title: z.string(),
      value: z.string().or(z.number()),
    }),
  ),
});
export type NondegreeCourseType = z.TypeOf<typeof NondegreeCourseSchema>;

export const NondegreeCourseCardSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  thumbnail: z.string().transform((url) => {
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  duration: z.object({
    value: z.number(),
    unit: z.string(),
  }),
  location: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});
export type NondegreeCourseCardType = z.TypeOf<
  typeof NondegreeCourseCardSchema
>;
