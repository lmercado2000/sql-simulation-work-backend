import { publicProcedure, router } from "../src/trpc";
import { db } from "./db";

export const appRouter = router({
  allStudents: publicProcedure.query(async () => {
    return (await db.query("SELECT * FROM Students")).rows;
  })
});

export type AppRouter = typeof appRouter;
