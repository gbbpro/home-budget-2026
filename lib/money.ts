import type { Frequency } from "./db";

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "semimonthly", label: "Twice a month" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Yearly" },
];

const PER_MONTH: Record<Frequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
};

export const toMonthly = (amount: number, f: Frequency) => amount * (PER_MONTH[f] ?? 1);

export const freqLabel = (f: Frequency) => FREQUENCIES.find((x) => x.value === f)?.label ?? f;

export const usd = (n: number, cents = false) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents ? 2 : 0, minimumFractionDigits: cents ? 2 : 0 });

export const fmtDate = (d: string | null) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const fmtMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Today's date as YYYY-MM-DD in the household's time zone (the server runs in UTC). */
export const HOME_TZ = process.env.TZ_NAME || "America/Denver";
export const todayLocal = () => new Date().toLocaleDateString("en-CA", { timeZone: HOME_TZ });
