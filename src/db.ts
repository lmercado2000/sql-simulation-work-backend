import { Pool } from "pg";
import dotenv from "dotenv";

export const db = new Pool({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432 // default port for PostgreSQL
});
