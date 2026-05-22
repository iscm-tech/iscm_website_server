import { FastifyInstance } from "fastify";

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
import {
  createStudentLifePost,
  deletePost,
  getLatestPost,
  getStudentLife,
  getStudentLifeList,
  updateStudentLifePost,
} from "@/controllers/student_life.controller";

async function studentLifeRoute(server: FastifyInstance) {
  server.get<{
    Params: PostParamsRequestType;
    Querystring: {
      lang: LangType;
      page: number;
      postPerPage: number | undefined;
    };
    Reply: { 200: PostListResType; 500: ErrorResType };
  }>("/", { preHandler: [checkIsLogined] }, getStudentLifeList);

  server.get("/latest-posts", getLatestPost);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>("/*", { preHandler: [checkIsLogined] }, getStudentLife);

  // server.get<{ Querystring: { lang: LangType; month: string } }>(
  //   "/by-month",
  //   getAllCardByMonth
  // );

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
    createStudentLifePost
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
    updateStudentLifePost
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

export default studentLifeRoute;
