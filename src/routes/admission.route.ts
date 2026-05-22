import { FastifyInstance } from "fastify";

import {
  getAdmissionList,
  getAdmissionPost,
  createAdmissionPost,
  updateAdmissionPost,
  deletePost,
  getLatestAdmission,
} from "@/controllers/admission.controller";
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

async function admissionRoute(server: FastifyInstance) {
  server.get<{
    Params: PostParamsRequestType;
    Querystring: {
      lang: LangType;
      page: number;
      postPerPage: number | undefined;
    };
    Reply: { 200: PostListResType; 500: ErrorResType };
  }>("/", { preHandler: [checkIsLogined] }, getAdmissionList);

  server.get("/latest-posts", getLatestAdmission);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>("/*", { preHandler: [checkIsLogined] }, getAdmissionPost);

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
    createAdmissionPost
  );

  server.put<{
    Reply: { 200: UpdateResType; 500: ErrorResType };
    Querystring: { lang: LangType };
    Body: UpdatePostBodyType;
    Params: PostParamsRequestType;
  }>(
    "/:title",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: UpdatePostBody,
      },
    },
    updateAdmissionPost
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

export default admissionRoute;
