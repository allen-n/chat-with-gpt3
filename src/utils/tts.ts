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
