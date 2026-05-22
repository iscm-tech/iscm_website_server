import crypto from "crypto";
import bcrypt from "bcrypt";
import envConfig from "config";

const saltRounds = 10;

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, saltRounds);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export function generateAPIKey(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function verifyAPIKey(apiKey: string): boolean {
  const key: string = envConfig.API_KEY;

  if (!crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(key)))
    return false;

  return true;
}

export function encodeStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Force 32-bit
  }
  return Math.abs(hash); // Optional: make it non-negative
}
