import { type NextApiRequest, type NextApiResponse } from "next";

import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { speechToTextQuery, type SpeechToTextModelResp } from "../../utils/tts";
import { base64ToBlob } from "../../utils/encoding";
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
    console.log("speechToTextResponse", resp);
    res.send(resp);
  } else {
    res.send({
      error:
        "You must be signed in to view the protected content on this page.",
    });
  }
};

export default restricted;
