import { FastifyReply, FastifyRequest } from "fastify";

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

async function getAdmissionList(
  request: FastifyRequest<{
    Querystring: { page: number; lang: LangType };
  }>,
  reply: FastifyReply<{ Reply: { 200: PostListResType; 500: ErrorResType } }>,
): Promise<void> {
  const lang: LangType = request.query.lang || "en";
  const page: number = request.query.page || 1;

  try {
    const postList: Array<PostCardType> = [];
    const model = new PostModel(lang, "open_admission");

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
      message: `Get Admission List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getLatestAdmission(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const lang = request.lang;
  const model = new PostModel(lang, "open_admission");

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

async function getAdmissionPost(
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
    const model = new PostModel(lang, "open_admission");
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

    // Check if the post has already posted to portal, if yes, get portal info to send to client for easier update on portal if the user want to update the post
    const portal = await portalModel.isPostUpToPortal(
      parse.data.metadata.id,
      "open_admission",
    );

    reply.code(200).send({
      data: { metadata: parse.data.metadata, content: parse.data.content },
      posted_portal: portal.rowCount
        ? {
            portalCategories: portal.rows[0].categories,
            thumbnail: portal.rows[0].portal_thumb,
            background: portal.rows[0].portal_background,
          }
        : undefined,
      message: "Get Admission Post Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function createAdmissionPost(
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

  const model = new PostModel(lang, "open_admission");

  try {
    // Handle Save Content Files
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
      message: "Create Admission Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function updateAdmissionPost(
  request: FastifyRequest<{
    Body: UpdatePostBodyType;
    Params: PostParamsRequestType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: UpdateResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const model = new PostModel(request.lang, "open_admission");
  const portalModel = new DraftPostModel(request.lang);

  const id = request.params.title;
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

    //--------- IF POST HAS ALREADY POSTED TO PORTAL, NEED TO UPDATE ON PORTAL TOO ------------
    const isPostUpToPortal = (
      await portalModel.isPostUpToPortal(Number(id), "open_admission")
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
    // ------------------------ END UPDATE ON PORTAL -------------------------------------

    await model.updatePost(id, {
      metadata: baseMeta,
      content: content,
    });

    reply.code(200).send({
      message: `Update Admission Post ${request.params.title} Successfully`,
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
  const model = new PostModel(request.lang, "open_admission");

  try {
    await model.deletePost(request.params.title);
    reply.code(200).send({
      message: `Delete Post With ID: ${request.params.title} Successfully`,
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
  getAdmissionList,
  getLatestAdmission,
  getAdmissionPost,
  createAdmissionPost,
  updateAdmissionPost,
  deletePost,
};
