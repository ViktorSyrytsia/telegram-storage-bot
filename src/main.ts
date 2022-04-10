import nconf from "nconf";
import "reflect-metadata";
import { Telegraf } from "telegraf";
import { ContextWithDB } from "./models/context";
import { fileLoader } from "./core/file-loader";
import { AppDataSource } from "./db/datasource";
import { app, BrowserWindow } from "electron";
import * as path from "path";

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

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 800,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  console.log("CONTEXT");
  AppDataSource.initialize()
    .then(main)
    .catch((error) => console.log(error));
  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
