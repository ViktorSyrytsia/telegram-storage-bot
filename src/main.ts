import { PrismaClient } from "@prisma/client";
import nconf from "nconf";
import ngrok from "ngrok";
import { Telegraf } from "telegraf";
import { FileLoader } from "./core/file-loader";
import { TelegramContext } from "./core/telegram-context";

nconf.argv().env().file("config.json");

const TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
const NGROK_AUTH_TOKEN = nconf.get("ngrok_auth_token");
const PORT = nconf.get("port");
const TELEGRAM_WEBHOOK_URL = nconf.get("telegram_webhook_url");

async function main() {
  await ngrok.authtoken(NGROK_AUTH_TOKEN);
  const hostUrl = await ngrok.connect(PORT);
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  bot.telegram.setWebhook(`${hostUrl}${TELEGRAM_WEBHOOK_URL}`);
  // @ts-expect-error fixme
  bot.startWebhook(`${TELEGRAM_WEBHOOK_URL}`, null, PORT);

  bot.on("message", async (ctx) => {
    const fileLoader = new FileLoader(
      new TelegramContext(ctx),
      new PrismaClient()
    );
    fileLoader.save();
  });
}

main();
