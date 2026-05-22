import { BookType, PublicationType } from "@/schemaValidation/research.schema";
import { ErrorResType } from "@/types/error.types";
import { BookListResType, ResearchListResType } from "@/types/research.types";
import { FastifyReply, FastifyRequest } from "fastify";
import ResearchModel from "@/models/research.model";

async function getAllPublicationList(
  request: FastifyRequest,
  reply: FastifyReply<{
    Reply: { 200: ResearchListResType<PublicationType>; 500: ErrorResType };
  }>
): Promise<void> {
  const model = new ResearchModel(request.lang);

  try {
    const publicationList: Array<{
      year: number;
      publications_list: PublicationType[];
    }> = await model.getAllPublicationList();

    reply.code(200).send({
      data: publicationList,
      message: "Get Publication List Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

async function getBookList(
  request: FastifyRequest,
  reply: FastifyReply<{
    Reply: { 200: BookListResType<BookType>; 500: ErrorResType };
  }>
): Promise<void> {
  const model = new ResearchModel(request.lang);

  try {
    const bookList: Array<BookType> = await model.getBookList();

    reply.code(200).send({
      data: bookList,
      message: "Get Book List Success",
    });
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(500).send({
      message: e.message,
    });
  }
}

export { getAllPublicationList, getBookList };
