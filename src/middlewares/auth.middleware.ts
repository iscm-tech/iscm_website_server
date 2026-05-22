import { FastifyReply, FastifyRequest } from "fastify";
import { verifyAPIKey } from "@/utils/crypto";

async function authenticateByAPIKey(
  request: FastifyRequest<{ Headers: { "x-api-key": string } }>,
  reply: FastifyReply
) {
  const apiKey: string = request.headers["x-api-key"];
  try {
    if (!verifyAPIKey(apiKey)) {
      reply.code(401).send({
        message: "Invalid API Key",
      });
    }
  } catch (_e) {
    const e: Error = _e as Error;
    console.error(e);
    reply.code(401).send({
      message: "Invalid API Key",
    });
  }
}

export { authenticateByAPIKey };
