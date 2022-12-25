import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const ttsRouter = router({
  speechToText: protectedProcedure
    .input(z.object({ audio: z.string().nullable() }).nullish())
    .query(({ input }) => {
      // console.log("input", input);
      if (input?.audio !== null && input?.audio !== undefined) {
        const buff = fetch(input?.audio).then(function (res) {
          return res.arrayBuffer();
        });
        const b = new Blob([input?.audio], { type: "audio/webm" });
        console.log("b", b);
        console.log("buff", buff);
      }

      return {
        lastBuffer: "SUCCESS",
      };
    }),
});
