import { CollaborationStudioBodyType } from "@/schemaValidation/studiolab.schema";
import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

export default class StudioModel {
  pool: Pool;
  category: string;
  constructor(
    lang: LangType,
    category: "collaboration_studios" | "iscm_studios",
  ) {
    this.pool = getPool(lang);
    this.category = category;
  }

  async getProjectList() {
    return this.pool.query(
      `SELECT "id", title, thumbnail, date, location from studiolab.${this.category} WHERE draft = false`,
    );
  }

  async getProject(id: string) {
    return this.pool.query(
      `SELECT * FROM studiolab.${this.category} WHERE "id" = $1 and draft = false`,
      [id],
    );
  }

  async insertStudio(studio: CollaborationStudioBodyType) {
    return this.pool.query({
      text: `INSERT INTO studiolab.${this.category} ("id", title, thumbnail, date, location, members, description, supervisor, draft, gallery) values
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      values: [
        studio.id,
        studio.title,
        studio.thumbnail,
        studio.date,
        studio.location,
        studio.members,
        studio.description,
        studio.supervisor,
        studio.draft,
        studio.galley,
      ],
    });
  }
}
