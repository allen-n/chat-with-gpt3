import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { speechToTextQuery } from "../../utils/tts";
// TODO allen Maybe this should be in a types file somehwere?
export type SpeechToTextRequest = {
  file: Blob;
  index: number;
};

export type SpeechToTextResponse = {
  text: string;
  index: number;
};

const restricted = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerAuthSession({ req, res });

  if (session) {
    const base64data = req.body.file;
    const buff = Buffer.from(
      base64data.replace("data:audio/ogg; codecs=opus;base64,", ""),
      "base64"
    );
    const blob = new Blob([buff], {
      type: "audio/ogg; codecs=opus",
    });
    const index = 0;

    const result = await speechToTextQuery(blob);
    console.log(result);

    if (typeof result.error === "undefined") {
      const speechToTextResponse: SpeechToTextResponse = {
        text: result.text,
        index: index,
      };
      res.send(speechToTextResponse);
    } else {
      res.send({
        error: `Error generating speech to text for file ${index} due to error: ${result.error} `,
      });
    }
  } else {
    res.send({
      error:
        "You must be signed in to view the protected content on this page.",
    });
  }
};

export default restricted;