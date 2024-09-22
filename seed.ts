import dotenv from "dotenv";
import pg from "pg";
import { el, faker } from "@faker-js/faker";

const dbInit = await Bun.file("./db/setup.sql").text();

let teacherQuotes = (await Bun.file("./db/teacher_quotes.txt").text()).split(
  "\n"
);
let elementarySchoolQuotes = (
  await Bun.file("./db/elementary_school_quotes.txt").text()
).split("\n");
let middleSchoolQuotes = (
  await Bun.file("./db/middle_school_kids_quotes.txt").text()
).split("\n");
let highSchoolQuotes = (
  await Bun.file("./db/high_school_quotes.txt").text()
).split("\n");

let usedElementaryQuotes: string[] = [];

/**
 * Get a random elementary school quote
 * Loops randomly through quotes without repeating until it runs out
 * then it repeats the process
 */
function getRandomElementaryQuote() {
  if (elementarySchoolQuotes.length === 0) {
    elementarySchoolQuotes =
      elementarySchoolQuotes.concat(usedElementaryQuotes);
    usedElementaryQuotes = [];
  }
  const randomIndex = Math.floor(Math.random() * elementarySchoolQuotes.length);
  const quote = elementarySchoolQuotes[randomIndex];
  usedElementaryQuotes.push(quote);
  elementarySchoolQuotes.splice(randomIndex, 1);
  return quote;
}

let usedMiddleSchoolQuotes: string[] = [];

/**
 * Same as above
 */
function getRandomMiddleSchoolQuotes() {
  if (middleSchoolQuotes.length === 0) {
    middleSchoolQuotes = middleSchoolQuotes.concat(usedMiddleSchoolQuotes);
    usedMiddleSchoolQuotes = [];
  }
  const randomIndex = Math.floor(Math.random() * middleSchoolQuotes.length);
  const quote = middleSchoolQuotes[randomIndex];
  usedMiddleSchoolQuotes.push(quote);
  middleSchoolQuotes.splice(randomIndex, 1);
  return quote;
}

let usedHighSchoolQuotes: string[] = [];

/**
 * Same as above
 */
function getRandomHighSchoolQuotes() {
  if (highSchoolQuotes.length === 0) {
    highSchoolQuotes = highSchoolQuotes.concat(usedHighSchoolQuotes);
    usedHighSchoolQuotes = [];
  }
  const randomIndex = Math.floor(Math.random() * highSchoolQuotes.length);
  const quote = highSchoolQuotes[randomIndex];
  usedHighSchoolQuotes.push(quote);
  highSchoolQuotes.splice(randomIndex, 1);
  return quote;
}

let usedTeacherQuotes: string[] = [];

/**
 * Same as above
 */
function getRandomTeacherQuotes() {
  if (teacherQuotes.length === 0) {
    teacherQuotes = teacherQuotes.concat(usedTeacherQuotes);
    usedTeacherQuotes = [];
  }
  const randomIndex = Math.floor(Math.random() * teacherQuotes.length);
  const quote = teacherQuotes[randomIndex];
  usedTeacherQuotes.push(quote);
  teacherQuotes.splice(randomIndex, 1);
  return quote;
}

function fiftyFifty(): boolean {
  const randomNumber = Math.random();
  return randomNumber > 0.5;
}

//* MAIN FILE START

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

//* seed data

//* Create status IDs

const attendingStatusId = (
  await db.query(
    "INSERT INTO Student_status (name) VALUES ('Attending') RETURNING id"
  )
).rows[0].id;

//* Create students

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
      const baseIndex = index * 5;
      values.push(
        student.first_name,
        student.last_name,
        student.status_id,
        student.sex,
        getRandomElementaryQuote()
      );
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
        baseIndex + 4
      }, $${baseIndex + 5})`;
    })
    .join(", ");

  const query = `INSERT INTO Students (first_name, last_name, status_id, sex, quote) VALUES ${placeholders}`;

  await db.query(query, values);
};

await insertStudentsBatch(maleStudents);
await insertStudentsBatch(femaleStudents);

//* Create teachers

const insertTeachersBatch = async (teachers: any[]) => {
  const values: any[] = [];
  const placeholders = teachers
    .map((teacher, index) => {
      const baseIndex = index * 4;
      values.push(
        teacher.first_name,
        teacher.last_name,
        fiftyFifty(),
        getRandomTeacherQuotes()
      );
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
        baseIndex + 4
      })`;
    })
    .join(", ");

  const query = `INSERT INTO Teachers (first_name, last_name, sex, quote) VALUES ${placeholders}`;

  await db.query(query, values);
};

function createRandomTeacher() {
  const m = fiftyFifty();
  return {
    first_name: faker.person.firstName(m ? "male" : "female"),
    last_name: faker.person.lastName(m ? "male" : "female")
  };
}

const randomTeachers = faker.helpers.multiple(createRandomTeacher, {
  count: 20
});

await insertTeachersBatch(randomTeachers);

console.log("Seeded database");
process.exit(0);
