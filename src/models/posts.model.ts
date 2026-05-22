import { Pool } from "pg";
import { getPool } from "./db/pool";
import {
  CreatePostBodyType,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";

import { postPerPage } from "@/constants";

type CategoryTableType =
  | "news"
  | "open_admission"
  | "student_life"
  | "evolving_research"
  | "search";

class PostModel {
  pool: Pool;
  table: string;
  constructor(lang: LangType, table: CategoryTableType) {
    this.pool = getPool(lang);
    this.table = `posts.${table}`;
  }

  async getTotalPage() {
    return Math.ceil(
      (
        await this.pool.query(
          `SELECT COUNT(*) FROM ${this.table} WHERE draft = false`,
        )
      ).rows[0].count / postPerPage,
    );
  }

  async getAllCard(page: number, isAdmin: boolean) {
    const offset = (Math.max(page, 1) - 1) * postPerPage;
    const query = {
      text: `SELECT "id", title, "publishDate", draft, thumbnail, sdgs, slug, author, description 
             FROM ${this.table} ${
               !isAdmin ? "where draft = false" : ""
             } ORDER BY "publishDate" DESC limit $1 offset $2`,
      values: [postPerPage, offset],
    };
    return this.pool.query(query);
  }

  async getAllCardByMonth(month: string) {
    const query = {
      text: `SELECT "id", title, "publishDate", draft, thumbnail, sdgs, slug
              FROM ${this.table}
              WHERE TO_CHAR("publishDate", 'MM') = $1 and draft = false
              ORDER BY "publishDate" DESC`,
      values: [month],
    };

    return this.pool.query(query);
  }

  async getLatestPost() {
    return this.pool.query(
      `SELECT "id", title, "publishDate", draft, thumbnail, sdgs, slug FROM ${this.table} 
        WHERE draft = false
        ORDER BY "publishDate" DESC
        LIMIT 4 OFFSET 1`,
    );
  }

  async getPost(id: string, isAdmin: boolean) {
    return this.pool.query({
      text: `SELECT * FROM ${this.table} WHERE slug = $1 ${
        !isAdmin ? "AND draft = false" : ""
      }`,
      values: [id],
    });
  }

  async searchPost(q: string) {
    return this.pool.query(
      `
        SELECT  source_id as org_id, 
                category as table, 
                slug,
                "publishDate",
                sdgs,
                ts_headline(
                    'simple',
                    title,
                    query,
                    'HighlightAll=true, StartSel=<mark>, StopSel=</mark>'
                ) AS title, 
                ts_headline(
                    'simple',
                    content,
                    query,
                    '
                        MaxWords=20, MinWords=10
                        MaxFragments=2,
                        FragmentDelimiter=...,
                        StartSel=<mark>, StopSel=</mark>,
                    '
                ) AS snippet,
                ts_rank(
                    search_vector,
                    websearch_to_tsquery('simple', posts.unaccent($1))
                ) AS rank
        FROM posts.search_posts,
             websearch_to_tsquery('simple', posts.unaccent($1)) query
        WHERE search_vector @@ query
        ORDER BY rank DESC
        LIMIT 10
    `,
      [q],
    );
  }

  async insertPost({ metadata, content }: CreatePostBodyType) {
    return this.pool.query({
      text: `INSERT INTO ${this.table} (title, draft, thumbnail, author, description, sdgs, "publishDate", content, slug) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      values: [
        metadata.title,
        metadata.draft,
        metadata.thumbnail,
        metadata.author,
        metadata.description,
        metadata.sdgs,
        metadata.publishDate,
        content,
        metadata.slug,
      ],
    });
  }

  async updatePost(id: string, { metadata, content }: UpdatePostBodyType) {
    if (metadata === undefined && content === undefined) {
      throw new Error("Not invalid parameters");
    }

    const fields =
      Object.keys({ ...metadata }).filter(
        (key) => key !== "portal_thumb" && key !== "portal_background",
      ) || [];
    const values = [],
      setClause = [];

    fields.forEach((field) => {
      if (metadata) {
        const val = metadata[field as keyof typeof metadata];
        if (val) {
          values.push(val);
          setClause.push(`"${field}" = $${setClause.length + 1}`);
        }
      }
    });

    if (content) {
      values.push(content);
      setClause.push(`content = $${setClause.length + 1}`);
    }

    values.push(id);
    const idIndex = setClause.length + 1;

    return this.pool.query({
      text: `UPDATE ${this.table} SET ${setClause.join(", ")} WHERE "id" = $${idIndex}`,
      values: values,
    });
  }

  async deletePost(id: string) {
    await this.pool.query("BEGIN");
    try {
      await this.pool.query(`DELETE FROM ${this.table} WHERE "id" = $1;`, [id]);
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

export default PostModel;
