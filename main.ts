import * as trpcExpress from "@trpc/server/adapters/express";
import Express from "express";
import trpc from "@trpc/server";
import cors from "cors";
import { appRouter } from "./src/router";
import morgan from "morgan";

const App = Express();

// created for each request
const createContext = ({
  req,
  res
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = trpc.inferAsyncReturnType<typeof createContext>;

App.use(morgan("dev"));

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
