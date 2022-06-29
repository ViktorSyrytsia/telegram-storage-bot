/* eslint-disable no-constant-condition */
import { PrismaClient } from "@prisma/client";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";
import nconf from "nconf";
import ngrok from "ngrok";
import fastify from "fastify";
import fastifyStatic from "fastify-static";
import { Telegraf } from "telegraf";
import { FileLoader } from "./core/file-loader";
import { TelegramContext } from "./core/telegram-context";
import { FileReader } from "./core/file-reader";
import got, { CancelableRequest, Response } from "got/dist/source";
import path from "path";
import fs from "fs";

nconf.argv().env().file("config.json");

const TELEGRAM_APIID = nconf.get("telegram_api_id");
const TELEGRAM_APIHASH = nconf.get("telegram_api_hash");
const stringSession = new StringSession();

const TELEGRAM_BOT_TOKEN = nconf.get("telegram_bot_token");
const NGROK_AUTH_TOKEN = nconf.get("ngrok_auth_token");
const WEBHOOK_PORT = nconf.get("webhook_port");
const API_SERVER_PORT = nconf.get("api_server_port");
const TELEGRAM_WEBHOOK_URL = nconf.get("telegram_webhook_url");
const GOOGLE_API_KEY = nconf.get("google_api_key");

async function main() {
  const server = fastify();

  server.register(fastifyStatic, {
    root: path.join(__dirname, "public"),
    prefix: "/public/", // optional: default '/'
  });

  const prisma = new PrismaClient();
  await ngrok.authtoken(NGROK_AUTH_TOKEN);
  const webhookUrl = await ngrok.connect(WEBHOOK_PORT);
  const serverUrl = await ngrok.connect(API_SERVER_PORT);
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  bot.telegram.setWebhook(`${webhookUrl}${TELEGRAM_WEBHOOK_URL}`);
  // @ts-expect-error fixme
  bot.startWebhook(`${TELEGRAM_WEBHOOK_URL}`, null, WEBHOOK_PORT);

  server.get<{ Params: { id: string } }>(
    "/download/:id",
    async (request, reply) => {
      try {
        const file = await prisma.file.findFirst({
          where: {
            id: +request.params.id,
          },
        });
        if (file) {
          new FileReader(bot.telegram).sendFile(file);
          reply.status(200).send({ message: "Done" });
        }
      } catch (error) {
        reply.status(500).send({ error });
      }
    }
  );

  bot.on("message", async (ctx) => {
    if (false) {
      new FileLoader(new TelegramContext(ctx), prisma).save();
    } else {
      console.log(ctx.message);
    }
  });

  server.get("/", async (req, reply) => {
    try {
      const stream = fs.createReadStream("public/index.html");
      return reply.type("text/html").send(stream);
    } catch (error) {
      console.log(error);
    }
  });

  server.get("/markers", async (req, reply) => {
    try {
      const client = new TelegramClient(
        stringSession,
        +TELEGRAM_APIID,
        TELEGRAM_APIHASH,
        {
          connectionRetries: 5,
        }
      );
      await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
          await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
      });
      console.log("You should now be connected.");
      console.log(client.session.save());

      const myChannel = await client.getEntity("me");
      const myMessages = await client.getMessages(myChannel);
      console.log(Number((myMessages[0].fwdFrom?.fromId as any).channelId));

      const id = 1771593509;

      const writChannel = await client.getEntity(id);
      const writMessages = await client.getMessages(writChannel);

      const getAddress = (message: string): string => {
        const chartAtStart = message.indexOf("❗️");
        const slicedMessage = message.slice(chartAtStart);
        const charAtEnd = slicedMessage.indexOf("📝");
        return slicedMessage.slice(0, charAtEnd);
      };

      const cutAddress = (address: string[]): string[] => {
        return address
          .map((item) => item.split(",")[0])
          .map((item) => item.split(" "))
          .map((item) => {
            if (item.length > 3) {
              return item.slice(0, 3).join(" ");
            } else {
              return item.join(" ");
            }
          })
          .map((item) => item.slice(1))
          .map((item) => `м. Львів, ${item}`);
      };

      const address = writMessages
        .map((item) => item.message)
        .filter((message) => !!message)
        .filter(
          (message) =>
            message.toLowerCase().includes("вруч") ||
            message.toLowerCase().includes("випис") ||
            message.toLowerCase().includes("оформл")
        )
        .map((message) => getAddress(message));

      const content = cutAddress(address);
      const premisses: CancelableRequest<Response<string>>[] = [];

      content.forEach((element) => {
        premisses.push(
          got.get(
            `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${element}&inputtype=textquery&fields=formatted_address%2Cname%2Crating%2Copening_hours%2Cgeometry&key=${GOOGLE_API_KEY}`
          )
        );
      });
      const res = await Promise.all(premisses);
      const results = res.map((r) => JSON.parse(r.body).candidates[0]);
      console.log({ results });
      reply.status(200).send(results);
    } catch (error) {
      console.log(error);
    }
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
