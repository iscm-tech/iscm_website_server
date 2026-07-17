// import path from "path";
// import * as fs from "fs";

// import { categoryCase } from "@/constants";
import {
  acceptPostController,
  createPortalPostController,
  getAllPendingPost,
  getPendingPost,
  receiveNewPortalPostController,
  rejectPostController,
  updatePortalPostController,
} from "@/controllers/portal.controller";
import {
  CreatePortalPostBody,
  CreatePortalPostBodyType,
  ExternalPostBody,
  ExternalPostBodyType,
  UpdatePortalPostBody,
  UpdatePortalPostBodyType,
} from "@/schemaValidation/post.schema";
import { ErrorResType } from "@/types/error.types";
import { PostParamsRequestType } from "@/types/post.types";
import { FastifyInstance } from "fastify";
import { authenticateByAPIKey } from "@/middlewares/auth.middleware";
import { requiredLoginedHook } from "@/hooks/auth.hook";

type StatusType = "success" | "error";

async function portalRoute(server: FastifyInstance) {
  server.get<{ Querystring: { page: number } }>(
    "/",
    { preValidation: [requiredLoginedHook] },
    getAllPendingPost,
  );

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>("/:title", { preValidation: [requiredLoginedHook] }, getPendingPost);

  server.post<{
    Reply: { 200: { message: string; status: StatusType }; 500: ErrorResType };
    Querystring: { lang: LangType };
    Body: ExternalPostBodyType;
    Params: PostParamsRequestType;
    Headers: { "x-api-key": string };
  }>(
    "/create",
    {
      preValidation: [authenticateByAPIKey],
      schema: {
        body: ExternalPostBody,
      },
    },
    receiveNewPortalPostController,
  );

  server.post<{
    Body: CreatePortalPostBodyType;
  }>(
    "/create-portal",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: CreatePortalPostBody,
      },
    },
    createPortalPostController,
  );

  server.post<{
    Reply: { 200: { message: string }; 500: ErrorResType };
    Querystring: { lang: LangType };
    Params: PostParamsRequestType;
    Body: UpdatePortalPostBodyType;
  }>(
    "/update",
    {
      schema: {
        body: UpdatePortalPostBody,
      },
    },
    updatePortalPostController,
  );

  server.put<{
    Reply: { 200: { message: string }; 500: ErrorResType };
    Querystring: { lang: LangType };
    Params: {
      category:
      | "news"
      | "student_life"
      | "evolving_research"
      | "open_admission";
      id: string;
    };
  }>("/accept/:category/:id", acceptPostController);

  server.delete<{
    Reply: { 200: { message: string }; 500: ErrorResType };
    Params: { id: string };
    Querystring: { lang: LangType };
  }>("/reject/:id", rejectPostController);
}

export default portalRoute;
