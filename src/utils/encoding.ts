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
