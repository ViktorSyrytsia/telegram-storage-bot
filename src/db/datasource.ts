import { DataSource } from "typeorm";
import nconf from "nconf";

nconf.argv().env().file("config.json");
const DATABASE_URL = nconf.get("database_url");

export const AppDataSource = new DataSource({
  name: "default",
  type: "postgres",
  url: DATABASE_URL,
  synchronize: true,
  logging: true,
  entities: ["src/entity/*.*"],
});
