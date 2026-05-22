import {
  getRecruitmentList,
  getRecruitmentPost,
} from "@/controllers/recruitment.controller";
import { PostParamsRequestType } from "@/types/post.types";
import { FastifyInstance } from "fastify";

async function recruitmentRoute(server: FastifyInstance) {
  server.get<{ Querystring: { lang: LangType } }>("/", getRecruitmentList);

  server.get<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>("/*", getRecruitmentPost);
}

export default recruitmentRoute;
