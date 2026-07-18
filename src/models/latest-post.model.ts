import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class LatestPostModel {
  pool: Pool;
  constructor(lang: LangType) {
    this.pool = getPool(lang);
  }

  async getAllCard(page: number = 1, limit: number = 6) {
    const offset = (page - 1) * limit;
    const query = {
      text: `SELECT id, title, "publishDate", thumbnail, description, sdgs, slug, 'iscm_life' AS category
            FROM posts.news
            WHERE draft = false
            UNION ALL
            SELECT id, title, "publishDate", thumbnail, description, sdgs, slug, 'expert_insight' AS category
            FROM posts.evolving_research
            WHERE draft = false
            UNION ALL
            SELECT id, title, "publishDate", thumbnail, description, sdgs, slug, 'open_admission' AS category
            FROM posts.open_admission
            WHERE draft = false
            UNION ALL
            SELECT id, title, "publishDate", thumbnail, description, sdgs, slug, 'student_life' AS category
            FROM posts.student_life
            WHERE draft = false
            ORDER BY "publishDate" DESC  
            LIMIT $1 offset $2`,
      values: [limit, offset],
    };
    return this.pool.query(query);
  }

  async getTotalCardPage(limit: number = 6) {
    const query = {
      text: `SELECT COUNT(*) AS total
            FROM (
              SELECT id FROM posts.news WHERE draft = false
              UNION ALL
              SELECT id FROM posts.evolving_research WHERE draft = false
              UNION ALL
              SELECT id FROM posts.open_admission WHERE draft = false
              UNION ALL
              SELECT id FROM posts.student_life WHERE draft = false
            ) AS combined`,
    };
    const res = await this.pool.query(query);
    const total = parseInt(res.rows[0].total, 10);
    return Math.ceil(total / limit);
  }

  async getAllPortalCard(page: number = 1, limit: number = 4) {
    const offset = (page - 1) * limit;
    const query = {
      text: `SELECT id, title, "publishDate", thumbnail, sdgs, slug, content, 'iscm_life' AS category
            FROM posts.news
            WHERE draft = false and author = 'UEH Portal'
            UNION ALL
            SELECT id, title, "publishDate", thumbnail, sdgs, slug, content, 'expert_insight' AS category
            FROM posts.evolving_research
            WHERE draft = false and author = 'UEH Portal'
            UNION ALL
            SELECT id, title, "publishDate", thumbnail, sdgs, slug, content, 'open_admission' AS category
            FROM posts.open_admission
            WHERE draft = false and author = 'UEH Portal'
            ORDER BY "publishDate" DESC  
            LIMIT $1 offset $2`,
      values: [limit, offset],
    };
    return this.pool.query(query);
  }

  async getTotalPortalPage(limit: number = 4) {
    const query = {
      text: `SELECT COUNT(*) AS total
            FROM (
              SELECT id FROM posts.news WHERE draft = false and author = 'UEH Portal'
              UNION ALL
              SELECT id FROM posts.evolving_research WHERE draft = false and author = 'UEH Portal'
              UNION ALL
              SELECT id FROM posts.open_admission WHERE draft = false and author = 'UEH Portal'
            ) AS combined`,
    };
    const res = await this.pool.query(query);
    const total = parseInt(res.rows[0].total, 10);
    return Math.ceil(total / limit);
  }
}

export default LatestPostModel;
