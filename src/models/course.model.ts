import {
  CreateCourseBodyType,
  UpdateCourseBodyType,
} from "@/schemaValidation/course.schema";
import { UserType } from "@/schemaValidation/users.schema";
import { Pool } from "pg";
import { getPool } from "./db/pool";

class CourseModel {
  pool: Pool;
  category: "course_graduate" | "course_undergraduate" | "non-degree";
  staff?: UserType;

  constructor(
    lang: LangType,
    category: "course_graduate" | "course_undergraduate" | "non-degree",
    staff?: UserType,
  ) {
    this.pool = getPool(lang);

    this.category = category;
    this.staff = staff;
  }

  async getAllCourse() {
    return this.pool.query(
      `SELECT id, title, thumbnail, duration, slug FROM education."${
        this.category
      }" ${this.staff ? "" : "WHERE draft = false"}`,
    );
  }

  async getCourse(id: string) {
    return this.pool.query(
      `SELECT * FROM education."${this.category}" WHERE slug = $1 ${
        this.staff ? "" : "and draft = false"
      }`,
      [id],
    );
  }

  async getNonDegreeCourseCard() {
    if (this.category !== "non-degree") {
      throw new Error("Invalid category for non-degree courses");
    }

    return this.pool.query(
      `SELECT id, title, thumbnail, duration, "location", language, slug, level FROM education."non-degree" WHERE ${
        this.staff ? "" : "draft = false"
      }`,
    );
  }

  async searchNonDegreeCourses(conds: {
    title?: string;
    level?: string;
    location?: string;
    language?: string;
    status?: "coming_soon" | "open" | "closed";
  }) {
    if (this.category !== "non-degree") {
      throw new Error("Invalid category for non-degree courses");
    }

    let queryConds: string[] = [],
      values: string[] = [];

    Object.keys(conds).forEach((key, idx) => {
      const value = conds[key as keyof typeof conds];
      if (!value) return;

      if (key === "title") {
        values.push(`%${value}%`);
        queryConds.push(`title ILIKE $${values.length}`);
      } else {
        values.push(value);
        queryConds.push(`${key} = $${values.length}`);
      }
    });

    if (!this.staff) queryConds.push("draft = false");

    const query = `SELECT id, title, thumbnail, duration, "location", language, slug, level FROM education."non-degree" WHERE 
    ${queryConds.join(" AND ")}`;

    return this.pool.query(query, values);
  }

  async getNonDegreeCourse(slug: string) {
    if (this.category !== "non-degree") {
      throw new Error("Invalid category for non-degree courses");
    }

    return this.pool.query(
      `SELECT * FROM education."non-degree" WHERE slug = $1 ${
        this.staff ? "" : "and draft = false"
      }`,
      [slug],
    );
  }

  async insertNewCourse(course: CreateCourseBodyType, slug: string) {
    return this.category === "non-degree"
      ? this.pool.query(
          `INSERT INTO education."${this.category}" (thumbnail, title, duration, content, "order", slug, gallery) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            course.thumbnail,
            course.title,
            course.duration,
            course.content,
            slug,
          ],
        )
      : this.pool.query(
          `INSERT INTO education."${this.category}" (thumbnail, title, duration, content, program_structure, "order", slug) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            course.thumbnail,
            course.title,
            course.duration,
            course.content,
            course.program_structure || null,
            slug,
          ],
        );
  }

  async updateCourse(id: string, course: UpdateCourseBodyType) {
    const fields = Object.keys({ ...course }) || [];
    const values = Object.values({ ...course }) || [];

    const setClause: string = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    values.push(id);
    const idIndex = values.length;

    console.log(setClause, values, idIndex);

    return this.pool.query(
      `UPDATE education."${this.category}" SET ${setClause} WHERE slug = $${idIndex}`,
      values,
    );
  }
}

export default CourseModel;
