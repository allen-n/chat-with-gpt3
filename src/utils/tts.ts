type SpeechToTextQueryResp = {
  text: string;
};

export const speechToTextQuery = async (
  file: Blob
): Promise<SpeechToTextQueryResp> => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/openai/whisper-tiny.en",
    {
      //   headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_WRITE_KEY}` },
      method: "POST",
      body: file,
    }
  );
  const result = await response.json();
  return result as SpeechToTextQueryResp;
};
