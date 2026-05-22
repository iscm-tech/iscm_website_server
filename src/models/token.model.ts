import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class AuthModel {
  pool: Pool;
  constructor() {
    this.pool = getPool("en");
  }

  async getToken(token: string) {
    return this.pool.query(
      `SELECT * FROM accounts.available_token WHERE token = $1`,
      [token],
    );
  }

  async getTokenByAccountID(accountID: string) {
    return this.pool.query(
      `SELECT * FROM accounts.available_token WHERE "accountID" = $1`,
      [accountID],
    );
  }

  async addToken(accountID: string, token: string, expireDate: Date) {
    return this.pool.query(
      `INSERT INTO accounts.available_token ("accountID", token, "expireDate") VALUES ($1, $2, $3)`,
      [accountID, token, expireDate],
    );
  }

  async updateToken(token: string, expireDate: Date) {
    return this.pool.query(
      `UPDATE accounts.available_token SET "expireDate" = $1 WHERE token = $2 RETURNING *`,
      [expireDate, token],
    );
  }

  async deleteToken(token: string) {
    return this.pool.query(
      `DELETE FROM accounts.available_token WHERE "token" = $1`,
      [token],
    );
  }
}

export default AuthModel;
