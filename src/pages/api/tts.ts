import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { speechToTextQuery, type SpeechToTextModelResp } from "../../utils/tts";
import { base64ToBlob } from "../../utils/encoding";

import { Configuration, OpenAIApi } from "openai";

import * as textToSpeech from "@google-cloud/text-to-speech";
import { GoogleAuth, JWT } from "google-auth-library";

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

const doGoogleAuth = async (): Promise<JWT | null> => {
  const googleKeys = JSON.parse(process.env.GOOGLE_JWT_CREDS || "");

  // // load the JWT or UserRefreshClient from the keys
  // const client = new JWT({
  //   email: googleKeys.client_email,
  //   key: googleKeys.private_key,
  //   scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  // });
  // const url = `https://dns.googleapis.com/dns/v1/projects/${googleKeys.project_id}`;
  // const res = await client.request({ url });
  // console.log("Google Auth Result:", res.data);

  ttsClient = new textToSpeech.TextToSpeechClient({
    credentials: {
      client_email: googleKeys.client_email,
      private_key: googleKeys.private_key,
    },
  });
  return null;
  // if (res.data && res.data.hasOwnProperty("error")) {
  //   return null;
  // } else {
  //   return client;
  // }
};

// TODO allen figure out how to use this
// const client = await doGoogleAuth();
// if (client) {
//   ttsClient.auth = client;
// }

// TODO allen: https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest
const generateSpeech = async (
  text: string,
  ttsClient: textToSpeech.TextToSpeechClient | null
) => {
  // Construct the request
  if (!ttsClient) throw new Error("ttsClient not initialized!");

  const request = {
    input: { text: text },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: "en-US",
      ssmlGender: "NEUTRAL",
      name: "en-US-Standard-B", // Wavenet voices cost 4x as much
      speed: 1.25,
    },
    // select the type of audio encoding
    audioConfig: { audioEncoding: "OGG_OPUS" },
  };
  const [response] = await ttsClient.synthesizeSpeech(request);
  console.log(response);
};

const CompletionRequest = async (prompt: string) => {
  // TODO allen: will need to prompt engineer a bit to keep context of the conversation
  try {
    const completion = await openai.createCompletion({
      model: "text-curie-001", // "text-davinci-003", more performant but 10x the price
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
  modelResp: SpeechToTextModelResp;
  index: number;
};

const restricted = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerAuthSession({ req, res });

  if (session) {
    const { b64FileString, index } = req.body as SpeechToTextRequest;
    const blob = base64ToBlob(b64FileString);

    const result = await speechToTextQuery(blob);
    // console.log(result);

    const resp: SpeechToTextResponse = {
      modelResp: result,
      index: index,
    };
    if (typeof resp.modelResp.text !== "undefined") {
      const completion = await CompletionRequest(resp.modelResp.text);
      console.log("completion status", completion?.status);
      console.log("completion usage", completion?.data.usage);
      const choice = completion?.data.choices[0]?.text;

      console.log(
        "completion choice",
        choice || "I'm at a loss for words, sorry!"
      );
    }
    res.send(resp);
  } else {
    doGoogleAuth().then((res) => {
      generateSpeech(txt, ttsClient).catch((err) => {
        console.error("speech gen error", err);
      });
    });
    const txt = "A test of speech to text";
    generateSpeech(txt, ttsClient).catch((err) => {
      console.error("speech gen error", err);
      // doGoogleAuth()
      //   .catch((err) => {
      //     console.error("auth error", err);
      //   })
      //   .then((res) => {
      //     if (res) generateSpeech(txt);
      //   });
    });
    res.send({
      error:
        "You must be signed in to view the protected content on this page.",
    });
  }
};

export default restricted;
