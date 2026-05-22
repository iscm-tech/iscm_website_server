import { FastifyInstance } from "fastify";
import {
  getCollaborationList,
  getCollaborationProject,
  getISCMProject,
  getISCMStudioList,
} from "@/controllers/studiolab.controller";
import { ErrorResType } from "@/types/error.types";
import {
  CollaborationStudioListResType,
  CollaborationStudioProjectResType,
} from "@/types/studiolab.type";
import { PostParamsRequestType } from "@/types/post.types";

async function studiolabRoute(server: FastifyInstance) {
  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: CollaborationStudioListResType; 500: ErrorResType };
  }>("/collaboration_studio", getCollaborationList);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: CollaborationStudioProjectResType; 500: ErrorResType };
  }>("/collaboration_studio/:title", getCollaborationProject);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: CollaborationStudioListResType; 500: ErrorResType };
  }>("/iscm_studio", getISCMStudioList);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: CollaborationStudioProjectResType; 500: ErrorResType };
  }>("/iscm_studio/:title", getISCMProject);
}

export default studiolabRoute;
