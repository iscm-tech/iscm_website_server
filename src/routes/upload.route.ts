import fs from "fs";
import path from "path";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { requiredLoginedHook } from "@/hooks/auth.hook";
import processUploadPath from "@/middlewares/processUploadPath";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

async function uploadImageRoute(server: FastifyInstance) {
  server.post(
    "/:category/*",
    { preValidation: [requiredLoginedHook], preHandler: [processUploadPath] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const fileTypeFromBuffer = (await import("file-type")).fileTypeFromBuffer;

      try {
        const parts = request.files();
        for await (const part of parts) {
          if (part.file) {
            // ----------- File Type Validation -----------
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);
            const type = await fileTypeFromBuffer(buffer);

            // Just allow files declared in list
            if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
              return reply.code(400).send({
                message: `Invalid file type`,
              });
            }
            // ----------- ****** -----------

            // Ensure remove path injection (path traversal)
            const originalName = path.basename(part.filename || "file");
            // Clean special characters
            const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            // Remove ext
            const nameWithoutExt = safeName.replace(/\.[^/.]+$/, "");
            const filename = `${nameWithoutExt}.${type.ext}`;

            // Write File
            await fs.promises.writeFile(
              path.join(request.path.fullPath, filename),
              buffer,
            );
          }
        }
        reply.code(200).send({
          message: "files uploaded successfully",
          path: request.path.fullPath,
        });
      } catch (_e) {
        const e: Error = _e as Error;
        console.log(e, "error in upload");
        reply.code(500).send({
          message: e.message,
        });
      }
    },
  );
}

export default uploadImageRoute;
