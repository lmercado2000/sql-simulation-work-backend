import { publicProcedure, router } from "../src/trpc";
import { db } from "./db";
import { z } from "zod";

const studentSchema = z.object({
  id: z.number(),
  status_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  sex: z.boolean(),
  quote: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

export type Student = z.infer<typeof studentSchema>;

export const appRouter = router({
  allStudents: publicProcedure
    .output(z.array(studentSchema))
    .query(async () => {
      const students = (await db.query("SELECT * FROM Students"))
        .rows as Student[];
      return students;
    })
});

export type AppRouter = typeof appRouter;
