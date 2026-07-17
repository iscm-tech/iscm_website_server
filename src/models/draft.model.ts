import { postPerPage } from "@/constants";
import {
  PortalType,
  UpdatePortalPostBodyType,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";
import envConfig from "config";
import { Pool } from "pg";
import slugify from "slugify";
import { getPool } from "./db/pool";

class DraftPostModel {
  pool: Pool;
  constructor(lang: LangType) {
    this.pool = getPool(lang);
  }

  async checkTable(id: number) {
    return this.pool.query(
      `SELECT * FROM posts.external_posts WHERE original_id = $1`,
      [id],
    );
  }

  async isPostUpToPortal(
    id: number,
    local_cate:
      | "news"
      | "evolving_research"
      | "student_life"
      | "open_admission",
  ) {
    return await this.pool.query(
      `SELECT * FROM posts.post_up_portal WHERE id = $1 and local_cate = $2`,
      [id, local_cate],
    );
  }

  async getLocalIdByOriginalId(original_id: string) {
    return await this.pool.query(
      `SELECT local_id FROM posts.external_posts WHERE original_id = $1`,
      [original_id],
    );
  }

  async getTotalPage() {
    return Math.ceil(
      (await this.pool.query("SELECT COUNT(*) FROM posts.drafts")).rows[0]
        .count / 12,
    );
  }

  async getAllCard(page: number) {
    const offset = (Math.max(page, 1) - 1) * 12;
    const query = {
      text: `SELECT "id", title, "publishDate", thumbnail, author, categories, sdgs from posts.drafts ORDER BY "publishDate" DESC LIMIT $1 OFFSET $2`,
      values: [12, offset],
    };
    return this.pool.query(query);
  }

  async getPost(id: string) {
    return this.pool.query({
      text: `SELECT * from posts.drafts where "id" = $1`,
      values: [id],
    });
  }

  async insertPost(post: PortalType) {
    return this.pool.query({
      text: `INSERT INTO posts.drafts ("id", title, thumbnail, author, description, sdgs, content, "publishDate", categories) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      values: [
        post.id,
        post.title,
        post.thumbnail,
        post.author,
        post.description,
        post.sdgs,
        post.content,
        post.publishDate,
        post.categories,
      ],
    });
  }

  async updatePostUpPortalList(
    id: string,
    categories: number[],
    local_cate:
      | "news"
      | "student_life"
      | "evolving_research"
      | "open_admission",
    thumbnail: string,
    background: string,
  ) {
    return this.pool.query(
      `INSERT INTO posts.post_up_portal (id, categories, local_cate, portal_thumb, portal_background) VALUES ($1, $2, $3, $4, $5)`,
      [id, categories, local_cate, thumbnail, background],
    );
  }

  async updatePortalRecord({
    id,
    ...metadata
  }: {
    id: string;
    categories?: number[];
    portal_thumb?: string;
    portal_background?: string;
  }) {
    const fields =
      Object.keys({ ...metadata }).filter(
        (f) => metadata[f as keyof typeof metadata] !== undefined,
      ) || [];

    const setValue: any[] = [],
      setClause: string[] = [];

    fields.forEach((field, idx) => {
      const val = metadata[field as keyof typeof metadata];

      if (val) {
        setValue.push(val);
        setClause.push(`${field} = $${idx + 1}`);
      }
    });

    if (!setClause.length) return;

    return this.pool.query(
      `UPDATE posts.post_up_portal SET ${setClause.join(", ")} WHERE id = $${setClause.length + 1}`,
      [...setValue, id],
    );
  }

  async updateDraftPost({
    id,
    lang,
    background,
    updateDate,
    content,
    ...metadata
  }: UpdatePortalPostBodyType) {
    if (metadata === undefined && content === undefined) {
      throw new Error("Not invalid parameters");
    }

    const fields = Object.keys({ ...metadata }) || [];
    const values = Object.values({ ...metadata }) || [];

    let setClause: string = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    if (content) {
      values.push(content);
      const contentIndex = values.length;
      setClause += `, content = $${contentIndex}`;
    }

    values.push(String(id));
    const idIndex = values.length;
    return this.pool.query({
      text: `UPDATE posts.drafts SET ${setClause} WHERE "id" = $${idIndex}`,
      values: values,
    });
  }

  async deletePost(id: string) {
    return this.pool.query({
      text: 'DELETE FROM posts.drafts WHERE "id" = $1',
      values: [id],
    });
  }

  async acceptPost(
    id: string,
    categories:
      | "news"
      | "student_life"
      | "evolving_research"
      // | "iscm_in_the_media"
      | "open_admission",
  ) {
    const client = await this.pool.connect();

    try {
      client.query("begin");
      const title = (
        await client.query(`SELECT title FROM posts.drafts WHERE id = $1`, [id])
      ).rows[0].title;

      const slug = slugify(title, {
        lower: true,
        strict: true,
        trim: true,
      });

      const local_id = (
        await client.query(
          `INSERT INTO posts.${categories} (title, thumbnail, author, description, sdgs, content, "publishDate", draft, slug)
        SELECT title, thumbnail, author, description, sdgs, content, "publishDate", false, $2
        FROM posts.drafts
        WHERE "id" = $1
        RETURNING "id"`,
          [id, slug],
        )
      ).rows[0].id;

      await client.query(
        `INSERT INTO posts.external_posts (local_id, original_id, category) VALUES ($1, $2, $3)`,
        [local_id, id, categories],
      );

      await client.query(`DELETE FROM posts.drafts WHERE "id" = $1`, [id]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

export default DraftPostModel;
