import fs from "fs";
import path from "path";
import { FastifyRequest } from "fastify";
import envConfig from "config";

export default async function processUploadPath(request: FastifyRequest) {
  const baseDir = path.resolve(
    process.cwd(),
    envConfig.MEDIA_UPLOAD_FOLDER,
    "images",
  );

  // Destination which files need to be uploaded to
  const rawPath = request.url.split("/upload")[1];
  // Resolve path
  const resolvedPath = path.resolve(baseDir, "." + rawPath);

  // Check path traversal
  if (rawPath.includes("..")) {
    throw new Error("Path traversal detected");
  }

  // Ensure the processed path inside base dir
  if (!resolvedPath.startsWith(baseDir)) {
    throw new Error("Invalid directory path");
  }

  try {
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  }

  request.path = { fullPath: resolvedPath, isDir: true };
}
