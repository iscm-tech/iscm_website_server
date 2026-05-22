import CourseModel from "@/models/course.model";
import {
  CourseCardSchema,
  CourseCardType,
  CourseSchema,
  CreateCourseBodySchema,
  CreateCourseBodyType,
  NondegreeCourseCardSchema,
  NondegreeCourseCardType,
  NondegreeCourseSchema,
  UpdateCourseBodySchema,
  UpdateCourseBodyType,
} from "@/schemaValidation/course.schema";
import {
  CourseListResType,
  CourseParamsRequestType,
  CourseResType,
} from "@/types/course.types";
import { ErrorResType } from "@/types/error.types";
import { FastifyReply, FastifyRequest } from "fastify";
import slugify from "slugify";

async function getCourseList(
  request: FastifyRequest<{
    Params: {
      category: "course_graduate" | "course_undergraduate" | "non-degree";
    };
  }>,
  reply: FastifyReply<{
    Reply: {
      200: CourseListResType;
      404: { message: string };
      500: ErrorResType;
    };
  }>,
): Promise<void> {
  const model = new CourseModel(
    request.lang,
    request.params.category,
    request.user,
  );

  try {
    const { rows } = await model.getAllCourse();

    const courseList: Array<CourseCardType> = [];

    for (const row of rows) {
      const parse = CourseCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      courseList.push(parse.data);
    }

    reply.code(200).send({
      data: courseList,
      message: "Get Course List Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getCourseDetail(
  request: FastifyRequest<{
    Params: {
      category: "course_graduate" | "course_undergraduate" | "non-degree";
      slug: string;
    };
  }>,
  reply: FastifyReply<{
    Reply: {
      200: CourseResType;
      404: { message: string };
      500: ErrorResType;
    };
  }>,
): Promise<void> {
  const slug = request.params.slug;
  const model = new CourseModel(
    request.lang,
    request.params.category,
    request.user,
  );

  try {
    const rawData = await model.getCourse(slug);

    if (!rawData.rowCount)
      reply.code(404).send({ message: "Course Not Found!" });

    const parse = CourseSchema.safeParse(rawData.rows[0]);

    if (!parse.success) throw new Error(parse.error.message);

    reply.code(200).send({
      data: parse.data,
      message: "Get Course Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getNonDegreeCourseList(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const model = new CourseModel(request.lang, "non-degree", request.user);

  try {
    const { rows } = await model.getNonDegreeCourseCard();

    const courseList: Array<NondegreeCourseCardType> = [];

    for (const row of rows) {
      const parse = NondegreeCourseCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      courseList.push(parse.data);
    }

    reply.code(200).send({
      data: courseList,
      message: "Get Non-Degree Course List Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: JSON.parse(e.message),
    });
  }
}

async function getNonDegreeCourse(
  request: FastifyRequest<{
    Params: { slug: string };
  }>,
  reply: FastifyReply,
) {
  const slug = request.params.slug;

  const model = new CourseModel(request.lang, "non-degree", request.user);

  try {
    const rawData = await model.getNonDegreeCourse(slug);

    if (!rawData.rowCount)
      reply.code(404).send({ message: "Course Not Found!" });

    const parse = NondegreeCourseSchema.safeParse(rawData.rows[0]);

    if (!parse.success) throw new Error(parse.error.message);

    reply.code(200).send({
      data: parse.data,
      message: "Get Non-Degree Course Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: JSON.parse(e.message),
    });
  }
}

async function searchNonDegreeCourses(
  request: FastifyRequest<{
    Querystring: {
      title?: string;
      level?: string;
      type?: string;
      language?: string;
      status?: "coming_soon" | "open" | "closed";
    };
  }>,
  reply: FastifyReply,
) {
  const model = new CourseModel(request.lang, "non-degree", request.user);

  try {
    const { rows } = await model.searchNonDegreeCourses({
      title: request.query.title,
      level: request.query.level,
      location: request.query.type,
      language: request.query.language,
      status: request.query.status,
    });

    const courseList: Array<NondegreeCourseCardType> = [];

    for (const row of rows) {
      const parse = NondegreeCourseCardSchema.safeParse(row);

      if (!parse.success) throw new Error(parse.error.message);

      courseList.push(parse.data);
    }

    reply.code(200).send({
      data: courseList,
      message: "Search Non-Degree Course Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: JSON.parse(e.message),
    });
  }
}

async function insertNewCourse(
  request: FastifyRequest<{
    Params: {
      category: "course_graduate" | "course_undergraduate" | "non-degree";
    };
    Body: CreateCourseBodyType;
  }>,
  reply: FastifyReply,
) {
  const body = request.body;

  const model = new CourseModel(
    request.lang,
    request.params.category,
    request.user,
  );

  try {
    const parse = CreateCourseBodySchema.safeParse(body);

    if (!parse.success) throw new Error(parse.error.message);

    await model.insertNewCourse(
      parse.data,
      slugify(parse.data.title, {
        lower: true,
        strict: true,
        trim: true,
      }),
    );

    reply.code(200).send({ message: "Insert New Course Success!" });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function updateCourse(
  request: FastifyRequest<{
    Params: CourseParamsRequestType;
    Body: UpdateCourseBodyType;
  }>,
  reply: FastifyReply,
) {
  const body = request.body;
  const model = new CourseModel(
    request.lang,
    request.params.category,
    request.user,
  );

  try {
    const parse = UpdateCourseBodySchema.safeParse(body);

    if (!parse.success) throw new Error(parse.error.message);

    await model.updateCourse(request.params.slug, body);

    reply.code(200).send({
      message: "Update Course Success!",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

export {
  getCourseList,
  getCourseDetail,
  getNonDegreeCourseList,
  getNonDegreeCourse,
  searchNonDegreeCourses,
  insertNewCourse,
  updateCourse,
};
