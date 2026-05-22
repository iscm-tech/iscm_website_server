import { postPerPage } from "@/constants";
import {
  CompetitionCardSchema,
  CompetitionCardType,
  CompetitionSchema,
  CompetitionType,
} from "@/schemaValidation/competition.schema";
import {
  CompetitionListResType,
  CompetitionResType,
} from "@/types/competition.types";
import { ErrorResType } from "@/types/error.types";
import { getContentFiles } from "@/utils/fileHandler";
import { contentReader, md2html, metadataMdReader } from "@/utils/MdHandler";
import { FastifyReply, FastifyRequest } from "fastify";
import path from "path";

async function getCompetitionList(
  request: FastifyRequest<{ Querystring: { page: number } }>,
  reply: FastifyReply<{
    Reply: { 200: CompetitionListResType; 500: ErrorResType };
  }>
): Promise<void> {
  const dirPath: string = !request.path.isDir
    ? path.dirname(request.path.fullPath)
    : request.path.fullPath;

  const page: number = request.query.page || 1;
  try {
    const competitionList: Array<CompetitionCardType> = [];

    const files: Array<FileType> = [];

    await getContentFiles(dirPath, files);

    for (const file of files) {
      const filePath: string = file.fullPath;
      const content: CompetitionCardType = await metadataMdReader(
        filePath,
        CompetitionCardSchema
      );

      if (!content.draft) competitionList.push(content);
    }

    competitionList.sort((comp1, comp2) => {
      if (comp1.isLaunch) return 1;
      if (comp2.isLaunch) return -1;
      return -(comp1.weight - comp2.weight);
    });
    console.log(page);

    reply.code(200).send({
      data: competitionList.slice(
        (page - 1) * postPerPage,
        (page - 1) * postPerPage + postPerPage
      ),
      totalPage: Math.ceil(competitionList.length / postPerPage),
      message: "Get Competition List Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getCompetition(
  request: FastifyRequest,
  reply: FastifyReply<{
    Reply: { 200: CompetitionResType; 500: ErrorResType };
  }>
): Promise<void> {
  const competitionPath: FileType = request.path;

  try {
    const content: CompetitionType = await contentReader<CompetitionType>(
      competitionPath,
      CompetitionSchema,
      "GET",
      {
        preHandler: (objectRaw) => {
          if (!objectRaw.data?.isLaunch) {
            const part: Array<string> = objectRaw.content.split(
              "<!--REGISTRATION-->"
            );

            console.log(part.length);

            const content: string =
              part.length > 1 ? part[0].concat("\n", part[2]) : part[0];
            const registration: string = part[1];

            console.log(content);

            return {
              data: { ...objectRaw.data, registrationContent: registration },
              content: content,
            };
          }

          return {
            data: { ...objectRaw.data, registrationContent: "" },
            content: objectRaw.content,
          };
        },
        preSerialization: async (response) => {
          response.registrationContent = await md2html(
            response.registrationContent,
            "GET"
          );

          return response;
        },
      }
    );

    reply.code(200).send({
      data: content,
      headerPageInfo: {
        title: content.title,
      },
      message: "Get Competition Detail Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

export { getCompetition, getCompetitionList };
