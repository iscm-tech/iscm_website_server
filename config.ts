import z from "zod";
import { config } from "dotenv";

config({
  path: ".env",
});

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  SESSION_TOKEN_SECRET: z.string(),
  SESSION_TOKEN_EXPIRES_IN: z.string(),
  SERVER_DOMAIN: z.string(),
  SERVER_PROTOCOL: z.string(),
  MEDIA_UPLOAD_FOLDER: z.string(),
  API_KEY: z.string(),
  POSTGRES_DB_HOST: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB_EN: z.string(),
  POSTGRES_DB_VI: z.string(),
  POSTGRES_DB_PORT: z.string().transform((val) => Number(val)),
  PORTAL_AUTHORIZATION: z.string(),
  EMAIL_APP_USERNAME: z.string(),
  EMAIL_APP_PASS: z.string(),
});

const configServer = configSchema.safeParse(process.env);

if (!configServer.success) {
  console.error(configServer.error.issues);
  throw new Error("Các giá trị khai báo trong file .env không hợp lệ");
}
const envConfig = configServer.data;
export const API_URL = `${envConfig.SERVER_PROTOCOL}://${envConfig.SERVER_DOMAIN}`;

export default envConfig;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<typeof configSchema> {}
  }
}
