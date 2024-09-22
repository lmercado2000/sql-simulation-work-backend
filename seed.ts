import dotenv from "dotenv";
import pg from "pg";
const dbInit = await Bun.file("./db/setup.sql").text();
import { faker } from "@faker-js/faker";
import type { Student } from "./src/router";

const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432 // default port for PostgreSQL
});

await db.connect();
await db.query(`
  DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Loop through each table in the current schema and drop it with CASCADE
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) 
    LOOP 
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; 
    END LOOP; 
END $$;`);
await db.query(dbInit);

// seed data

const attendingStatusId = (
  await db.query(
    "INSERT INTO Student_status (name) VALUES ('Attending') RETURNING id"
  )
).rows[0].id;

function createRandomMStudent() {
  return {
    first_name: faker.person.firstName("male"),
    last_name: faker.person.lastName("male"),
    status_id: attendingStatusId,
    sex: true
  };
}

function createRandomFStudent() {
  return {
    first_name: faker.person.firstName("female"),
    last_name: faker.person.lastName("female"),
    status_id: attendingStatusId,
    sex: false
  };
}

const maleStudents = faker.helpers.multiple(createRandomMStudent, {
  count: 15
});

const femaleStudents = faker.helpers.multiple(createRandomFStudent, {
  count: 15
});

const insertStudentsBatch = async (
  students: {
    first_name: string;
    last_name: string;
    status_id: number;
    sex: boolean;
  }[]
) => {
  const values: any[] = [];
  const placeholders = students
    .map((student, index) => {
      const baseIndex = index * 4;
      values.push(
        student.first_name,
        student.last_name,
        student.status_id,
        student.sex
      );
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
        baseIndex + 4
      })`;
    })
    .join(", ");

  const query = `INSERT INTO Students (first_name, last_name, status_id, sex) VALUES ${placeholders}`;

  await db.query(query, values);
};

await insertStudentsBatch(maleStudents);
await insertStudentsBatch(femaleStudents);

console.log("Seeded database");
process.exit(0);
