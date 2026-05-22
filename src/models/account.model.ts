import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class AccountModel {
  pool: Pool;
  category: string;
  constructor(category: "members" | "student" | "staffs") {
    this.pool = getPool("en");
    this.category = category;
  }

  async getPassword(username: string) {
    return this.pool.query({
      text: `SELECT password FROM accounts.${this.category} WHERE username = $1`,
      values: [username],
    });
  }

  async getAllowedGoogle(username: string) {
    return this.pool.query(
      "SELECT COUNT(*) FROM accounts.members WHERE username = $1",
      [username],
    );
  }

  async getUserID(username: string) {
    return this.pool.query({
      text: `SELECT "id" FROM accounts.${this.category} WHERE username = $1`,
      values: [username],
    });
  }

  async getInfoByID(id: string) {
    return this.pool.query({
      text: `SELECT * FROM accounts.${this.category} WHERE "id" = $1`,
      values: [id],
    });
  }

  async insertAccount({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    const id = uuidv4();
    return this.pool.query({
      text: `INSERT INTO accounts.${this.category} VALUES ($1, $2, $3)`,
      values: [id, username, password],
    });
  }

  async updateInfo(
    username: string,
    fieldsQuery: { field: string; value: any }[],
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    fieldsQuery.forEach((field) => {
      fields.push(field.field);
      values.push(field.value);
    });

    const setClause: string = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    values.push(username);
    const idIndex = values.length;

    return this.pool.query({
      text: `UPDATE accounts.${this.category} SET ${setClause} WHERE username = $${idIndex}`,
      values: values,
    });
  }

  async deleteAccount(username: string) {
    return this.pool.query({
      text: `DELETE FROM accounts.${this.category} WHERE username = $1`,
      values: [username],
    });
  }
}

export default AccountModel;
