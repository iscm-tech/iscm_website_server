import LatestPostModel from "@/models/latest-post.model";
import PostModel from "@/models/posts.model";
import {
  LatestAdmissionCardSchema,
  LatestAdmissionCardType,
  LatestPostSchema,
  PostCardType,
} from "@/schemaValidation/post.schema";
import { FastifyReply, FastifyRequest } from "fastify";

async function getLatestPosts(request: FastifyRequest, reply: FastifyReply) {
  const model = new LatestPostModel(request.lang);

  try {
    const rows = (await model.getAllCard()).rows;
    const latest: PostCardType[] = [];

    for (const row of rows) {
      const parse = LatestPostSchema.safeParse(row);

      if (!parse.success) {
        throw new Error(parse.error.message);
      }

      latest.push(parse.data);
    }

    reply.code(200).send({
      message: "Get Latest Posts Success",
      data: latest,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e,
    });
  }
}

async function getPortalPost(request: FastifyRequest, reply: FastifyReply) {
  const model = new LatestPostModel(request.lang);
  try {
    const rows = (await model.getAllPortalCard()).rows;
    const latest: LatestAdmissionCardType[] = [];

    for (const row of rows) {
      const parse = LatestAdmissionCardSchema.safeParse(row);

      if (!parse.success) {
        throw new Error(parse.error.message);
      }

      latest.push(parse.data);
    }

    reply.code(200).send({
      message: "Get Latest Posts Success",
      data: latest,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e,
    });
  }
}

async function searchPost(
  request: FastifyRequest<{ Querystring: { q: string } }>,
  reply: FastifyReply,
) {
  let { q } = request.query;

  if (!q || q.length < 2) return [];

  // Normalie the search query string
  q = q.toLowerCase();

  // Process sdg search query string, e.g. "sdgs 1" => "sdg_1"
  q = q.replace(/\bsdgs?\s+(\d+)/gi, (_, n) => `sdg_${n}`);
  q = q.replace(/\s+/g, " ").trim();

  try {
    const model = new PostModel(request.lang, "search");

    const results = await model.searchPost(q);

    reply.code(200).send({
      message: "Search Posts Success",
      data: results.rows,
      length: results.rowCount,
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e,
    });
  }
}

export { getLatestPosts, getPortalPost, searchPost };
