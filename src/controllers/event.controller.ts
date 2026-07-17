import { FastifyReply, FastifyRequest } from "fastify";

// Import types
import {
  CreateResType,
  UpdateResType,
  PostListResType,
  PostParamsRequestType,
  PostResType,
} from "@/types/post.types";
import { ErrorResType } from "@/types/error.types";

import {
  CreateEventBodySchema,
  CreateEventBodyType,
  EventCardSchema,
  EventCardType,
  EventPostSchema,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";
import EventModel from "@/models/event.model";
import DraftPostModel from "@/models/draft.model";

// Import Utils
import { prefixImageSrc } from "@/utils/MdHandler";

async function getEventList(
  request: FastifyRequest<{ Querystring: { page: number } }>,
  reply: FastifyReply<{
    Reply: { 200: PostListResType<EventCardType>; 500: ErrorResType };
  }>,
): Promise<void> {
  const lang: LangType = request.lang;
  const page = request.query.page || 1;
  const eventModel = new EventModel(lang);
  try {
    const postList: Array<EventCardType> = [];

    const rows = (await eventModel.getAllCard(page, !!request.user)).rows;

    for (const row of rows) {
      const parse = EventCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      postList.push(parse.data);
    }

    const totalPage = await eventModel.getTotalPage();

    reply.code(200).send({
      data: postList,
      totalPage: totalPage,
      message: "Get Event List Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    return reply.code(500).send({
      message: e.message,
    });
  }
}

async function getLatestPosts(request: FastifyRequest, reply: FastifyReply) {
  const model = new EventModel(request.lang);

  try {
    const postList: Array<EventCardType> = [];
    const data = (await model.getLatestPost()).rows;

    for (const row of data) {
      const parse = EventCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      postList.push(parse.data);
    }

    reply.code(200).send({
      data: postList,
      message: "Get latest posts success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

async function getEventPost(
  request: FastifyRequest<{ Params: PostParamsRequestType }>,
  reply: FastifyReply<{
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>,
) {
  const lang = request.lang;
  const eventModel = new EventModel(lang);
  const portalModel = new DraftPostModel(lang);

  try {
    const response = await eventModel.getPost(
      request.params["*"],
      !!request.user,
    );

    if (!response.rowCount)
      reply.code(404).send({ message: "The post was not found!" });

    const { content, ...metadata } = response.rows[0];

    const parse = EventPostSchema.safeParse({
      metadata,
      content: prefixImageSrc(content),
    });

    if (!parse.success) throw new Error(parse.error.message);

    reply.code(200).send({
      data: { metadata: parse.data.metadata, content: parse.data.content },
      message: "Get Event Post Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    return reply.code(500).send({
      message: e.message,
    });
  }
}

async function createEventPost(
  request: FastifyRequest<{
    Body: CreateEventBodyType;
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: CreateResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const lang: LangType = request.query.lang || "en";
  const eventModel = new EventModel(lang);

  try {
    const postParse = CreateEventBodySchema.safeParse({
      metadata: {
        ...body.metadata,
        author: request.user.username,
      },
      content: body.content,
    });

    if (postParse.error) {
      console.log(postParse.error, "post parse error");
      throw new Error("Error parsing");
    }

    console.log(postParse.data, "aaa");

    const newRow = await eventModel.insertPost({
      metadata: postParse.data.metadata,
      content: postParse.data.content,
    });

    reply.code(200).send({
      data: newRow.rows[0],
      message: "Create Event Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function updateEventPost(
  request: FastifyRequest<{
    Body: UpdatePostBodyType;
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: UpdateResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const eventModel = new EventModel(request.lang);
  const portalModel = new DraftPostModel(request.lang);

  const id = request.params["*"];
  const { metadata: { categories = null, ...meta } = {}, content } = body;

  try {
    if (Number.isNaN(id)) throw new Error("Invalid Post ID");

    await eventModel.updatePost(id, {
      metadata: meta,
      content: content,
    });

    reply.code(200).send({
      message: `Update Event Post ${id} Successfully`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function deletePost(
  request: FastifyRequest<{ Params: PostParamsRequestType }>,
  reply: FastifyReply<{
    Reply: {
      200: { message: string };
      500: ErrorResType;
    };
  }>,
) {
  const eventModel = new EventModel(request.lang);

  try {
    await eventModel.deletePost(request.params["*"]);
    reply.code(200).send({
      message: `Delete Post With ID: ${request.params["*"]} Successfully`,
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
  getEventList,
  getEventPost,
  getLatestPosts,
  createEventPost,
  updateEventPost,
  deletePost,
};
