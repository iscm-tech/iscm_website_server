import { FastifyInstance } from "fastify";

import {
  getEvolvingResearchList,
  getEvolvingPost,
  createEvolvingPost,
  updateEvolvingPost,
  deletePost,
  getLatestPosts,
} from "@/controllers/evolving-research.controller";
import { checkIsLogined, requiredLoginedHook } from "@/hooks/auth.hook";
import {
  CreatePostBody,
  CreatePostBodyType,
  UpdatePostBody,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";
import { ErrorResType } from "@/types/error.types";
import {
  CreateResType,
  UpdateResType,
  PostListResType,
  PostParamsRequestType,
  PostResType,
} from "@/types/post.types";

async function evolvingResearchRoute(server: FastifyInstance) {
  server.get<{
    Params: PostParamsRequestType;
    Querystring: {
      lang: LangType;
      page: number;
      postPerPage: number | undefined;
    };
    Reply: { 200: PostListResType; 500: ErrorResType };
  }>("/", { preHandler: [checkIsLogined] }, getEvolvingResearchList);

  server.get<{ Querystring: { lang: LangType } }>(
    "/latest-posts",
    getLatestPosts,
  );

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>("/*", { preHandler: [checkIsLogined] }, getEvolvingPost);

  server.post<{
    Reply: { 200: CreateResType; 500: ErrorResType };
    Querystring: { lang: LangType };
    Body: CreatePostBodyType;
    Params: PostParamsRequestType;
  }>(
    "/",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: CreatePostBody,
      },
    },
    createEvolvingPost,
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
    updateEvolvingPost,
  );

  server.delete<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Reply: {
      200: { message: string };
      500: ErrorResType;
    };
  }>("/:title", { preValidation: [requiredLoginedHook] }, deletePost);
}

export default evolvingResearchRoute;
