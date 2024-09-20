import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { router } from "./src/trpc";

const appRouter = router({
  // ...
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
