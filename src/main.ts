import { PrismaClient } from "@prisma/client";
import nconf from "nconf";
import ngrok from "ngrok";
import fastify from "fastify";
import { Telegraf } from "telegraf";
import { FileLoader } from "./core/file-loader";
import { TelegramContext } from "./core/telegram-context";
import { FileReader } from "./core/file-reader";

nconf.argv().env().file("config.json");

const TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
const NGROK_AUTH_TOKEN = nconf.get("ngrok_auth_token");
const WEBHOOK_PORT = nconf.get("webhook_port");
const API_SERVER_PORT = nconf.get("api_server_port");
const TELEGRAM_WEBHOOK_URL = nconf.get("telegram_webhook_url");

async function main() {
  const server = fastify();

  const prisma = new PrismaClient();
  await ngrok.authtoken(NGROK_AUTH_TOKEN);
  const webhookUrl = await ngrok.connect(WEBHOOK_PORT);
  const serverUrl = await ngrok.connect(API_SERVER_PORT);
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  bot.telegram.setWebhook(`${webhookUrl}${TELEGRAM_WEBHOOK_URL}`);
  // @ts-expect-error fixme
  bot.startWebhook(`${TELEGRAM_WEBHOOK_URL}`, null, WEBHOOK_PORT);

  server.post<{ Body: { id: string } }>("/download", async (request, reply) => {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: +request.body.id,
        },
      });
      if (file) {
        new FileReader(bot.telegram).sendFile(file);
        reply.status(200).send({ message: "Done" });
      }
    } catch (error) {
      reply.status(500).send({ error });
    }
  });

  bot.on("message", async (ctx) => {
    new FileLoader(new TelegramContext(ctx), prisma).save();
  });

  server.listen(API_SERVER_PORT, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${serverUrl}`);
  });
}

main();
