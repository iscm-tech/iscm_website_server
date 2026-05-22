import envConfig from "config";
import z from "zod";

export const CompetitionSchema = z.object({
  title: z.string(),
  image: z
    .string()
    .nullable()
    .optional()
    .transform((url) => {
      if (!url) return null;
      url = url.startsWith("/") ? url : "/" + url;
      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
    }),
  register: z
    .string()
    .nullable()
    .optional()
    .transform((url) => {
      if (!url) return null;
      url = url.startsWith("/") ? url : "/" + url;
      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
    }),
  linkRegister: z.string(),
  fb: z
    .string()
    .nullable()
    .optional()
    .transform((url) => {
      if (!url) return null;
      url = url.startsWith("/") ? url : "/" + url;
      return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
    }),
  linkFB: z.string().nullable().optional(),
  isLaunch: z.boolean(),
  content: z.string(),
  registrationContent: z.string().default(""),
});

export type CompetitionType = z.TypeOf<typeof CompetitionSchema>;

export const CompetitionCardSchema = z.object({
  title: z.string(),
  image: z.string().transform((url) => {
    if (!url) return null;
    url = url.startsWith("/") ? url : "/" + url;
    return `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}/${process.env.STATIC_DIR}/static${url}`;
  }),
  draft: z.boolean().default(false),
  isLaunch: z.boolean(),
  weight: z.number(),
  id: z.string(),
});

export type CompetitionCardType = z.TypeOf<typeof CompetitionCardSchema>;
