import crypto, { BinaryLike } from "node:crypto";

export function sha1(input: BinaryLike): string {
  const hash = crypto.createHash("sha1");
  const data = hash.update(input);
  return data.digest("hex");
}

export function stripColor(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x03\d{0,2}(,\d{0,2})?/g, "");
}
