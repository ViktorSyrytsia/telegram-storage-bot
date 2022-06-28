import { File } from "@prisma/client";
import { readFile } from "fs";
import { Telegram } from "telegraf";

export class FileReader {
  private _telegram: Telegram;
  constructor(telegram: Telegram) {
    this._telegram = telegram;
  }
  sendFile(file: File) {
    try {
      readFile(file.file_path, async (err, data) => {
        await this._telegram.sendDocument(
          +file.author_id,
          {
            source: data,
            filename: file.file_name,
          },
          {
            allow_sending_without_reply: true,
            protect_content: false,
          }
        );
      });
    } catch (error) {
      throw new Error("File read error");
    }
  }
}
