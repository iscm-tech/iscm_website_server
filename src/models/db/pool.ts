import { Pool } from "pg";
import envConfig from "config";

const pools: Partial<Record<LangType, Pool>> = {};

export function getPool(lang: LangType) {
  if (!pools[lang]) {
    pools[lang] = new Pool({
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
  return pools[lang]!;
}
