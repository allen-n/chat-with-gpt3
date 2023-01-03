import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { resourceLoader } from "./resources";
import { speechRouter } from "./speech";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  resources: resourceLoader,
  speech: speechRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
