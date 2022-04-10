import nconf from "nconf";
import "reflect-metadata";
import { Telegraf } from "telegraf";
import { ContextWithDB } from "./models/context";
import { fileLoader } from "./core/file-loader";
import { AppDataSource } from "./db/datasource";

nconf.argv().env().file("config.json");
const TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
const TELEGRAM_FILE_URL = nconf.get("telegram_file_url");

async function main() {
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  ((bot.context as ContextWithDB).db = {
    token: TELEGRAM_BOT_TOKEN,
    file_url: TELEGRAM_FILE_URL,
  }),
    bot.on("message", async (ctx) => fileLoader(ctx));
}

AppDataSource.initialize()
  .then(main)
  .catch((error) => console.log(error));
