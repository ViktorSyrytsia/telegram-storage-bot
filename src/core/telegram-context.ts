import nconf from "nconf";
import { Context } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

nconf.argv().env().file("config.json");

export class TelegramContext {
  private _ctx: Context<Update.MessageUpdate>;
  private _TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
  private _TELEGRAM_FILE_URL = nconf.get("telegram_file_url");
  constructor(ctx: Context<Update.MessageUpdate>) {
    this._ctx = ctx;
  }

  get telegramFileDownloadUrl(): string {
    return this._TELEGRAM_FILE_URL;
  }
  get telegramToken(): string {
    return this._TELEGRAM_BOT_TOKEN;
  }
  get isFileContext(): boolean {
    return !!(this._ctx.message as Message.DocumentMessage).document;
  }
  get fileName(): string {
    return (this._ctx.update.message as Message.DocumentMessage).document
      .file_name as string;
  }
  get username(): string {
    return this._ctx.message.from.username || "unknown";
  }
  get userId(): string {
    return this._ctx.message.from.id.toString();
  }

  async getFile() {
    const document = (this._ctx.update.message as Message.DocumentMessage)
      .document;
    return document ? await this._ctx.telegram.getFile(document.file_id) : null;
  }
  async getThumb() {
    const thumb = (this._ctx.update.message as Message.DocumentMessage).document
      .thumb;
    return thumb ? await this._ctx.telegram.getFile(thumb.file_id) : null;
  }

  sendMessage(message: string) {
    this._ctx.telegram.sendMessage(this._ctx.message.chat.id, `${message}`);
  }
}
