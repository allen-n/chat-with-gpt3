import { router } from "../trpc";
import { authRouter } from "./auth";
import { speechRouter } from "./speech";
import { billingRouter } from "./billing";

export const appRouter = router({
  auth: authRouter,
  speech: speechRouter,
  billing: billingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
