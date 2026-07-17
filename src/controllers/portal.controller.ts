import { FastifyReply, FastifyRequest } from "fastify";
import { parse } from "date-fns";
import axios from "axios";
import slugify from "slugify";

import { ErrorResType } from "@/types/error.types";
import { PostParamsRequestType } from "@/types/post.types";
import envConfig from "config";
import SendmailTransport from "@/utils/mail";
import {
  CreatePortalPostBody,
  CreatePortalPostBodyType,
  ExternalPostBodyType,
  PendingPostSchema,
  PortalSchema,
  PostCardType,
  PostSchema,
  UpdatePortalPostBody,
  UpdatePortalPostBodyType,
  UpdatePostBody,
} from "@/schemaValidation/post.schema";
import PostModel from "@/models/posts.model";
import DraftPostModel from "@/models/draft.model";

// Get Pending Post List
async function getAllPendingPost(
  request: FastifyRequest<{ Querystring: { page: number } }>,
  reply: FastifyReply
) {
  const model = new DraftPostModel(request.lang);
  const postList: Array<PostCardType> = [];
  const page = request.query.page || 1;
  try {
    const rows = (await model.getAllCard(page)).rows;
    const totalPage = await model.getTotalPage();

    for (const row of rows) {
      row.lang = request.lang;
      const parse = PendingPostSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      postList.push({
        ...parse.data,
        slug: slugify(parse.data.title, {
          lower: true,
          strict: true,
          trim: true,
        }),
        id: Number(parse.data.id),
      });
    }

    reply.code(200).send({
      data: postList,
      totalPage,
      message: `Get Pending List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

// Get Pending Post Detail
async function getPendingPost(
  request: FastifyRequest<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply,
) {
  const modelEn = new DraftPostModel("en");
  const modelVi = new DraftPostModel("vi");
  try {
    let data, lang;

    if (request.query.lang) {
      const model = new DraftPostModel(request.query.lang);

      const response = (await model.getPost(request.params.title)).rows;

      if (response.length < 1) {
        reply.code(404).send({ message: "Pending Post Not Found" });
        return;
      }

      data = response[0];
      lang = request.query.lang;
    } else {
      const response = (await modelEn.getPost(request.params.title)).rows;

      if (response.length < 1) {
        const responseVi = (await modelVi.getPost(request.params.title)).rows;

        if (responseVi.length < 1) {
          reply.code(404).send({ message: "Pending Post Not Found" });
          return;
        }

        data = responseVi[0];
        lang = "vi";
      } else {
        data = response[0];
        lang = "en";
      }
    }

    const { content, ...metadata } = data;

    metadata.id = Number(metadata.id);
    metadata.slug = slugify(metadata.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    const parse = PostSchema.safeParse({ metadata, content });

    if (!parse.success) throw new Error(parse.error.message);

    reply.code(200).send({
      data: parse.data,
      lang,
      message: `Get Pending List Success`,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

/* ======================================== PORTAL => ISCM ========================================== */
// Receive Post From Portal -> ISCM
async function receiveNewPortalPostController(
  request: FastifyRequest<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Body: ExternalPostBodyType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: { message: string }; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  const model = new DraftPostModel(body.lang);

  try {
    const postParse = PortalSchema.safeParse({
      id: body.id,
      title: body.title,
      thumbnail: body.thumbnail,
      author: "UEH Portal",
      description: body.shortDesc,
      sdgs: body.sdgs,
      publishDate: parse(body.publishDate, "dd/MM/yyyy HH:mm:ss", new Date()),
      content: body.content,
      categories: body.categories,
    });
    if (postParse.error) {
      console.log(postParse.error, "receive from portal parse error");
      throw new Error("Error parsing");
    }

    const rowCount = (await model.checkTable(Number(postParse.data.id)))
      .rowCount;

    if (rowCount) throw new Error("Post Already Existed!");

    await model.insertPost(postParse.data);
    await SendmailTransport(
      `Portal UEH has pushed a new post, please review now: <a href="https://iscm.ueh.edu.vn/admins/dashboard" target="_blank">${postParse.data.title}</a>`,
    );

    reply.code(200).send({
      message: "Insert Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

// Update Post From Portal -> ISCM
async function updatePortalPostController(
  request: FastifyRequest<{
    Params: PostParamsRequestType;
    Querystring: { lang: LangType };
    Body: UpdatePortalPostBodyType;
  }>,
  reply: FastifyReply<{
    Reply: { 200: { message: string }; 500: ErrorResType };
  }>,
) {
  const body = request.body;
  // id which we receive is in portal db not in iscm db
  const { content, lang, id, shortDesc, updateDate, categories, ...metadata } =
    body;
  const draftModel = new DraftPostModel(lang);

  try {
    const query = await draftModel.checkTable(body.id);
    const { category, local_id } = query.rows[0] || {};

    // Post exists in ISCM db
    if (category) {
      let model;

      switch (category) {
        case "news":
          model = new PostModel(lang, "news");
          break;
        case "student_life":
          model = new PostModel(lang, "student_life");
          break;
        case "evolving_research":
          model = new PostModel(lang, "evolving_research");
          break;

        case "open_admission":
          model = new PostModel(lang, "open_admission");
          break;
        default:
          model = draftModel;
      }

      // Check whether a post is accepted or not
      // If it is accepted, id receving is equal to draft id
      // Else id receiving is just original_id, so we need to join 2 tables and query on the original_id
      if (model instanceof DraftPostModel) {
        // Post is pending
        // Update in drafts table
        const parse = UpdatePortalPostBody.safeParse({
          ...body,
          content: shortDesc ? shortDesc + "<br/><br/>" + content : content,
        });

        if (!parse.success) throw new Error(parse.error.message);

        await model.updateDraftPost(parse.data);
      } else {
        // Post was accepted
        // Update in the suitable table
        const parse = UpdatePostBody.safeParse({
          metadata,
          content: shortDesc ? shortDesc + "<br/><br/>" + content : content,
        });

        if (!parse.success) throw new Error(parse.error.message);

        await model.updatePost(local_id, parse.data);
      }
    } else {
      // Post have not created in ISCM db yet
      const postParse = PortalSchema.safeParse({
        id: body.id,
        title: body.title,
        thumbnail: body.thumbnail,
        author: "UEH Portal",
        description: body.shortDesc,
        sdgs: body.sdgs,
        publishDate: parse(body.updateDate, "dd/MM/yyyy HH:mm:ss", new Date()),
        content: body.content,
        categories: body.categories,
      });
      if (postParse.error) {
        console.log(postParse.error, "portal post invalid!");
        throw new Error("Portal post error parsing");
      }

      await draftModel.insertPost(postParse.data);

      reply.code(200).send({
        message: "Insert Post Successfully",
      });
    }

    reply.code(200).send({
      message: "Update Portal Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

// Accept Air Post From Portal -> ISCM (It is current in draft to wait for review)
async function acceptPostController(
  request: FastifyRequest<{
    Params: {
      category:
        | "news"
        | "student_life"
        | "evolving_research"
        | "open_admission";
      id: string;
    };
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply<{
    Reply: { 200: { message: string }; 500: ErrorResType };
  }>,
) {
  const lang = request.lang;
  const model = new DraftPostModel(lang);

  try {
    await model.acceptPost(request.params.id, request.params.category);
    reply.code(200).send({
      message: "Accept Portal Post Successfully",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

// Reject Post From Portal -> ISCM
async function rejectPostController(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { lang: LangType };
  }>,
  reply: FastifyReply,
) {
  const model = new DraftPostModel(request.lang);

  try {
    await model.deletePost(request.params.id);

    reply.code(200).send({
      message: "Portal Post Is Rejected!",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}
/* ========================================= END ========================================================= */

/* ======================================== ISCM => PORTAL ========================================== */
// Push a Post from ISCM -> Portal
async function createPortalPostController(
  request: FastifyRequest<{
    Body: CreatePortalPostBodyType;
  }>,
  reply: FastifyReply,
) {
  const body = request.body;
  const model = new DraftPostModel(body.lang);

  try {
    const parse = CreatePortalPostBody.safeParse(body);

    if (!parse.success) throw new Error(parse.error.message);

    const { local_cate, ...portalBody } = parse.data;

    const response: { status: string; message: string; elements: string } = (
      await axios.post(
        "https://api.ueh.edu.vn/api/news/create-news",
        portalBody,
        {
          headers: {
            authorization: envConfig.PORTAL_AUTHORIZATION,
            "Content-Type": "application/json",
          },
        },
      )
    ).data;

    if (response.status !== "success") throw new Error(response.elements);

    await model.updatePostUpPortalList(
      String(body.id),
      body.categories,
      local_cate,
      body.thumbnail,
      body.background,
    );

    reply.code(200).send({ message: response.message, data: portalBody });
  } catch (_e) {
    const e: Error = _e as Error;
    console.log(e.message);
    reply.code(500).send(e);
  }
}
/* ========================================== END ========================================================= */

export {
  receiveNewPortalPostController,
  getPendingPost,
  updatePortalPostController,
  acceptPostController,
  getAllPendingPost,
  createPortalPostController,
  rejectPostController,
};
