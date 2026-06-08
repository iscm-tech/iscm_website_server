import PeopleModel from "@/models/people.model";
import {
  CreateMemberType,
  MemberCardSchema,
  MemberCardType,
  MemberSchema,
  UpdateMemberType,
} from "@/schemaValidation/member.schema";
import { ErrorResType } from "@/types/error.types";
import {
  CreateUpdateMemberResType,
  MemberListResType,
  MemberParamsRequestType,
  MemberResType,
} from "@/types/member.types";
import { FastifyReply, FastifyRequest } from "fastify";

async function getMemberList(
  request: FastifyRequest<{
    Querystring: { lang: LangType; type?: string };
    Params: MemberParamsRequestType;
  }>,
  reply: FastifyReply<{ Reply: { 200: MemberListResType; 500: ErrorResType } }>,
): Promise<void> {
  const memberModel = new PeopleModel(request.lang, request.params.category);

  try {
    const list = (await memberModel.getAllCard(request.query.type ?? "")).rows;

    const memberList: Array<MemberCardType> = [];

    for (const card of list) {
      const parse = MemberCardSchema.safeParse(card);

      if (parse.error) throw new Error(parse.error.message);
      memberList.push(parse.data);
    }

    // Reply
    reply.code(200).send({
      data: memberList,
      message: `Get ${request.params.category} List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getMember(
  request: FastifyRequest<{ Params: MemberParamsRequestType }>,
  reply: FastifyReply<{
    Reply: { 200: MemberResType; 500: ErrorResType; 404: { message: string } };
  }>,
): Promise<void> {
  const memberModel = new PeopleModel(request.lang, request.params.category);

  try {
    const data = await memberModel.getDetail(request.params.id_member);

    if (!data.rowCount) {
      reply.code(404).send({ message: "Member not found" });
      return;
    }

    const { detail, ...metadata } = data.rows[0];

    const parse = MemberSchema.safeParse({
      metadata: metadata,
      detail: detail,
    });

    if (parse.error) throw new Error(parse.error.message);

    reply.code(200).send({
      data: parse.data,
      message: "Get News Post Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function createNewMember(
  request: FastifyRequest<{
    Body: CreateMemberType;
    Params: MemberParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: CreateUpdateMemberResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const memberModel = new PeopleModel(request.lang, "members");

  try {
    const memberParse = MemberSchema.safeParse({
      metadata: {
        ...body.metadata,
        id: request.params.id_member,
        author: request.user.username,
        description: "",
      },
      detail: body.detail,
    });

    if (memberParse.error) {
      throw new Error("Error parsing");
    }

    await memberModel.insertPeople(memberParse.data);

    reply.code(200).send({
      data: memberParse.data,
      message: "Create Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function updateMember(
  request: FastifyRequest<{
    Params: MemberParamsRequestType;
    Body: UpdateMemberType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: CreateUpdateMemberResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const peopleMember = new PeopleModel(request.lang, request.params.category);

  try {
    console.log(request.params.id_member);
    console.log(body);
    await peopleMember.updateProfile(request.params.id_member, body);

    const { detail, ...metadata } = (
      await peopleMember.getDetail(request.params.id_member)
    ).rows[0];

    const parse = MemberSchema.safeParse({
      metadata: metadata,
      detail: detail,
    });

    if (parse.error) {
      throw new Error(parse.error.message);
    }

    reply.code(200).send({
      data: parse.data,
      message: "Update Member Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function deleteMember(
  request: FastifyRequest<{
    Params: MemberParamsRequestType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: { message: string }; 500: ErrorResType };
  }>,
) {
  const peopleModel = new PeopleModel(request.lang, request.params.category);

  try {
    await peopleModel.deletePeople(request.params.id_member);

    reply.code(200).send({
      message: `Delete Person ${request.params.id_member} successfully}`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

export {
  getMemberList,
  getMember,
  createNewMember,
  updateMember,
  deleteMember,
};
