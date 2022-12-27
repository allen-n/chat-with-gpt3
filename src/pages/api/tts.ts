import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { speechToTextQuery, type SpeechToTextModelResp } from "../../utils/tts";
import { base64ToBlob, buffToBase64 } from "../../utils/encoding";

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

// TODO allen Maybe this should be in a types file somehwere?
export type SpeechToTextRequest = {
  b64FileString: string; // base64 encoded string
  index: number;
};

export type SpeechToTextResponse = {
  textModelResp: SpeechToTextModelResp;
  llmTextResp?: string;
  speechModelResp?: string;
  index: number;
  error?: string;
};

const restricted = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerAuthSession({ req, res });

  if (session) {
    console.log("session", session);
    const { b64FileString, index } = req.body as SpeechToTextRequest;
    const blob = base64ToBlob(b64FileString);
    const result = await speechToTextQuery(blob);

    const resp: SpeechToTextResponse = {
      textModelResp: result,
      index: index,
    };
    if (typeof resp.textModelResp.text !== "undefined") {
      const completion = await CompletionRequest(resp.textModelResp.text);
      console.log("completion status", completion?.status);
      console.log("completion usage", completion?.data.usage);
      const choice =
        completion?.data.choices[0]?.text || "I'm at a loss for words, sorry!";

      console.log("completion choice", choice);
      const audioContent = await generateSpeech(choice, ttsClient);
      console.log("aduio content", audioContent);
      resp.speechModelResp = buffToBase64(audioContent);
      resp.llmTextResp = choice;
    }
    res.send(resp);
  } else {
    const txt = "A test of speech to text";
    generateSpeech(txt, ttsClient)
      .catch((err) => {
        console.error("Speech Generation Error:", err);
      })
      .then((audioContent) => {});
    res.send({
      error: "Sorry - you have to be signed in to use this functionality!",
    });
  }
};

export default restricted;
