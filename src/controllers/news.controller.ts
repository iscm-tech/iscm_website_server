import { FastifyReply, FastifyRequest } from "fastify";
import { isValid, parse } from "date-fns";

import {
  CreateResType,
  UpdateResType,
  PostListResType,
  PostParamsRequestType,
  PostResType,
} from "@/types/post.types";
import { ErrorResType } from "@/types/error.types";

import {
  CreatePostBody,
  CreatePostBodyType,
  PostCardSchema,
  PostCardType,
  PostSchema,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";
import DraftPostModel from "@/models/draft.model";
import PostModel from "@/models/posts.model";

import updatePortalHook from "@/hooks/updatePortal.hook";
import { prefixImageSrc } from "@/utils/MdHandler";

async function getNewsList(
  request: FastifyRequest<{
    Querystring: { page: number; lang: LangType };
  }>,
  reply: FastifyReply<{ Reply: { 200: PostListResType; 500: ErrorResType } }>,
): Promise<void> {
  const lang: LangType = request.query.lang || "en";
  const page: number = request.query.page || 1;

  try {
    const postList: Array<PostCardType> = [];
    const model = new PostModel(lang, "news");

    const rows = (await model.getAllCard(page, !!request.user)).rows;
    for (const row of rows) {
      const parse = PostCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      postList.push(parse.data);
    }

    const totalPage = await model.getTotalPage();

    // Reply
    reply.code(200).send({
      data: postList,
      totalPage: totalPage,
      message: `Get News List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

async function getNews(
  request: FastifyRequest<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>,
): Promise<void> {
  const lang: LangType = request.query.lang || "en";
  const slug = request.params["*"];

  try {
    const model = new PostModel(lang, "news");
    const portalModel = new DraftPostModel(request.lang);

    const response = await model.getPost(slug, !!request.user);

    if (!response.rowCount)
      reply.code(404).send({ message: "The post was not found!" });

    const { content, ...metadata } = response.rows[0];

    const parse = PostSchema.safeParse({
      metadata,
      content: prefixImageSrc(content),
    });

    if (!parse.success) throw new Error(parse.error.message);

    const portal = await portalModel.isPostUpToPortal(
      parse.data.metadata.id,
      "news",
    );
    // console.log(portal);

    reply.code(200).send({
      data: { metadata: parse.data.metadata, content: parse.data.content },
      posted_portal: portal.rowCount
        ? {
            portalCategories: portal.rows[0].categories,
            thumbnail: portal.rows[0].portal_thumb,
            background: portal.rows[0].portal_background,
          }
        : undefined,
      message: "Get News Post Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

async function getLatestPost(request: FastifyRequest, reply: FastifyReply) {
  const lang = request.lang;
  const model = new PostModel(lang, "news");

  try {
    const cardList: Array<PostCardType> = [];
    const data = (await model.getLatestPost()).rows;

    for (const row of data) {
      const parse = PostCardSchema.safeParse(row);
      if (!parse.success) throw new Error(parse.error.message);

      cardList.push(parse.data);
    }

    reply.code(200).send({
      data: cardList,
      message: "Get latest posts success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

async function getAllCardByMonth(
  request: FastifyRequest<{ Querystring: { lang: LangType; month: string } }>,
  reply: FastifyReply,
) {
  const model = new PostModel(request.lang, "news");
  const month = request.query.month;
  let monthNumber;
  try {
    // Validate query month string
    if (!/^(0[1-9]|1[0-2])$/.test(month)) {
      const parsedDate = parse(month, "MMMM", new Date());
      // Check Is Month String is Valid ???
      if (!(isValid(parsedDate) && month.length > 0))
        throw new Error("Month String Is Invalid!");
      // Parse Month String (January, April,...) to Number String (01, 02, ...)
      monthNumber = String(parsedDate.getMonth() + 1).padStart(2, "0");
    } else {
      monthNumber = month;
    }

    // Handle Query Posts By Month
    const postList: Array<PostCardType> = [];
    const rows = (await model.getAllCardByMonth(monthNumber)).rows;

    for (const row of rows) {
      const parse = PostCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      postList.push(parse.data);
    }

    reply.code(200).send({
      data: postList,
      message: `Get All Posts In Month ${monthNumber} Success!`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send(e);
  }
}

async function createNewsPost(
  request: FastifyRequest<{
    Body: CreatePostBodyType;
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: CreateResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const lang: LangType = request.query.lang || "en";

  const model = new PostModel(lang, "news");

  try {
    const postParse = CreatePostBody.safeParse({
      metadata: {
        ...body.metadata,
        author: request.user.username,
        publishDate: new Date(body.metadata.publishDate),
        slug: body.metadata.slug,
      },
      content: body.content,
    });

    if (postParse.error) {
      console.log(postParse.error, "post parse error");
      throw new Error("Error parsing");
    }

    const newRow = await model.insertPost({
      metadata: postParse.data.metadata,
      content: postParse.data.content,
    });

    reply.code(200).send({
      data: newRow.rows[0],
      message: "Create News Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function updateNewsPost(
  request: FastifyRequest<{
    Body: UpdatePostBodyType;
    Params: PostParamsRequestType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: UpdateResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const model = new PostModel(request.lang, "news");
  const portalModel = new DraftPostModel(request.lang);

  const id = request.params["*"];
  const {
    metadata: {
      categories = null,
      portal_thumb = undefined,
      portal_background = undefined,
      ...baseMeta
    } = {},
    content,
  } = body;

  try {
    if (Number.isNaN(id)) throw new Error("Invalid Post ID");

    //--------- IF THE POST HAS ALREADY POSTED TO PORTAL, NEED TO UPDATE ON PORTAL TOO ------------
    const isPostUpToPortal = (
      await portalModel.isPostUpToPortal(Number(id), "news")
    ).rowCount;

    if (isPostUpToPortal && categories) {
      updatePortalHook({
        metadata: baseMeta,
        content,
        categories,
        lang: request.lang,
        id: id.toString(),
        portal_thumb: portal_thumb,
        portal_background: portal_background,
      });
    }
    /* =================================================================================================== */

    await model.updatePost(id, {
      metadata: baseMeta,
      content: content,
    });

    reply.code(200).send({
      message: `Update News Post ${request.params["*"]} Successfully`,
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
  const model = new PostModel(request.lang, "news");

  try {
    await model.deletePost(request.params["*"]);
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
  getNewsList,
  getLatestPost,
  getNews,
  getAllCardByMonth,
  createNewsPost,
  updateNewsPost,
  deletePost,
};
