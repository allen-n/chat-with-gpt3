import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  SpeechToTextRequest,
  SpeechToTextResponse,
} from "../../../pages/api/tts";
import { base64ToBlob, buffToBase64 } from "../../../utils/encoding";
import { speechToTextQuery } from "../../../utils/tts";

import { Configuration, OpenAIApi } from "openai";
import * as textToSpeech from "@google-cloud/text-to-speech";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_SK,
});
const openai = new OpenAIApi(configuration);

const googleKeys = JSON.parse(process.env.GOOGLE_JWT_CREDS || "");

const ttsClient: textToSpeech.TextToSpeechClient =
  new textToSpeech.TextToSpeechClient({
    credentials: {
      client_email: googleKeys.client_email,
      private_key: googleKeys.private_key,
    },
  });

// TODO allen: https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest
const generateSpeech = async (
  text: string,
  ttsClient: textToSpeech.TextToSpeechClient
): Promise<Buffer> => {
  const request = {
    input: { text: text },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: "en-US",
      ssmlGender: "NEUTRAL",
      name: "en-US-Standard-I", // Wavenet voices cost 4x as much
      speed: 1.25,
    },
    // select the type of audio encoding
    audioConfig: { audioEncoding: "OGG_OPUS" },
  };

  // The type here is a bit weird, but it's correct
  //@ts-ignore
  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent as Buffer;
};

const CompletionRequest = async (prompt: string) => {
  // TODO allen: will need to prompt engineer a bit to keep context of the conversation
  try {
    const completion = await openai.createCompletion({
      model: "text-curie-001", // "text-davinci-003", higher quality, lower speed, but 10x the price, text-curie-001 is cheaper and faster
      prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: ${prompt}?\nAI: `,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [" Human:", " AI:"],
    });
    return completion;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const speechRouter = router({
  asr: protectedProcedure
    .input(z.object({ req: SpeechToTextRequest }))
    .query(async ({ input }) => {
      const blob = base64ToBlob(input?.req.b64FileString);
      const result = await speechToTextQuery(blob);
      return result;
    }),
  completionSpeech: protectedProcedure
    .input(z.object({ resp: SpeechToTextResponse }))
    .query(async ({ input }) => {
      if (input) {
        const completion = await CompletionRequest(
          input?.resp.textModelResp.text
        );
        console.log("completion status", completion?.status);
        console.log("completion usage", completion?.data.usage);
        const choice =
          completion?.data.choices[0]?.text ||
          "I'm at a loss for words, sorry!";
        console.log("completion choice", choice);
        const audioContent = await generateSpeech(choice, ttsClient);

        input.resp.speechModelResp = buffToBase64(audioContent);
        input.resp.llmTextResp = choice;
        return input.resp;
      }
      return null;
    }),
});
