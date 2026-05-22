import RecruitmentModel from "@/models/recruitment.model";
import {
  RecruitmentListSchema,
  RecruitmentListType,
  RecruitmentSchema,
  RecruitmentType,
} from "@/schemaValidation/post.schema";
import { PostParamsRequestType } from "@/types/post.types";
import { prefixImageSrc } from "@/utils/MdHandler";
import { FastifyReply, FastifyRequest } from "fastify";

async function getRecruitmentList(
  request: FastifyRequest<{ Querystring: { lang: LangType } }>,
  reply: FastifyReply
) {
  const lang: LangType = request.query.lang || "en";

  try {
    const postList: Array<RecruitmentListType> = [];
    const recruitmentModel = new RecruitmentModel(lang);

    const rows = (await recruitmentModel.getAllRecruitment()).rows;
    for (const row of rows) {
      const parse = RecruitmentListSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      postList.push(parse.data);
    }

    reply.code(200).send({
      data: postList,
      message: `Get Recruitment List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

async function getRecruitmentPost(
  request: FastifyRequest<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply
) {
  const lang: LangType = request.query.lang || "en";
  const slug = request.params["*"];

  try {
    const model = new RecruitmentModel(lang);
    const response = await model.getRecruitmentPost(slug);

    if (!response.rowCount) {
      reply.code(404).send({ message: "The recruitment no longer available!" });
    }

    const { content, ...metadata } = response.rows[0];

    const parse = RecruitmentSchema.safeParse({
      metadata,
      content: prefixImageSrc(content),
    });


    if (!parse.success) throw new Error(parse.error.message);

    reply.code(200).send({
      data: { metadata: parse.data.metadata, content: parse.data.content },
      message: "Get Recruitment Post Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

export { getRecruitmentList, getRecruitmentPost };
