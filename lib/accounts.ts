import { sql } from "./db";

export const CASH_KINDS = [
  { value: "savings", label: "Savings" },
  { value: "checking", label: "Checking" },
  { value: "money_market", label: "Money market" },
  { value: "cd", label: "CD" },
  { value: "cash_other", label: "Other cash" },
];
export const INVEST_KINDS = [
  { value: "brokerage", label: "Brokerage" },
  { value: "retirement", label: "Retirement (401k/IRA)" },
  { value: "hsa", label: "HSA" },
  { value: "crypto", label: "Crypto" },
  { value: "invest_other", label: "Other" },
];
export const kindLabel = (k: string) => [...CASH_KINDS, ...INVEST_KINDS].find((x) => x.value === k)?.label ?? k;
export const isCashKind = (k: string) => CASH_KINDS.some((x) => x.value === k);

export type Account = {
  id: number; name: string; institution: string | null; owner: string | null; kind: string;
  cash_balance: number; apy: number | null; goal: number | null; notes: string | null; updated_at: string;
};
export type Holding = {
  id: number; account_id: number; symbol: string; name: string | null; shares: number;
  cost_basis: number | null; price: number | null; prev_close: number | null; price_updated_at: string | null;
};
export type HoldingView = Holding & { value: number; gain: number | null; dayChange: number | null; priced: boolean };
export type AccountView = Account & { holdings: HoldingView[]; total: number; invested: number | null; gain: number | null; dayChange: number };

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function viewHolding(h: Holding): HoldingView {
  const priced = h.price !== null && h.price > 0;
  // With no price yet, value the position at what was paid so totals stay sensible.
  const value = priced ? h.shares * h.price! : h.cost_basis ?? 0;
  const gain = priced && h.cost_basis !== null ? value - h.cost_basis : null;
  const dayChange = priced && h.prev_close ? h.shares * (h.price! - h.prev_close) : null;
  return { ...h, value, gain, dayChange, priced };
}

export async function getAccountViews(): Promise<AccountView[]> {
  const [accRows, holdRows] = await Promise.all([
    sql`SELECT * FROM accounts ORDER BY kind, name`,
    sql`SELECT * FROM holdings ORDER BY symbol`,
  ]);
  const holdings = holdRows.map((r) =>
    viewHolding({
      ...(r as Holding), shares: Number(r.shares), cost_basis: n(r.cost_basis), price: n(r.price), prev_close: n(r.prev_close),
      price_updated_at: r.price_updated_at ? new Date(r.price_updated_at).toISOString() : null,
    }),
  );
  return accRows.map((r) => {
    const a = { ...(r as Account), cash_balance: Number(r.cash_balance), apy: n(r.apy), goal: n(r.goal), updated_at: new Date(r.updated_at).toISOString() };
    const hs = holdings.filter((h) => h.account_id === a.id).sort((x, y) => y.value - x.value);
    const total = a.cash_balance + hs.reduce((s, h) => s + h.value, 0);
    const withBasis = hs.filter((h) => h.cost_basis !== null);
    const invested = withBasis.length ? withBasis.reduce((s, h) => s + h.cost_basis!, 0) : null;
    const gains = hs.filter((h) => h.gain !== null);
    const gain = gains.length ? gains.reduce((s, h) => s + h.gain!, 0) : null;
    const dayChange = hs.reduce((s, h) => s + (h.dayChange ?? 0), 0);
    return { ...a, holdings: hs, total, invested, gain, dayChange };
  });
}

export function splitTotals(accounts: AccountView[]) {
  const savings = accounts.filter((a) => isCashKind(a.kind)).reduce((s, a) => s + a.total, 0);
  const investments = accounts.filter((a) => !isCashKind(a.kind)).reduce((s, a) => s + a.total, 0);
  return { savings, investments, total: savings + investments };
}

/** Save today's totals so the overview can show a trend. Called after any balance or price change. */
export async function recordSnapshot() {
  const { savings, investments } = splitTotals(await getAccountViews());
  const today = new Date().toLocaleDateString("en-CA", { timeZone: process.env.TZ_NAME || "America/Denver" });
  await sql`INSERT INTO net_worth_snapshots (snap_date, savings, investments)
    VALUES (${today}, ${savings.toFixed(2)}, ${investments.toFixed(2)})
    ON CONFLICT (snap_date) DO UPDATE SET savings = EXCLUDED.savings, investments = EXCLUDED.investments`;
}

export async function getSnapshots(): Promise<{ date: string; savings: number; investments: number }[]> {
  const rows = await sql`SELECT * FROM net_worth_snapshots WHERE snap_date > CURRENT_DATE - INTERVAL '2 years' ORDER BY snap_date`;
  return rows.map((r) => ({ date: new Date(r.snap_date).toISOString().slice(0, 10), savings: Number(r.savings), investments: Number(r.investments) }));
}
