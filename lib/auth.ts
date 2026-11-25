import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hb_session";
export const SESSION_DAYS = 30;

export type Session = { uid: number; name: string; email: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (at least 16 characters)");
  return new TextEncoder().encode(s);
}

export async function signSession(s: Session) {
  return new SignJWT({ name: s.name, email: s.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(s.uid))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { uid: Number(payload.sub), name: String(payload.name), email: String(payload.email) };
  } catch {
    return null;
  }
}
