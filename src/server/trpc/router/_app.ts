import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { speechRouter } from "./speech";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  speech: speechRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
