import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class LatestPostModel {
  pool: Pool;
  constructor(lang: LangType) {
    this.pool = getPool(lang);
  }

  async getAllCard() {
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
            LIMIT 6 offset 0`,
    };
    return this.pool.query(query);
  }

  async getAllPortalCard() {
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
            LIMIT 4 offset 0`,
    };
    return this.pool.query(query);
  }
}

export default LatestPostModel;
