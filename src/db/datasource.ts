import { DataSource } from "typeorm";
import nconf from "nconf";
import { join } from "path";

nconf.argv().env().file("config.json");
const DATABASE_URL = nconf.get("database_url");

export const AppDataSource = new DataSource({
  name: "default",
  type: "postgres",
  url: DATABASE_URL,
  synchronize: true,
  logging: true,
  entities: [join(__dirname, '**', '*.entity.{ts,js}')]
});
