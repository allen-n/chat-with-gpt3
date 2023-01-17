/**
 * Convert a blob to a base64 string
 * @param blob
 * @returns
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise((resolve) => {
    reader.onloadend = () => {
      const res = reader.result ? reader.result?.toString() : "";
      resolve(res);
    };
  });
};

/**
 * Convert a buffer to a base64 string
 * @param buff
 * @returns
 */
export const buffToBase64 = (buff: Buffer): string => {
  return buff.toString("base64");
};

/**
 * Convert base64 encoded string to a blob
 * @param base64data
 * @param contentType
 * @returns
 */
export const base64ToBlob = (
  base64data: string,
  contentType: string = "audio/ogg; codecs=opus"
): Blob => {
  const buff = Buffer.from(
    base64data.replace(`data:${contentType};base64,`, ""),
    "base64"
  );
  const blob = new Blob([buff], {
    type: `${contentType}}`,
  });
  return blob;
};

/**
 * Mutate the base64 string to remove the data type
 * @param base64String
 * @param contentType
 */
export const cleanBase64String = (
  base64String: string,
  contentType: string = "audio/ogg; codecs=opus"
): string => {
  return base64String.replace(`data:${contentType};base64,`, "");
};

/**
 * Returns the RMS level of the audio buffer
 * @param e A blob event from a captured audio stream
 * @returns
 */
export const getAudioRMS = async (e: BlobEvent) => {
  // TODO @allen-n figure this out: https://stackoverflow.com/questions/50512436/how-to-convert-arraybuffer-to-audiobuffer
  // const audioContext = new AudioContext();
  // const fileReader = new FileReader();

  // fileReader.onloadend = () => {
  //   let myArrayBuffer = fileReader.result;
  //   if (myArrayBuffer && typeof myArrayBuffer !== "string") {
  //     audioContext.decodeAudioData(myArrayBuffer, (audioBuffer) => {
  //       // Do something with audioBuffer

  //       const mediaStreamAudioSourceNode = audioContext.createBufferSource();
  //       mediaStreamAudioSourceNode.buffer = audioBuffer;
  //       const analyserNode = audioContext.createAnalyser();
  //       mediaStreamAudioSourceNode.connect(analyserNode);
  //       const pcmData = new Float32Array(analyserNode.fftSize);
  //       analyserNode.getFloatTimeDomainData(pcmData);
  //       let sumSquares = 0.0;
  //       for (const amplitude of pcmData) {
  //         sumSquares += amplitude * amplitude;
  //       }
  //       const rms =  Math.sqrt(sumSquares / pcmData.length);
  //       console.log("rms=", rms)
  //     });
  //   }
  // };

  // //Load blob
  // fileReader.readAsArrayBuffer(e.data);

  const buffer = await e.data.arrayBuffer();
  const b = new Uint8Array(buffer);

  let sumSquares = 0.0;
  for (const amplitude of b) {
    sumSquares += amplitude * amplitude;
  }
  const rms = Math.sqrt(sumSquares / b.length);
  return rms;
};
