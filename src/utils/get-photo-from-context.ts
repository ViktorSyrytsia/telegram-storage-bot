import { Context } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

export async function getPhotoFromContext(ctx: Context<Update.MessageUpdate>) {
  const photos = (ctx.message as Message.PhotoMessage).photo;
  return await ctx.telegram.getFile(photos[photos.length - 1].file_id);
}
