import { nanoid } from "nanoid";

export const createId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return nanoid();
};
