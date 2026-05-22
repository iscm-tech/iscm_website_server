import {
  BookSchema,
  BookType,
  PublicationSchema,
  PublicationType,
} from "@/schemaValidation/research.schema";
import envConfig from "config";
import { Pool } from "pg";
import { getPool } from "./db/pool";

export default class ResearchModel {
  pool: Pool;
  constructor(lang: LangType) {
    this.pool = getPool(lang);
  }

  async getAllPublicationList(): Promise<
    { year: number; publications_list: PublicationType[] }[]
  > {
    const data = await this.pool.query(
      `SELECT year, ARRAY_AGG(ROW_TO_JSON(p)) AS publications_list FROM researches.publications p GROUP BY year ORDER BY year DESC`,
    );

    return data.rows.map(
      (row: { year: number; publications_list: PublicationType[] }) => {
        return {
          year: row.year,
          publications_list: row.publications_list.map((item) => {
            const parse = PublicationSchema.safeParse(item);

            if (parse.error) throw new Error(parse.error.message);

            return parse.data;
          }),
        };
      },
    );
  }

  async getBookList(): Promise<BookType[]> {
    const data = await this.pool.query(
      `SELECT * FROM researches.books ORDER BY year DESC`,
    );

    return data.rows.map((row: BookType) => {
      const parse = BookSchema.safeParse(row);

      if (parse.error) throw new Error(parse.error.message);

      return parse.data;
    });
  }
}
