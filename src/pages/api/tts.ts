import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { speechToTextQuery, type SpeechToTextModelResp } from "../../utils/tts";
import { base64ToBlob } from "../../utils/encoding";

import { Configuration, OpenAIApi, CreateCompletionResponse } from "openai";

const CompletionRequest = async (prompt: string) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_SK,
  });
  const openai = new OpenAIApi(configuration);

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
    res.send({
      error:
        "You must be signed in to view the protected content on this page.",
    });
  }
};

export default restricted;
