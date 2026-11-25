import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "./auth";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every server action so they can't be called without logging in. */
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}
