import { type FastifyRequest, FastifyInstance, FastifyReply } from "fastify";
import { UserType } from "./schemaValidation/users.schema";

declare global {
  type LangType = "vi" | "en";
  interface FileType {
    isDir: boolean;
    fullPath: string;
  }
  interface GlobalThis {
    myContentsDB: { [key: string]: Array<any> };
  }

  const myGlobalContentsStorage: { [key: string]: Array<any> };
}

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface FastifyInstance {}
  interface FastifyRequest {
    cookies: {
      sessionToken: string;
    };
    user: UserType;
    path: FileType;
    lang: LangType;
  }
}
