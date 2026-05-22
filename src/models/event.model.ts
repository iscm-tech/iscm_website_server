import { postPerPage } from "@/constants";
import {
  CreateEventBodyType,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class EventModel {
  pool: Pool;
  constructor(lang: LangType) {
    this.pool = getPool(lang);
  }

  async getTotalPage() {
    return Math.ceil(
      (await this.pool.query("SELECT COUNT(*) FROM posts.events WHERE draft = false")).rows[0]
        .count / postPerPage,
    );
  }

  async getAllCard(page: number, isAdmin: boolean) {
    const offset = (Math.max(page, 1) - 1) * postPerPage;
    const query = {
      text: `SELECT "id", title, "eventTime", "publishDate", draft, thumbnail, sdgs, slug, author 
            FROM posts.events ${
              !isAdmin ? "where draft = false" : ""
            } ORDER BY "eventTime" DESC NULLS LAST, "publishDate" DESC 
            LIMIT $1 offset $2`,
      values: [postPerPage, offset],
    };
    return this.pool.query(query);
  }

  async getLatestPost() {
    return this.pool.query(
      `SELECT "id", title, "publishDate", "eventTime", draft, thumbnail, sdgs, slug FROM posts.events 
       WHERE draft = false AND "eventTime" IS NOT NULL AND "eventTime"::date >= CURRENT_DATE
       ORDER BY "eventTime" ASC`,
    );
  }

  async getPost(slug: string, isAdmin: boolean) {
    return this.pool.query(
      `SELECT * FROM posts.events WHERE slug = $1 ${
        !isAdmin ? "AND draft = false" : ""
      }`,
      [slug],
    );
  }

  async insertPost({ metadata, content }: CreateEventBodyType) {
    return this.pool.query({
      text: `INSERT INTO posts.events (title, draft, thumbnail, author, description, sdgs, content, "publishDate", slug, "eventTime") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      values: [
        metadata.title,
        metadata.draft,
        metadata.thumbnail,
        metadata.author,
        metadata.description,
        metadata.sdgs,
        content,
        metadata.publishDate,
        metadata.slug,
        metadata.eventTime,
      ],
    });
  }

  async updatePost(id: string, { metadata, content }: UpdatePostBodyType) {
    if (metadata === undefined && content === undefined) {
      throw new Error("Not invalid parameters");
    }

    const fields = Object.keys({ ...metadata }) || [];
    const values = Object.values({ ...metadata }) || [];

    let setClause: string = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(", ");

    if (content) {
      values.push(content);
      const contentIndex = values.length;
      if (setClause !== "") setClause += ", ";
      setClause += `content = $${contentIndex}`;
    }

    values.push(id);
    const idIndex = values.length;

    return this.pool.query({
      text: `UPDATE posts.events SET ${setClause} WHERE "id" = $${idIndex}`,
      values: values,
    });
  }

  async deletePost(id: string) {
    await this.pool.query("BEGIN");
    try {
      await this.pool.query('DELETE FROM posts.events WHERE "id" = $1;', [id]);
      await this.pool.query(
        "DELETE FROM posts.external_posts WHERE local_id = $1",
        [id],
      );

      await this.pool.query("COMMIT");
    } catch (error) {
      await this.pool.query("ROLLBACK");
      throw error;
    }
  }
}

export default EventModel;
