import { z } from "zod";
// TODO allen Maybe this should be in a types file somehwere?
export const SpeechToTextModelResp = z.object({
  text: z.string(),
  error: z.string().nullish(),
  estimated_time: z.number().nullish(),
});

export type SpeechToTextModelResp = z.infer<typeof SpeechToTextModelResp>;
// export type SpeechToTextModelResp = {
//   text: string;
//   error?: string;
//   estimated_time?: number;
// };

/**
 *
 * @param file a blob file encoding audio (ideally `audio/ogg; codecs=opus`)
 * @returns
 */
export const speechToTextQuery = async (
  file: Blob
): Promise<SpeechToTextModelResp> => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/openai/whisper-tiny.en",
    {
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_WRITE_KEY}` },
      method: "POST",
      body: file,
    }
  );
  const result = await response.json();
  return result as SpeechToTextModelResp;
};

/**
 * Src: https://stackoverflow.com/questions/1447407/whats-the-equivalent-of-javas-thread-sleep-in-javascript
 * @param msec time in ms
 * @returns
 */
const sleep = async (msec: number) => {
  return new Promise((resolve) => setTimeout(resolve, msec));
};

/**
 * Checks if huggingface endpoint is live
 * @param numTries
 * @param maxRetries
 * @param retryDelay
 * @returns
 */
export const activateSpeechToText = async (
  maxRetries = 3,
  retryDelay = 10000
): Promise<boolean> => {
  for (let retries = 0; retries < maxRetries; retries++) {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-tiny.en",
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_WRITE_KEY}`,
        },
        method: "POST",
      }
    );
    let result = (await response.json()) as SpeechToTextModelResp;
    if (result.error && result.error.includes("is currently loading")) {
      console.log(`Endpoint is not live, retries = ${retries}`, result);
      await sleep(retryDelay);
    } else {
      console.log("Speech to text endpoint is live");
      return true;
    }
  }

  return false;
};
