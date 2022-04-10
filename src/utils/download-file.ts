import { createWriteStream, mkdir } from "fs";
import got from "got";
import nconf from "nconf";
import path from "path";

nconf.argv().env().file("config.json");

const FOLDER_TO_SAVE = nconf.get("folder_to_save");

export function downloadFile(
  url: string,
  folderName: string,
  fileName?: string
): void {
  const pathName = path.resolve(FOLDER_TO_SAVE, folderName);
  const name = (fileName as string) || "unknown_file" + Date.now();
  mkdir(pathName, { recursive: true }, (err: NodeJS.ErrnoException | null) => {
    if (!err) {
      got.stream(url).pipe(createWriteStream(path.resolve(pathName, name)));
    }
  });
}
