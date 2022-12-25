import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { ttsRouter } from "./tts";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  tts: ttsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
