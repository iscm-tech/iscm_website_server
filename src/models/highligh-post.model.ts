import { postPerPage } from "@/constants";
import {
  CreatePostBodyType,
  UpdatePostBodyType,
} from "@/schemaValidation/post.schema";
import envConfig from "config";
import { Pool } from "pg";

class HighLightPostModel {
  pool: Pool;
  constructor(lang: LangType) {
    this.pool = new Pool({
      user: envConfig.POSTGRES_USER,
      host: envConfig.POSTGRES_DB_HOST,
      database:
        lang === "en" ? envConfig.POSTGRES_DB_EN : envConfig.POSTGRES_DB_VI,
      password: envConfig.POSTGRES_PASSWORD,
      port: envConfig.POSTGRES_DB_PORT,
      max: 500,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getCard() {
    const { id, category } = (
      await this.pool.query(
        `SELECT * FROM posts.highlights ORDER BY "pinDate" DESC`
      )
    ).rows[0];

    return this.pool.query(
      `SELECT "id", title, "publishDate", draft, thumbnail, sdgs from posts.${category} WHERE id = $1`,
      [id]
    );
  }

  async pinPost(id: string, category: string, publishDate: Date) {
    const isExist = !!(
      await this.pool.query(
        `SELECT "id" FROM posts.${category} WHERE id = $1`,
        [id]
      )
    ).rowCount;

    if (!isExist) {
      throw new Error("Post Not Found", { cause: 404 });
    }

    await this.pool.query({
      text: `INSERT INTO posts.highlights (id, category, "pinDate") VALUES ($1, $2, $3)`,
      values: [id, category, publishDate],
    });
  }

  async unPinPost(id: string) {
    return this.pool.query({
      text: 'DELETE FROM posts.highlights WHERE "id" = $1',
      values: [id],
    });
  }

  async searchPost() {
    
  }
}

export default HighLightPostModel;
