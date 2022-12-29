// TODO allen Maybe this should be in a types file somehwere?
export type SpeechToTextModelResp = {
  text: string;
  error?: string;
  estimated_time?: number;
};

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
 * Checks if huggingface endpoint is live
 * @param numTries
 * @param maxRetries
 * @param retryDelay
 * @returns
 */
export const activateSpeechToText = async (
  numTries: number = 0,
  maxRetries = 4,
  retryDelay = 10000
): Promise<SpeechToTextModelResp> => {
  if (numTries > maxRetries) {
    return { text: "error", error: "Max retries exceeded" };
  }
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

  if (result.error && result.estimated_time) {
    console.log("Model not loaded, setting timeout", result);
    setTimeout(async () => {
      result = await activateSpeechToText(numTries + 1);
    }, retryDelay);
  }
  return result as SpeechToTextModelResp;
};
