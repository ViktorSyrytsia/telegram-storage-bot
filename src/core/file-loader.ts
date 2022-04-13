import path from "path";
import got from "got";
import nconf from "nconf";
import { createWriteStream, mkdir } from "fs";
import { PrismaClient } from "@prisma/client";
import { File } from "telegraf/typings/core/types/typegram";
import { TelegramContext } from "./telegram-context";

nconf.argv().env().file("config.json");
export class FileLoader {
  private _telegramContext: TelegramContext;
  private _prisma: PrismaClient;
  private _file: File | null = null;
  private _thumb: File | null = null;
  private _FOLDER_TO_SAVE = nconf.get("folder_to_save");

  constructor(telegramContext: TelegramContext, prisma: PrismaClient) {
    this._telegramContext = telegramContext;
    this._prisma = prisma;
  }

  async save() {
    if (this._telegramContext.isFileContext) {
      this._file = await this._telegramContext.getFile();
      this._thumb = await this._telegramContext.getThumb();

      if (this._file && this._thumb) {
        const savedFilePath = this.saveFile();
        const savedThumbPath = this.saveThumb();
        const file = await this._prisma.file.create({
          data: {
            author_id: this._telegramContext.userId,
            file_name: this._telegramContext.fileName || "unknown",
            file_path: savedFilePath,
            folder: this._createDayFolderName(),
            thumb: savedThumbPath,
          },
        });
        console.log(file);
        
        this._telegramContext.sendMessage(
          `Document saved at ${file.file_path}`
        );
      }
    }
  }

  private saveFile(): string {
    const downloadUrl = this._createDownloadUrl((this._file as File).file_path);
    const dayFolder = this._createDayFolderName();
    const user = this._telegramContext.username;
    const fileName = this._telegramContext.fileName;
    return this._downloadFile(downloadUrl, dayFolder, user, fileName);
  }

  private saveThumb(): string {
    const downloadUrl = this._createDownloadUrl(
      (this._thumb as File).file_path
    );
    const user = this._telegramContext.username;
    const thumbName = "thumb_" + this._telegramContext.fileName;
    return this._downloadFile(downloadUrl, "thumb", user, thumbName);
  }

  private _createDownloadUrl(filePath?: string): string {
    return `${this._telegramContext.telegramFileDownloadUrl}${this._telegramContext.telegramToken}/${filePath}`;
  }

  private _downloadFile(
    url: string,
    dayFolder: string,
    user: string,
    fileName: string
  ) {
    const folderPath = path.resolve(this._FOLDER_TO_SAVE, user, dayFolder);
    const fullPath = path.resolve(folderPath, fileName);
    mkdir(
      folderPath,
      { recursive: true },
      (err: NodeJS.ErrnoException | null) => {
        if (!err) {
          got.stream(url).pipe(createWriteStream(fullPath));
        }
      }
    );
    return fullPath;
  }

  private _createDayFolderName(): string {
    return new Date().toLocaleDateString().split(".").join("-");
  }
}
