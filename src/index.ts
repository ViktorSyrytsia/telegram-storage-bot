import nconf from "nconf";
import ngrok from "ngrok";
import { Telegraf } from "telegraf";
import { ContextWithDB } from "./models/context";
import { fileLoader } from "./core/file-loader";

nconf.argv().env().file("config.json");

const PORT = nconf.get("port");
const TELEGRAM_WEBHOOK_URL = nconf.get("telegram_webhook_url");
const NGROK_AUTH_TOKEN = nconf.get("ngrok_auth_token");
const TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
const TELEGRAM_FILE_URL = nconf.get("telegram_file_url");

async function main() {
  await ngrok.authtoken(NGROK_AUTH_TOKEN);
  const hostUrl = await ngrok.connect(PORT);
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  ((bot.context as ContextWithDB).db = {
    token: TELEGRAM_BOT_TOKEN,
    file_url: TELEGRAM_FILE_URL,
  }),
    bot.telegram.setWebhook(`${hostUrl}${TELEGRAM_WEBHOOK_URL}`);

  // @ts-expect-error fixme
  bot.startWebhook(`${TELEGRAM_WEBHOOK_URL}`, null, PORT);

  bot.on("message", async (ctx) => fileLoader(ctx));
}

main();
