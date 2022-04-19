import crypto, { BinaryLike } from "node:crypto";

export function sha1Base64(input: BinaryLike) {
  const hash = crypto.createHash("sha1");
  const data = hash.update(input);
  return data.digest().toString("base64");
}
