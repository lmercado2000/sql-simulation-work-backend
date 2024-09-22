import dotenv from "dotenv";
import pg from "pg";
import { el, faker } from "@faker-js/faker";

const dbInit = await Bun.file("./db/setup.sql").text();

function insertReturningID(query: string): Promise<number> {
  return db.query(query).then((res) => res.rows[0].id);
}

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

//* subjects

const physicalEducationSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Physical Education') RETURNING id"
);

//* Grade 1 subjects

const mathFoundationsSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Math Foundations') RETURNING id"
);
const introductionToReadingSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Introduction to Reading') RETURNING id"
);
const primaryScienceSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Primary Science') RETURNING id"
);
const socialSkillsSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Social Skills') RETURNING id"
);

const grade1SubjectsIDs = {
  mathFoundations: mathFoundationsSubjectID,
  introductionToReading: introductionToReadingSubjectID,
  primaryScience: primaryScienceSubjectID,
  socialSkills: socialSkillsSubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 2 subjects

const basicArithmeticSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Basic Arithmetic') RETURNING id"
);
const readingFluencySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Reading Fluency') RETURNING id"
);
const basicScienceSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Basic Science') RETURNING id"
);
const communityStudiesSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Community Studies') RETURNING id"
);

const grade2SubjectsIDs = {
  basicArithmetic: basicArithmeticSubjectID,
  readingFluency: readingFluencySubjectID,
  basicScience: basicScienceSubjectID,
  communityStudies: communityStudiesSubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 3 subjects

const elementaryMathSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Elementary Math') RETURNING id"
);
const readingAndWritingSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Reading and Writing') RETURNING id"
);
const elementaryScienceSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Elementary Science') RETURNING id"
);
const localHistorySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Local History') RETURNING id"
);

const grade3SubjectsIDs = {
  elementaryMath: elementaryMathSubjectID,
  readingAndWriting: readingAndWritingSubjectID,
  elementaryScience: elementaryScienceSubjectID,
  localHistory: localHistorySubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 4 subjects

const multiplicationAndDivisionSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Multiplication and Division') RETURNING id"
);
const intermediateReadingSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Intermediate Reading') RETURNING id"
);
const earthScienceSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Earth Science') RETURNING id"
);
const stateHistorySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('State History') RETURNING id"
);

const grade4SubjectsIDs = {
  multiplicationAndDivision: multiplicationAndDivisionSubjectID,
  intermediateReading: intermediateReadingSubjectID,
  earthScience: earthScienceSubjectID,
  stateHistory: stateHistorySubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 5 subjects

const intermediateMathSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Intermediate Math') RETURNING id"
);
const readingComprehensionSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Reading Comprehension') RETURNING id"
);
const lifeScienceSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Life Science') RETURNING id"
);
const americanHistorySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('American History') RETURNING id"
);

const grade5SubjectsIDs = {
  intermediateMath: intermediateMathSubjectID,
  readingComprehension: readingComprehensionSubjectID,
  lifeScience: lifeScienceSubjectID,
  americanHistory: americanHistorySubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 6 subjects

const preAlgebraSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Pre-Algebra') RETURNING id"
);
const essayWritingSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Essay Writing') RETURNING id"
);
const fundamentalsOfPhysicalScienceSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Fundamentals of Physical Science') RETURNING id"
);
const worldGeographySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('World Geography') RETURNING id"
);

const grade6SubjectsIDs = {
  preAlgebra: preAlgebraSubjectID,
  essayWriting: essayWritingSubjectID,
  fundamentalsOfPhysicalScience: fundamentalsOfPhysicalScienceSubjectID,
  worldGeography: worldGeographySubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 7 subjects

const algebraIISubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Algebra II') RETURNING id"
);
const advancedReadingAndWritingSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Advanced Reading and Writing') RETURNING id"
);
const worldHistorySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('World History') RETURNING id"
);

const introductionToForeignLanguageSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Introduction to Foreign Language') RETURNING id"
);
const artAndMusicSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Art and Music') RETURNING id"
);

const grade7SubjectsIDs = {
  algebraII: algebraIISubjectID,
  advancedReadingAndWriting: advancedReadingAndWritingSubjectID,
  worldHistory: worldHistorySubjectID,
  introductionToForeignLanguage: introductionToForeignLanguageSubjectID,
  artAndMusic: artAndMusicSubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 8 subjects

const geometrySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Geometry') RETURNING id"
);
const literatureAnalysisSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Literature Analysis') RETURNING id"
);

const ForeignLanguageISubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Foreign Language I') RETURNING id"
);

const grade8SubjectsIDs = {
  geometry: geometrySubjectID,
  literatureAnalysis: literatureAnalysisSubjectID,
  americanHistory: americanHistorySubjectID,
  physicalEducation: physicalEducationSubjectID,
  foreignLanguageI: ForeignLanguageISubjectID,
  artAndMusic: artAndMusicSubjectID
};

//* Grade 9 subjects

const algebraIIISubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Algebra III') RETURNING id"
);
const worldLiteratureSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('World Literature') RETURNING id"
);
const biologySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Biology') RETURNING id"
);
const civicsAndEconomicsSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Civics and Economics') RETURNING id"
);

const foreignLanguageIISubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Foreign Language II') RETURNING id"
);

const electiveCreativeSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Elective Creative') RETURNING id"
);

const grade9SubjectsIDs = {
  algebraIII: algebraIIISubjectID,
  worldLiterature: worldLiteratureSubjectID,
  biology: biologySubjectID,
  civicsAndEconomics: civicsAndEconomicsSubjectID,
  foreignLanguageII: foreignLanguageIISubjectID,
  electiveCreative: electiveCreativeSubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 10 subjects

const americanLiteratureSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('American Literature') RETURNING id"
);
const chemistrySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Chemistry') RETURNING id"
);

const foreignLanguageIIISubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Foreign Language III') RETURNING id"
);

const electiveBusinessSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Elective Business') RETURNING id"
);

const grade10SubjectsIDs = {
  geometry: geometrySubjectID,
  americanLiterature: americanLiteratureSubjectID,
  chemistry: chemistrySubjectID,
  worldHistory: worldHistorySubjectID,
  foreignLanguageIII: foreignLanguageIIISubjectID,
  electiveBusiness: electiveBusinessSubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 11 subjects

const preCalculusSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Pre-Calculus') RETURNING id"
);
const britishLiteratureSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('British Literature') RETURNING id"
);
const physicsSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Physics') RETURNING id"
);

const electiveAdvancedArtSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Elective Advanced Art') RETURNING id"
);

const grade11SubjectsIDs = {
  preCalculus: preCalculusSubjectID,
  britishLiterature: britishLiteratureSubjectID,
  physics: physicsSubjectID,
  americanHistory: americanHistorySubjectID,
  foreignLanguageII: foreignLanguageIIISubjectID,
  electiveAdvancedArt: electiveAdvancedArtSubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grade 12 subjects

const calculusSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Calculus') RETURNING id"
);
const englishCompositionSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('English Composition') RETURNING id"
);
const advancedScienceElectiveSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Advanced Science Elective') RETURNING id"
);
const governmentAndEconomicsSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Government and Economics') RETURNING id"
);

const foreignLanguageIVSubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Foreign Language IV') RETURNING id"
);

const electivePsychologySubjectID = await insertReturningID(
  "INSERT INTO Subjects (name) VALUES ('Elective Psychology') RETURNING id"
);

const grade12SubjectsIDs = {
  calculus: calculusSubjectID,
  englishComposition: englishCompositionSubjectID,
  advancedScienceElective: advancedScienceElectiveSubjectID,
  governmentAndEconomics: governmentAndEconomicsSubjectID,
  foreignLanguageIV: foreignLanguageIVSubjectID,
  electivePsychology: electivePsychologySubjectID,
  physicalEducation: physicalEducationSubjectID
};

//* Grades

const grade1ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (1) RETURNING id"
);
const grade2ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (2) RETURNING id"
);
const grade3ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (3) RETURNING id"
);
const grade4ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (4) RETURNING id"
);
const grade5ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (5) RETURNING id"
);
const grade6ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (6) RETURNING id"
);
const grade7ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (7) RETURNING id"
);
const grade8ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (8) RETURNING id"
);
const grade9ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (9) RETURNING id"
);
const grade10ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (10) RETURNING id"
);
const grade11ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (11) RETURNING id"
);
const grade12ID = await insertReturningID(
  "INSERT INTO Grades (grade) VALUES (12) RETURNING id"
);

// Dates	School Holidays
// Aug 15, 2023	First Day of School
// Nov 23 – 24, 2023	Thanksgiving Break
// Dec 25, 2023 – Jan 9, 2024	Christmas Break
// Mar 18 – 22, 2024	Spring Break
// May 23, 2024	Last Day of School
// May 24, 2024 – Aug 14, 2024	Summer Break

const holidays = [
  "2023-08-15",
  "2023-11-23",
  "2023-11-24",
  "2023-12-25",
  "2024-03-18",
  "2024-03-19",
  "2024-03-20",
  "2024-03-21",
  "2024-03-22",
  "2024-05-23",
  "2024-05-24"
  // and from october 1st to january 1st
];

console.log("Seeded database");
process.exit(0);
