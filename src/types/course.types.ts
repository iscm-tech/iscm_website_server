import { CourseCardType, CourseType } from "@/schemaValidation/course.schema";

export interface CourseParamsRequestType {
  category: "course_graduate" | "course_undergraduate" | "non-degree";
  slug: string;
}

export interface CourseResType {
  data: CourseType;
  message: string;
}

export interface CourseListResType {
  data: Array<CourseCardType>;
  message: string;
}
