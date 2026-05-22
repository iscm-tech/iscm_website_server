export type TokenTypeValue = "AT" | "RT"; // AT = Access Token | RT = Refresh Token

export interface TokenPayload {
  userId: string;
  tokenType: TokenTypeValue;
  exp: number;
  iat: number;
}
