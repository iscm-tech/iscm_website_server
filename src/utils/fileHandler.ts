import fs from "fs";
import path from "path";

async function getContentFiles(dir: string, files: Array<FileType> = []) {
  const fileList = fs.readdirSync(dir);

  for (const file of fileList) {
    const name = `${dir}/${file}`;

    if (fs.statSync(name).isDirectory()) {
      getContentFiles(name, files);
    } else if (
      path.extname(name) === ".md" &&
      path.basename(name, ".md") !== "_index"
    ) {
      files.push({
        fullPath: path.normalize(name),
        isDir: false,
      });
    }
  }
}

export { getContentFiles };
