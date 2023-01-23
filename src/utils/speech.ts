import { z } from "zod";
import { buffToBase64, cleanBase64String } from "./encoding";
import { Configuration, OpenAIApi, CreateCompletionResponse } from "openai";
import * as textToSpeech from "@google-cloud/text-to-speech";
import * as speechToText from "@google-cloud/speech";

// API Configs
const configuration = new Configuration({
  apiKey: process.env.OPENAI_SK,
});
const openai = new OpenAIApi(configuration);
const googleKeys = JSON.parse(process.env.GOOGLE_JWT_CREDS || "");

// Zod Schemas for internal API validation
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

export interface BillableAPI {
  apiPath: string;
  apiVersion: string;
}

// Utility functions return types (todo @allen-n: move to utils)
// TODO @allen-n create a data model for each type of billable api request: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model
export type GeneratedSpeech = {
  buffer: Buffer;
  billableSize: number;
  modelName: string;
} & BillableAPI;

export type GeneratedText = {
  text: string;
  billableTime: speechToText.protos.google.protobuf.IDuration;
} & BillableAPI;

export type GeneratedCompletion = {
  data: CreateCompletionResponse;
} & BillableAPI;

export const ttsClient: textToSpeech.TextToSpeechClient =
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

const getAsrVoices = async (languageCode: string = "en-US") => {
  const voiceListRequest: textToSpeech.protos.google.cloud.texttospeech.v1.IListVoicesRequest =
    { languageCode: languageCode };
  const voices = await ttsClient.listVoices(voiceListRequest);
  return voices[0].voices;
};

const getVoiceSampleRate = async (voiceName: string) => {
  const defaultRate = 24000;
  const voices = await getAsrVoices();
  if (!voices) {
    console.error(
      `No voices found! Returning default sample rate of ${defaultRate}`
    );
    return defaultRate;
  }
  const voice = voices.find((voice) => voice.name === voiceName);
  if (!voice) {
    console.error(
      `No voice found with name ${voiceName}! Returning default sample rate of ${defaultRate}`
    );
    return defaultRate;
  }
  return voice.naturalSampleRateHertz;
};

/**
 * Get the byte size of a string
 * @param str string to get byte size of
 * @returns
 */
const getByteSize = (str: string): number => new Blob([str]).size;

// TODO @allen-n: https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest
export const generateSpeech = async (
  text: string,
  ttsClient: textToSpeech.TextToSpeechClient
): Promise<GeneratedSpeech> => {
  const languageCode = "en-US";
  const voiceName = "en-US-Standard-I";
  const speakingRate = 1;

  const request: textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest =
    {
      input: { text: text },
      // Select the language and SSML voice gender (optional)
      voice: {
        languageCode: languageCode,
        ssmlGender: "NEUTRAL",
        name: voiceName, // Wavenet voices cost 4x as much
      },
      // select the type of audio encoding
      audioConfig: { audioEncoding: "OGG_OPUS", speakingRate: speakingRate },
    };

  // The type here is a bit weird, but it's correct
  //@ts-ignore
  const [response] = await ttsClient.synthesizeSpeech(request);
  const billableSize = getByteSize(text);

  const resp =
    response as textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;
  const buff = resp.audioContent as Buffer;

  return {
    buffer: buff,
    billableSize: billableSize,
    apiPath: textToSpeech.v1.TextToSpeechClient.servicePath,
    apiVersion: "v1",
    modelName: voiceName,
  };
};

export const generateText = async (
  audioBase64: string
): Promise<GeneratedText> => {
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

  const defaultDuration: speechToText.protos.google.protobuf.IDuration = {
    seconds: 0,
    nanos: 0,
  };

  // TODO @allen-n log this billed time
  const billedTime = resp.totalBilledTime || defaultDuration;
  if (!resp.totalBilledTime) {
    console.error("No billed time returned from Google ASR!");
  }
  // Now send the transcription
  const transcription = resp.results
    .map((result: any) => result.alternatives[0].transcript)
    .join("\n");
  return {
    text: transcription,
    billableTime: billedTime || undefined,
    apiPath: speechToText.v1.SpeechClient.servicePath,
    apiVersion: "v1",
  };
};

/**
 * Generate a completion from the prompt.
 * @param prompt The prompt as a text string.
 * @returns
 */
export const generateCompletion = async (prompt: string) => {
  // TODO @allen-n: will need to prompt engineer a bit to keep context of the conversation
  try {
    const completion = await openai.createCompletion({
      // Models Info, including token limits: https://beta.openai.com/docs/models/gpt-3
      model: "text-davinci-003", // 4000 token limit
      prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, very friendly, and generally tries to answer questions succinctly.\n\nHuman: ${prompt}?\nAI: `,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [" Human:", " AI:"],
    });
    const completionResp: GeneratedCompletion = {
      data: completion.data,
      apiPath: completion.config.url || "Missing API Path",
      apiVersion: "v1",
    };
    return completionResp;
  } catch (error) {
    console.error(error);
    return null;
  }
};
