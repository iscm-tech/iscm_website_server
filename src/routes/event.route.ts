import { FastifyInstance } from "fastify";
import {
  CreateResType,
  UpdateResType,
  PostListResType,
  PostParamsRequestType,
  PostResType,
} from "@/types/post.types";
import { ErrorResType } from "@/types/error.types";
import {
  createEventPost,
  deletePost,
  getEventList,
  getEventPost,
  getLatestPosts,
  updateEventPost,
} from "@/controllers/event.controller";
import { checkIsLogined, requiredLoginedHook } from "@/hooks/auth.hook";
import {
  CreateEventBodySchema,
  CreateEventBodyType,
  EventCardType,
  UpdatePostBody,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";

async function eventRoute(server: FastifyInstance) {
  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: PostListResType<EventCardType>; 500: ErrorResType };
  }>("/", { preHandler: [checkIsLogined] }, getEventList);

  server.get<{ Querystring: { lang: LangType } }>(
    "/latest-posts",
    getLatestPosts
  );

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>("/*", { preHandler: [checkIsLogined] }, getEventPost);

  server.post<{
    Reply: { 200: CreateResType; 500: ErrorResType };
    Querystring: { lang: LangType };
    Body: CreateEventBodyType;
    Params: PostParamsRequestType;
  }>(
    "/",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: CreateEventBodySchema,
      },
    },
    createEventPost
  );

  server.put<{
    Reply: { 200: UpdateResType; 500: ErrorResType };
    Querystring: { lang: LangType };
    Body: UpdatePostBodyType;
    Params: PostParamsRequestType;
  }>(
    "/*",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: UpdatePostBody,
      },
    },
    updateEventPost
  );

  server.delete<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Reply: {
      200: { message: string };
      500: ErrorResType;
    };
  }>("/*", { preValidation: [requiredLoginedHook] }, deletePost);
}

export default eventRoute;
