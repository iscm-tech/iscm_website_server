// import { postPerPage } from "@/constants";
import {
  CreateMemberType,
  UpdateMemberType,
} from "@/schemaValidation/member.schema";
import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class PeopleModel {
  pool: Pool;
  category: "members" | "advisory" | "intern" | "network";
  constructor(
    lang: LangType,
    category: "members" | "advisory" | "intern" | "network",
  ) {
    this.pool = getPool(lang);

    this.category = category;
  }

  async getAllCard(type: string = "") {
    const query = {
      text: `SELECT "id", name, title, image, draft, "order" from people.${this.category} WHERE draft = false AND LOWER(title) LIKE $1 ORDER by "order" ASC`,
      values: [`%${type}%`],
    };
    return this.pool.query(query);
  }

  async getDetail(id: string) {
    return this.pool.query({
      text: `SELECT * from people.${this.category} where "id" = $1`,
      values: [id],
    });
  }

  async insertPeople({ metadata, detail }: CreateMemberType) {
    return this.pool.query({
      text: `INSERT INTO people.${this.category} ("id", image, interest, bio, email, draft, name, title, "order", detail) 
                                          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      values: [
        metadata.id,
        metadata.image,
        metadata.interest,
        metadata.bio,
        metadata.email,
        metadata.draft,
        metadata.name,
        metadata.title,
        metadata.order,
        detail,
      ],
    });
  }

  async updateProfile(id: string, { metadata, detail }: UpdateMemberType) {
    if (
      metadata &&
      Object.keys(metadata).length < 1 &&
      detail &&
      Object.keys(detail).length < 1
    ) {
      throw new Error("Not invalid parameters");
    }

    const fields = Object.keys({ ...metadata }) || [];
    const values = Object.values({ ...metadata }) || [];

    let setClause: string =
      fields.length > 0
        ? fields.map((field, index) => `"${field}" = $${index + 1}`).join(", ")
        : "";

    if (setClause !== "" && detail) setClause += ", ";

    if (detail) {
      values.push(detail);
      const detailIndex = values.length;
      setClause += `detail = $${detailIndex}`;
    }

    values.push(id);
    const idIndex = values.length;

    console.log(
      `UPDATE people.${this.category} SET ${setClause}  WHERE "id" = $${idIndex}`,
      values,
    );

    return this.pool.query({
      text: `UPDATE people.${this.category} SET ${setClause}  WHERE "id" = $${idIndex}`,
      values: [...values],
    });
  }

  async deletePeople(id: string) {
    return this.pool.query({
      text: `DELETE FROM people.${this.category} WHERE "id" = $1`,
      values: [id],
    });
  }
}

export default PeopleModel;
