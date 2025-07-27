import crypto from "crypto";

export const generateSasToken = (
  uri: string,
  key: string,
  expiry: number = 3600
): string => {
  const ttl = Math.floor(Date.now() / 1000) + expiry;
  const signKey = `${encodeURIComponent(uri.toLowerCase())}\n${ttl}`;

  const decodedKey = Buffer.from(key, "base64");
  const signature = crypto
    .createHmac("sha256", decodedKey)
    .update(signKey)
    .digest();

  const encodedSignature = encodeURIComponent(
    Buffer.from(signature).toString("base64")
  );

  const sasToken = `SharedAccessSignature sr=${encodeURIComponent(
    uri.toLowerCase()
  )}&sig=${encodedSignature}&se=${ttl}`;

  return sasToken;
};
