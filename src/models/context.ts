import { Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";

export interface ContextWithDB extends Partial<Context<Update>> {
  db: {
    token: string;
    file_url: string;
  };
}
