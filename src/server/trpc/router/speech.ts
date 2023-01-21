import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  buffToBase64,
  cleanBase64String,
  base64ToBlob,
} from "../../../utils/encoding";
import { Configuration, OpenAIApi } from "openai";
import * as textToSpeech from "@google-cloud/text-to-speech";
import * as speechToText from "@google-cloud/speech";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_SK,
});
const openai = new OpenAIApi(configuration);
const googleKeys = JSON.parse(process.env.GOOGLE_JWT_CREDS || "");

export const SpeechToTextModelResp = z.object({
  text: z.string(),
  error: z.string().nullish(),
  estimated_time: z.number().nullish(),
});

export const SpeechToTextRequest = z.object({
  b64FileString: z.string(),
  returnType: z.enum(["speechToText", "speechToAudioResponse"]).nullish(),
});

export const SpeechToTextResponse = z.object({
  textModelResp: SpeechToTextModelResp,
  llmTextResp: z.string().nullish(),
  speechModelResp: z.string().nullish(),
  index: z.number().default(0),
  error: z.string().nullish(),
});

export type SpeechToTextRequest = z.infer<typeof SpeechToTextRequest>;
export type SpeechToTextResponse = z.infer<typeof SpeechToTextResponse>;
export type SpeechToTextModelResp = z.infer<typeof SpeechToTextModelResp>;

const ttsClient: textToSpeech.TextToSpeechClient =
  new textToSpeech.TextToSpeechClient({
    credentials: {
      client_email: googleKeys.client_email,
      private_key: googleKeys.private_key,
    },
  });

const asrClient: speechToText.SpeechClient = new speechToText.SpeechClient({
  credentials: {
    client_email: googleKeys.client_email,
    private_key: googleKeys.private_key,
  },
});

// TODO @allen-n: https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest
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

  const resp =
    response as textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;

  return response.audioContent as Buffer;
};

const generateText = async (audioBase64: string): Promise<string> => {
  // https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig
  const config = {
    encoding: "WEBM_OPUS",
    languageCode: "en-US",
    enableSpokenPunctuation: { value: true },
    enableAutomaticPunctuation: true,
    maxAlternatives: 1, // We'll always grab the first alternative anyways
  };
  audioBase64 = cleanBase64String(audioBase64);
  const request = {
    audio: { content: audioBase64 },
    config: config,
  };

  // The type here is a bit weird, but it's correct
  // @ts-ignore
  const [response] = await asrClient.recognize(request);
  const resp =
    response as speechToText.protos.google.cloud.speech.v1.RecognizeResponse;

  // TODO @allen-n log this billed time
  const billedTime = resp.totalBilledTime;
  // Now send the transcription
  const transcription = resp.results
    .map((result: any) => result.alternatives[0].transcript)
    .join("\n");
  return transcription;
};

const CompletionRequest = async (prompt: string) => {
  // TODO allen: will need to prompt engineer a bit to keep context of the conversation
  try {
    const completion = await openai.createCompletion({
      // model: "text-curie-001", // lower quality, faster, but 1/10 the price, text-davinci-003 is better
      model: "text-davinci-003", // higher quality, lower speed, but 10x the price, text-curie-001 is cheaper and faster
      prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, very friendly, and generally tries to answer questions succinctly.\n\nHuman: ${prompt}?\nAI: `,
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
    .mutation(async ({ input, ctx }) => {
      const result = await generateText(input?.req.b64FileString);

      const resp: SpeechToTextModelResp = {
        text: result,
        error: null,
        estimated_time: 0,
      };
      const prisma = ctx.prisma;

      const userId = ctx.session.user.id;
      return resp;
    }),

  completionSpeech: protectedProcedure
    .input(z.object({ resp: SpeechToTextResponse }))
    .mutation(async ({ input }) => {
      if (input) {
        const completion = await CompletionRequest(
          input?.resp.textModelResp.text
        );
        console.debug("completion status", completion?.status);
        console.debug("completion usage", completion?.data.usage);
        const choice =
          completion?.data.choices[0]?.text ||
          "I'm at a loss for words, sorry!";
        console.debug("completion choice", choice);
        const audioContent = await generateSpeech(choice, ttsClient);

        input.resp.speechModelResp = buffToBase64(audioContent);
        input.resp.llmTextResp = choice;
        return input.resp;
      }
      return null;
    }),
});
