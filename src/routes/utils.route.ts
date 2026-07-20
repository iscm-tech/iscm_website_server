import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ErrorResType } from "@/types/error.types";
import { PostListResType, PostParamsRequestType } from "@/types/post.types";
import {
  getLatestPosts,
  getPortalPost,
  searchPost,
} from "@/controllers/utils.controller";
import { generateAPIKey } from "@/utils/crypto";
import HighLightPostModel from "@/models/highligh-post.model";
import { requiredLoginedHook } from "@/hooks/auth.hook";
import z from "zod";
import { PostCardSchema } from "@/schemaValidation/post.schema";
import { Pool } from "pg";
import envConfig from "config";

const BodyPin = z.object({
  id: z.string(),
  category: z.string(),
  pinDate: z.string(),
});

async function utilsRoute(server: FastifyInstance) {
  // server.post(
  //   "/update-table",
  //   async (
  //     request: FastifyRequest<{
  //       Body: { lang: string; sql: string; values: any[] };
  //     }>,
  //     reply: FastifyReply,
  //   ) => {
  //     const lang: string = request.body.lang;
  //     const sql = request.body.sql;
  //     const values = request.body.values;

  //     const model = new Pool({
  //       user: envConfig.POSTGRES_USER,
  //       host: envConfig.POSTGRES_DB_HOST,
  //       database:
  //         lang === "en" ? envConfig.POSTGRES_DB_EN : envConfig.POSTGRES_DB_VI,
  //       password: envConfig.POSTGRES_PASSWORD,
  //       port: envConfig.POSTGRES_DB_PORT,
  //       max: 500,
  //       idleTimeoutMillis: 30000,
  //       connectionTimeoutMillis: 2000,
  //     });

  //     const repsonse = await model.query(sql, values);

  //     reply.code(200).send(repsonse);
  //   },
  // );

  server.get<{
    Params: PostParamsRequestType;
    Querystring: {
      lang: LangType;
      page: number;
      postPerPage: number | undefined;
    };
    Reply: { 200: PostListResType; 500: ErrorResType };
  }>("/latest-posts", getLatestPosts);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: {
      lang: LangType;
      page: number;
      postPerPage: number | undefined;
    };
    Reply: { 200: PostListResType; 500: ErrorResType };
  }>("/latest-portal", getPortalPost);

  server.get(
    "/generate-api-key",
    (request: FastifyRequest, reply: FastifyReply) => {
      const key = generateAPIKey();

      reply.code(200).send(key);
    },
  );

  server.get<{ Params: PostParamsRequestType }>(
    "/highlight",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const model = new HighLightPostModel(request.lang);

      try {
        const response = (await model.getCard()).rows[0];

        const parse = PostCardSchema.safeParse(response);

        if (!parse.success) throw new Error(parse.error.message);

        reply.code(200).send({
          data: parse.data,
          message: `Get Hightlight Post Success`,
        });
      } catch (error) {
        console.log(error);
        reply.code(500).send({
          message: error,
        });
      }
    },
  );

  server.get<{ Querystring: { q: string } }>("/search", searchPost);

  server.post<{
    Params: PostParamsRequestType;
    Body: {
      id: string;
      category: string;
      pinDate: Date;
    };
  }>(
    "/highlight",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: BodyPin,
      },
    },
    async (
      request: FastifyRequest<{
        Params: PostParamsRequestType;
        Body: {
          id: string;
          category: string;
          pinDate: Date;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const body = request.body;
      const model = new HighLightPostModel(request.lang);

      try {
        await model.pinPost(body.id, body.category, body.pinDate);

        reply.code(200).send({
          message: `Pin Hightlight Post Success`,
        });
      } catch (_e) {
        const error = _e as Error;
        console.log(error);
        if (error.cause === 404) {
          reply.code(404).send({
            message: error.message,
          });
          return;
        }
        reply.code(500).send({
          message: error,
        });
      }
    },
  );

  server.delete<{ Params: PostParamsRequestType }>(
    "/highlight/:title",
    { preValidation: [requiredLoginedHook] },
    async (
      request: FastifyRequest<{ Params: PostParamsRequestType }>,
      reply: FastifyReply,
    ) => {
      const model = new HighLightPostModel(request.lang);

      try {
        await model.unPinPost(request.params.title);

        reply.code(200).send({
          message: "Unpin Highlight Post Success",
        });
      } catch (_e) {
        const error = _e as ErrorResType;
        console.log(error);
        reply.code(500).send({
          message: error,
        });
      }
    },
  );
}

export default utilsRoute;
