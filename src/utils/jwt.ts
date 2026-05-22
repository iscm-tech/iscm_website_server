import { SignerOptions, createSigner, createVerifier } from "fast-jwt";
import ms from "ms";

import { TokenPayload } from "@/types/jwt.types";
import envConfig from "config";

export const signSessionToken = (
  payload: Pick<TokenPayload, "userId">,
  options?: SignerOptions,
) => {
  const signSync = createSigner({
    key: envConfig.SESSION_TOKEN_SECRET,
    algorithm: "HS256",
    expiresIn: ms(envConfig.SESSION_TOKEN_EXPIRES_IN),
    ...options,
  });
  return signSync(payload);
};

export const verifySessionToken = (token: string) => {
  const verifySync = createVerifier({
    key: envConfig.SESSION_TOKEN_SECRET,
  });
  return verifySync(token) as TokenPayload;
};
