/** Claims we read from a Google id_token. Decoding is for UX only; the backend verifies the signature. */
export interface GoogleIdClaims {
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  hd?: string;
  exp: number;
}

export function decodeJwt(token: string): GoogleIdClaims | null {
  try {
    const part = token.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as GoogleIdClaims;
  } catch {
    return null;
  }
}

/** True when the claims belong to the allowed college domain. */
export function isAllowedDomain(claims: GoogleIdClaims, domain: string): boolean {
  if (!domain) return true;
  const email = claims.email.toLowerCase();
  return claims.hd?.toLowerCase() === domain || email.endsWith(`@${domain}`);
}
