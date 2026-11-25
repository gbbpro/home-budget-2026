import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

/** Lazily created so `next build` works without DATABASE_URL. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql(strings, ...values) as Promise<Record<string, any>[]>;
}

export type Income = { id: number; name: string; owner: string | null; amount: number; frequency: Frequency; notes: string | null };
export type Bill = { id: number; name: string; category: string; amount: number; frequency: Frequency; due_day: number | null; autopay: boolean; notes: string | null };
export type Project = {
  id: number; name: string; room: string | null; description: string | null;
  estimate: number; actual_cost: number | null; priority: number; status: ProjectStatus;
  target_start: string | null; target_end: string | null;
};
export type FundTx = { id: number; tx_date: string; amount: number; note: string | null; project_id: number | null; project_name: string | null; created_by: string | null };

export type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly" | "quarterly" | "annual";
export type ProjectStatus = "idea" | "planned" | "in_progress" | "done";

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const date = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : null);

export async function getIncomes(): Promise<Income[]> {
  const rows = await sql`SELECT * FROM incomes ORDER BY amount DESC`;
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }) as Income);
}

export async function getBills(): Promise<Bill[]> {
  const rows = await sql`SELECT * FROM bills ORDER BY due_day NULLS LAST, name`;
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }) as Bill);
}

export async function getProjects(): Promise<Project[]> {
  const rows = await sql`
    SELECT * FROM projects
    ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'planned' THEN 1 WHEN 'idea' THEN 2 ELSE 3 END,
             priority, target_start NULLS LAST, name`;
  return rows.map((r) => ({
    ...r,
    estimate: Number(r.estimate),
    actual_cost: num(r.actual_cost),
    target_start: date(r.target_start),
    target_end: date(r.target_end),
  }) as Project);
}

export async function getFundTransactions(): Promise<FundTx[]> {
  const rows = await sql`
    SELECT t.*, p.name AS project_name FROM fund_transactions t
    LEFT JOIN projects p ON p.id = t.project_id
    ORDER BY t.tx_date DESC, t.id DESC`;
  return rows.map((r) => ({ ...r, amount: Number(r.amount), tx_date: date(r.tx_date)! }) as FundTx);
}

export async function getFundBalance(): Promise<number> {
  const [r] = await sql`SELECT COALESCE(SUM(amount), 0) AS bal FROM fund_transactions`;
  return Number(r.bal);
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const [r] = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return r ? (r.value as string) : fallback;
}
