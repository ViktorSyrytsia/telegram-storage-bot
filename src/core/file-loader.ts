import { Context } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";
import { ContextWithDB } from "../models/context";
import { createDownloadUrl } from "../utils/create-download-url";
import { createFolderName } from "../utils/create-folder-name";
import { downloadFile } from "../utils/download-file";
import { getDocumentFromContext } from "../utils/get-document-from-context";
import { getPhotoFromContext } from "../utils/get-photo-from-context";

export async function fileLoader(ctx: Context<Update.MessageUpdate>) {
  // Get variables fro m context
  const fileUrl = (ctx as unknown as ContextWithDB).db.file_url;
  const token = (ctx as unknown as ContextWithDB).db.token;

  // Document or Photo
  const isDocument = !!(ctx.message as Message.DocumentMessage).document;
  const isPhoto = !!(ctx.message as Message.PhotoMessage).photo;
  const folderName = createFolderName();
  const user = ctx.message.from.username || "unknown";

  // Save Document
  if (isDocument) {
    const document = await getDocumentFromContext(ctx);
    const downloadUrl = createDownloadUrl(fileUrl, token, document.file_path);
    const name = (ctx.update.message as Message.DocumentMessage).document
      .file_name;
    downloadFile(downloadUrl, folderName, user, name);
    ctx.telegram.sendMessage(ctx.message.chat.id, `Document saved: ${name}`);
  }

  // Save Photo
  if (isPhoto) {
    const photo = await getPhotoFromContext(ctx);
    const downloadUrl = createDownloadUrl(fileUrl, token, photo.file_path);
    const name = photo.file_unique_id + ".jpg";
    downloadFile(downloadUrl, folderName, user, name);
    ctx.telegram.sendMessage(ctx.message.chat.id, `Photo saved: ${name}`);
  }
}
