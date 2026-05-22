import {
  getCourseDetail,
  getCourseList,
  getNonDegreeCourse,
  getNonDegreeCourseList,
  insertNewCourse,
  searchNonDegreeCourses,
  updateCourse,
} from "@/controllers/course.controller";
import { requiredLoginedHook } from "@/hooks/auth.hook";
import {
  CreateCourseBodySchema,
  CreateCourseBodyType,
  UpdateCourseBodySchema,
  UpdateCourseBodyType,
} from "@/schemaValidation/course.schema";
import {
  CourseListResType,
  CourseParamsRequestType,
  CourseResType,
} from "@/types/course.types";
import { ErrorResType } from "@/types/error.types";
import { FastifyInstance } from "fastify";

function courseRoute(server: FastifyInstance) {
  server.get<{
    Params: CourseParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: {
      200: CourseListResType;
      404: { message: string };
      500: ErrorResType;
    };
  }>("/:category", getCourseList);

  server.get<{
    Params: CourseParamsRequestType;
    Querystring: { lang: LangType; page: number };
    Reply: { 200: CourseResType; 404: { message: string }; 500: ErrorResType };
  }>("/:category/:slug", getCourseDetail);

  server.get<{ Querystring: { lang: LangType; page: number } }>(
    "/non-degree",
    getNonDegreeCourseList
  );

  server.get<{ Params: { slug: string } }>(
    "/non-degree/:slug",
    getNonDegreeCourse
  );

  server.get<{
    Querystring: {
      title?: string;
      level?: string;
      type?: string;
      language?: string;
      status?: "coming_soon" | "open" | "closed";
    };
  }>("/non-degree/search", searchNonDegreeCourses);

  server.post<{
    Params: {
      category: "course_graduate" | "course_undergraduate" | "non-degree";
    };
    Body: CreateCourseBodyType;
  }>(
    "/:category",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: CreateCourseBodySchema,
      },
    },
    insertNewCourse
  );

  server.put<{ Params: CourseParamsRequestType; Body: UpdateCourseBodyType }>(
    "/:category/:slug",
    {
      preValidation: [requiredLoginedHook],
      schema: {
        body: UpdateCourseBodySchema,
      },
    },
    updateCourse
  );
}

export default courseRoute;
