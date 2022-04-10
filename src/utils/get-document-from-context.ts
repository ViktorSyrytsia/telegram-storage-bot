import { Context } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

export async function getDocumentFromContext(
  ctx: Context<Update.MessageUpdate>
) {
  return await ctx.telegram.getFile(
    (ctx.update.message as Message.DocumentMessage).document.file_id
  );
}
