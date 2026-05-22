import {
  getCompetition,
  getCompetitionList,
} from "@/controllers/competition.controller";
import {
  CompetitionListResType,
  CompetitionParamsRequestType,
  CompetitionResType,
} from "@/types/competition.types";
import { ErrorResType } from "@/types/error.types";
import { FastifyInstance } from "fastify";

async function competitionRoute(server: FastifyInstance) {
  server.get<{
    Params: CompetitionParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: CompetitionListResType; 500: ErrorResType };
  }>("/", getCompetitionList);

  server.get<{
    Params: CompetitionParamsRequestType;
    Querystring: { lang: LangType };
    Reply: { 200: CompetitionResType; 500: ErrorResType };
  }>("/:slug", getCompetition);
}

export default competitionRoute;
