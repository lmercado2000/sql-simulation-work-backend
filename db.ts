import pg from "pg";
import dotenv from "dotenv";
const dbInit = await Bun.file("db/main.sql").text();

export const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD
});

await db.connect();
await db.query(dbInit);
