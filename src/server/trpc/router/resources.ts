import { z } from "zod";

import { router, publicProcedure } from "../trpc";
import { activateSpeechToText } from "../../../utils/tts";

export const resourceLoader = router({
  loadSpeechToText: publicProcedure
    .input(z.object({ key: z.string().nullish() }).nullish())
    .query(async ({ input }) => {
      try {
        const resp = await activateSpeechToText();
        return {
          modelLoaded: resp,
        };
      } catch (error) {
        return {
          modelLoaded: false,
          error: error,
        };
      }
    }),
});
