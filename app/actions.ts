"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession } from "@/lib/auth";
import { requireSession } from "@/lib/session";
import { recordSnapshot } from "@/lib/accounts";
import { fetchQuote } from "@/lib/prices";

// ---------- form helpers ----------
const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const money = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === null) return null;
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};
const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  const n = v === null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const id = (fd: FormData) => {
  const n = int(fd, "id");
  if (!n) throw new Error("Missing id");
  return n;
};
const refresh = (...paths: string[]) => {
  revalidatePath("/");
  paths.forEach((p) => revalidatePath(p));
};

// ---------- auth ----------
const DUMMY_HASH = "$2b$12$7bDkuFDj3YvLp4490I8BBeowbW.nRvtAmEIlpKd71tni/YiGYO0qy";
export type LoginState = { error?: string; email?: string };

export async function login(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = (str(fd, "email") ?? "").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const [user] = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email}`;
  // Always run a compare so response time doesn't reveal whether the email exists.
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "That email and password don't match.", email };

  const token = await signSession({ uid: user.id, name: user.name, email: user.email });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- income ----------
export async function saveIncome(fd: FormData) {
  await requireSession();
  const name = str(fd, "name") ?? "Income";
  const owner = str(fd, "owner");
  const amount = money(fd, "amount") ?? 0;
  const frequency = str(fd, "frequency") ?? "monthly";
  const notes = str(fd, "notes");
  const rowId = int(fd, "id");
  if (rowId) {
    await sql`UPDATE incomes SET name=${name}, owner=${owner}, amount=${amount}, frequency=${frequency}, notes=${notes} WHERE id=${rowId}`;
  } else {
    await sql`INSERT INTO incomes (name, owner, amount, frequency, notes) VALUES (${name}, ${owner}, ${amount}, ${frequency}, ${notes})`;
  }
  refresh("/income");
}

export async function deleteIncome(fd: FormData) {
  await requireSession();
  await sql`DELETE FROM incomes WHERE id = ${id(fd)}`;
  refresh("/income");
}

// ---------- bills ----------
export async function saveBill(fd: FormData) {
  await requireSession();
  const name = str(fd, "name") ?? "Bill";
  const category = str(fd, "category") ?? "Other";
  const amount = money(fd, "amount") ?? 0;
  const frequency = str(fd, "frequency") ?? "monthly";
  let dueDay = int(fd, "due_day");
  if (dueDay !== null && (dueDay < 1 || dueDay > 31)) dueDay = null;
  const autopay = fd.get("autopay") === "on";
  const notes = str(fd, "notes");
  const rowId = int(fd, "id");
  if (rowId) {
    await sql`UPDATE bills SET name=${name}, category=${category}, amount=${amount}, frequency=${frequency},
      due_day=${dueDay}, autopay=${autopay}, notes=${notes} WHERE id=${rowId}`;
  } else {
    await sql`INSERT INTO bills (name, category, amount, frequency, due_day, autopay, notes)
      VALUES (${name}, ${category}, ${amount}, ${frequency}, ${dueDay}, ${autopay}, ${notes})`;
  }
  refresh("/bills");
}

export async function deleteBill(fd: FormData) {
  await requireSession();
  await sql`DELETE FROM bills WHERE id = ${id(fd)}`;
  refresh("/bills");
}

// ---------- home improvement fund ----------
export async function addFundTransaction(fd: FormData) {
  const session = await requireSession();
  const kind = str(fd, "kind") === "withdraw" ? -1 : 1;
  const amount = Math.abs(money(fd, "amount") ?? 0) * kind;
  if (amount === 0) return;
  const txDate = str(fd, "tx_date") ?? new Date().toISOString().slice(0, 10);
  const note = str(fd, "note");
  const projectId = int(fd, "project_id");
  await sql`INSERT INTO fund_transactions (tx_date, amount, note, project_id, created_by)
    VALUES (${txDate}, ${amount}, ${note}, ${projectId}, ${session.name})`;
  refresh("/fund", "/projects");
}

export async function deleteFundTransaction(fd: FormData) {
  await requireSession();
  await sql`DELETE FROM fund_transactions WHERE id = ${id(fd)}`;
  refresh("/fund", "/projects");
}

export async function saveMonthlyContribution(fd: FormData) {
  await requireSession();
  const amount = Math.max(0, money(fd, "amount") ?? 0);
  await sql`INSERT INTO settings (key, value) VALUES ('monthly_fund_contribution', ${String(amount)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  refresh("/fund", "/projects");
}

// ---------- projects ----------
export async function saveProject(fd: FormData) {
  await requireSession();
  const name = str(fd, "name") ?? "Project";
  const room = str(fd, "room");
  const description = str(fd, "description");
  const estimate = money(fd, "estimate") ?? 0;
  const actual = money(fd, "actual_cost");
  const priority = Math.min(3, Math.max(1, int(fd, "priority") ?? 2));
  const status = str(fd, "status") ?? "idea";
  const start = str(fd, "target_start");
  const end = str(fd, "target_end");
  const rowId = int(fd, "id");
  if (rowId) {
    await sql`UPDATE projects SET name=${name}, room=${room}, description=${description}, estimate=${estimate},
      actual_cost=${actual}, priority=${priority}, status=${status}, target_start=${start}, target_end=${end}
      WHERE id=${rowId}`;
  } else {
    await sql`INSERT INTO projects (name, room, description, estimate, actual_cost, priority, status, target_start, target_end)
      VALUES (${name}, ${room}, ${description}, ${estimate}, ${actual}, ${priority}, ${status}, ${start}, ${end})`;
  }
  refresh("/projects", "/fund");
}

export async function deleteProject(fd: FormData) {
  await requireSession();
  await sql`DELETE FROM projects WHERE id = ${id(fd)}`;
  refresh("/projects", "/fund");
}

// ---------- savings & investment accounts ----------
const accountPaths = () => refresh("/savings", "/investments");

export async function saveAccount(fd: FormData) {
  await requireSession();
  const name = str(fd, "name") ?? "Account";
  const institution = str(fd, "institution");
  const owner = str(fd, "owner");
  const kind = str(fd, "kind") ?? "savings";
  const cash = money(fd, "cash_balance") ?? 0;
  const apy = money(fd, "apy");
  const goal = money(fd, "goal");
  const notes = str(fd, "notes");
  const rowId = int(fd, "id");
  if (rowId) {
    await sql`UPDATE accounts SET name=${name}, institution=${institution}, owner=${owner}, kind=${kind},
      cash_balance=${cash}, apy=${apy}, goal=${goal}, notes=${notes}, updated_at=now() WHERE id=${rowId}`;
  } else {
    await sql`INSERT INTO accounts (name, institution, owner, kind, cash_balance, apy, goal, notes)
      VALUES (${name}, ${institution}, ${owner}, ${kind}, ${cash}, ${apy}, ${goal}, ${notes})`;
  }
  await recordSnapshot();
  accountPaths();
}

/** Quick balance update for a savings account without opening the full form. */
export async function updateBalance(fd: FormData) {
  await requireSession();
  const cash = money(fd, "cash_balance");
  if (cash === null) return;
  await sql`UPDATE accounts SET cash_balance=${cash}, updated_at=now() WHERE id=${id(fd)}`;
  await recordSnapshot();
  accountPaths();
}

export async function deleteAccount(fd: FormData) {
  await requireSession();
  await sql`DELETE FROM accounts WHERE id = ${id(fd)}`;
  await recordSnapshot();
  accountPaths();
}

export async function saveHolding(fd: FormData) {
  await requireSession();
  const accountId = int(fd, "account_id");
  if (!accountId) throw new Error("Missing account");
  const symbol = (str(fd, "symbol") ?? "").toUpperCase();
  if (!symbol) return;
  const name = str(fd, "name");
  const shares = Number(String(fd.get("shares") ?? "0").replace(/[,\s]/g, "")) || 0;
  const cost = money(fd, "cost_basis");
  const manualPrice = money(fd, "price");
  const rowId = int(fd, "id");

  // Try a live quote; fall back to the hand-entered price.
  const quote = await fetchQuote(symbol);
  const price = quote?.price ?? manualPrice;
  const prev = quote?.prevClose ?? null;

  if (rowId) {
    await sql`UPDATE holdings SET symbol=${symbol}, name=${name}, shares=${shares}, cost_basis=${cost},
      price=${price}, prev_close=${prev}, price_updated_at=${price !== null ? new Date().toISOString() : null}
      WHERE id=${rowId}`;
  } else {
    await sql`INSERT INTO holdings (account_id, symbol, name, shares, cost_basis, price, prev_close, price_updated_at)
      VALUES (${accountId}, ${symbol}, ${name}, ${shares}, ${cost}, ${price}, ${prev},
              ${price !== null ? new Date().toISOString() : null})`;
  }
  await sql`UPDATE accounts SET updated_at=now() WHERE id=${accountId}`;
  await recordSnapshot();
  accountPaths();
}

export async function deleteHolding(fd: FormData) {
  await requireSession();
  await sql`DELETE FROM holdings WHERE id = ${id(fd)}`;
  await recordSnapshot();
  accountPaths();
}

export async function refreshPrices() {
  await requireSession();
  const rows = await sql`SELECT DISTINCT symbol FROM holdings`;
  const quotes = await Promise.all(rows.map(async (r) => [r.symbol as string, await fetchQuote(r.symbol)] as const));
  for (const [symbol, q] of quotes) {
    if (!q) continue;
    await sql`UPDATE holdings SET price=${q.price}, prev_close=${q.prevClose}, price_updated_at=now() WHERE symbol=${symbol}`;
  }
  await recordSnapshot();
  accountPaths();
}
