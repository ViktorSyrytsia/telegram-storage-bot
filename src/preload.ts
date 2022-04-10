import nconf from "nconf";
import ngrok from "ngrok";
import "reflect-metadata";
import { Telegraf } from "telegraf";
import { ContextWithDB } from "./models/context";
import { fileLoader } from "./core/file-loader";
import { AppDataSource } from "./db/datasource";

nconf.argv().env().file("config.json");
const TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
const TELEGRAM_FILE_URL = nconf.get("telegram_file_url");
const NGROK_AUTH_TOKEN = nconf.get("ngrok_auth_token");
const PORT = nconf.get("port");
const TELEGRAM_WEBHOOK_URL = nconf.get("telegram_webhook_url");

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

AppDataSource.initialize()
  .then(main)
  .catch((error) => console.log(error));

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(
      `${type}-version`,
      process.versions[type as keyof NodeJS.ProcessVersions] as string
    );
  }
});
