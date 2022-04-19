import crypto, { BinaryLike } from "node:crypto";

export function sha1(input: BinaryLike): string {
  const hash = crypto.createHash("sha1");
  const data = hash.update(input);
  return data.digest("hex");
}
