import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class RecruitmentModel {
  pool: Pool;

  constructor(lang: LangType) {
    this.pool = getPool(lang);
  }

  async getAllRecruitment() {
    return this.pool.query(
      `SELECT id, title, "publishDate", progress, slug, thumbnail, "applicationPeriod", "jobType"
       FROM posts.recruitment
       WHERE progress = true`,
    );
  }

  async getRecruitmentPost(slug: string) {
    return this.pool.query(
      `SELECT * FROM posts.recruitment WHERE progress = true AND slug = $1`,
      [slug],
    );
  }
}

export default RecruitmentModel;
