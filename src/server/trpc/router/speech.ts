import { z } from "zod";
import { buffToBase64 } from "../../../utils/encoding";
import { router, protectedProcedure } from "../trpc";
import {
  SpeechToTextRequest,
  generateText,
  generateCompletion,
  SpeechToTextResponse,
  generateSpeech,
  ttsClient,
  type SpeechToTextModelResp,
} from "../../../utils/speech";
export const speechRouter = router({
  asr: protectedProcedure
    .input(z.object({ req: SpeechToTextRequest }))
    .mutation(async ({ input, ctx }) => {
      const result = await generateText(input?.req.b64FileString);
      console.log("Generated Text API Path", result.apiPath);
      const resp: SpeechToTextModelResp = {
        text: result.text,
        error: null,
        estimated_time: 0,
      };

      const prisma = ctx.prisma;
      const res = await prisma.googleASRRequest.create({
        data: {
          userId: ctx.session.user.id,
          apiPath: result.apiPath,
          apiVersion: result.apiVersion,
          billableTimeSeconds: Number(result.billableTime.seconds || 0),
          billableTimeNanos: Number(result.billableTime.nanos || 0),
        },
      });
      if (res.id) {
        console.debug(
          `Created Google ASR Request {id: ${res.id}} for user ${ctx.session.user.id}`
        );
      } else {
        console.error(
          `Failed to create Google ASR Request for user ${ctx.session.user.id}`
        );
      }
      return resp;
    }),

  completionSpeech: protectedProcedure
    .input(z.object({ resp: SpeechToTextResponse }))
    .mutation(async ({ input, ctx }) => {
      if (input) {
        const prisma = ctx.prisma;
        const completion = await generateCompletion(
          input?.resp.textModelResp.text
        );
        if (completion) {
          const res = await prisma.openaiCompletionRequest.create({
            data: {
              userId: ctx.session.user.id,
              apiPath: completion.apiPath,
              apiVersion: completion.apiVersion,
              model: completion.data.model,
              completionTokens: completion.data.usage?.completion_tokens || 0,
              promptTokens: completion.data.usage?.prompt_tokens || 0,
              totalTokens: completion.data.usage?.total_tokens || 0,
            },
          });
          if (res.id) {
            console.debug(
              `Created Openai Completion Request {id: ${res.id}} for user ${ctx.session.user.id}`
            );
          } else {
            console.error(
              `Failed to create Openai Completion Request for user ${ctx.session.user.id}`
            );
          }
        }

        const choice =
          completion?.data.choices[0]?.text ||
          "I'm at a loss for words, sorry!";
        console.debug("completion choice", choice);

        const audioContent = await generateSpeech(choice, ttsClient);

        const res = await prisma.googleTTSRequest.create({
          data: {
            userId: ctx.session.user.id,
            apiPath: audioContent.apiPath,
            apiVersion: audioContent.apiVersion,
            modelName: audioContent.modelName,
            billableSize: audioContent.billableSize,
          },
        });
        if (res.id) {
          console.debug(
            `Created Google TTS Request {id: ${res.id}} for user ${ctx.session.user.id}`
          );
        } else {
          console.error(
            `Failed to create Google TTS Request for user ${ctx.session.user.id}`
          );
        }

        input.resp.speechModelResp = buffToBase64(audioContent.buffer);
        input.resp.llmTextResp = choice;
        return input.resp;
      }
      return null;
    }),
});
