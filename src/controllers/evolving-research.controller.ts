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

import { prefixImageSrc } from "@/utils/MdHandler";
import updatePortalHook from "@/hooks/updatePortal.hook";

async function getEvolvingResearchList(
  request: FastifyRequest<{
    Querystring: { page: number; lang: LangType };
  }>,
  reply: FastifyReply<{ Reply: { 200: PostListResType; 500: ErrorResType } }>,
): Promise<void> {
  const lang: LangType = request.query.lang || "en";
  const page: number = request.query.page || 1;

  try {
    const postList: Array<PostCardType> = [];
    const model = new PostModel(lang, "evolving_research");

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
      message: `Get Evolving Research List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getLatestPosts(request: FastifyRequest, reply: FastifyReply) {
  const model = new PostModel(request.lang, "evolving_research");

  try {
    const postList: Array<PostCardType> = [];
    const data = (await model.getLatestPost()).rows;

    for (const row of data) {
      const parse = PostCardSchema.safeParse(row);

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
async function getEvolvingPost(
  request: FastifyRequest<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: PostResType; 500: ErrorResType; 404: { message: string } };
  }>,
): Promise<void> {
  const lang: LangType = request.query.lang || "en";
  try {
    const model = new PostModel(lang, "evolving_research");
    const portalModel = new DraftPostModel(lang);

    const response = await model.getPost(request.params["*"], !!request.user);

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
      "evolving_research",
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
      message: "Get Evolving Research Post Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function createEvolvingPost(
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

  const model = new PostModel(lang, "evolving_research");

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
      message: "Create Evolving Research Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function updateEvolvingPost(
  request: FastifyRequest<{
    Body: UpdatePostBodyType;
    Params: PostParamsRequestType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: UpdateResType; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const model = new PostModel(request.lang, "evolving_research");
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
    if (!id || Number.isNaN(id)) throw new Error("Invalid Post ID");

    //--------- IF POST HAS ALREADY POSTED TO PORTAL, NEED TO UPDATE ON PORTAL TOO ------------
    const isPostUpToPortal = (
      await portalModel.isPostUpToPortal(Number(id), "evolving_research")
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
      metadata: body.metadata,
      content: body.content,
    });

    reply.code(200).send({
      message: `Update Evolving Research Post ${request.params["*"]} Successfully`,
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
  const model = new PostModel(request.lang, "evolving_research");

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
  getEvolvingResearchList,
  getLatestPosts,
  getEvolvingPost,
  createEvolvingPost,
  updateEvolvingPost,
  deletePost,
};
