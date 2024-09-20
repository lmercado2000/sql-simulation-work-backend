import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { publicProcedure, router } from "./src/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import Express from "express";
import trpc from "@trpc/server";
import cors from "cors";

const App = Express();

const appRouter = router({
  userList: publicProcedure.query(async () => {
    console.log("CALLEd");
    // Retrieve users from a datasource, this is an imaginary database
    return [];
  })
});

export type AppRouter = typeof appRouter;
// created for each request
const createContext = ({
  req,
  res
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = trpc.inferAsyncReturnType<typeof createContext>;

const server = createHTTPServer({
  router: appRouter
});
App.use(
  cors({
    allowedHeaders: ["*"]
  })
);
App.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createContext
  })
);
App.listen(3000, () => {
  console.log("Listening on port 3000");
});
