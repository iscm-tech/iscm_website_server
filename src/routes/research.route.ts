import {
  getAllPublicationList,
  getBookList,
} from "@/controllers/research.controller";
import { BookType, PublicationType } from "@/schemaValidation/research.schema";
import { ErrorResType } from "@/types/error.types";
import { BookListResType, ResearchListResType } from "@/types/research.types";
import { FastifyInstance } from "fastify";

async function researchRoute(server: FastifyInstance) {
  server.get<{
    Params: {
      category:
        | "framework transition"
        | "glocal design"
        | "human centric approach"
        | "urban system"
        | "tech solutions";
    };
    Querystring: { lang: LangType; page: number };
    Reply: { 200: ResearchListResType<PublicationType>; 500: ErrorResType };
  }>("/publications", getAllPublicationList);

  server.get<{
    Querystring: { lang: LangType };
    Reply: { 200: BookListResType<BookType>; 500: ErrorResType };
  }>("/books", getBookList);
}

export default researchRoute;
