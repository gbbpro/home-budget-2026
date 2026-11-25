import Link from "next/link";
import { getBills, getFundBalance, getFundTransactions, getIncomes, getProjects, getSetting } from "@/lib/db";
import { forecastProjects } from "@/lib/forecast";
import { fmtMonth, ordinal, toMonthly, usd } from "@/lib/money";
import { Bar, Card, Empty, PageHeader, Stat } from "@/components/ui";

export default async function Overview() {
  const [incomes, bills, projects, txs, balance, contribution] = await Promise.all([
    getIncomes(), getBills(), getProjects(), getFundTransactions(), getFundBalance(),
    getSetting("monthly_fund_contribution", "0"),
  ]);
  const monthly = Number(contribution) || 0;
  const income = incomes.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
  const billsTotal = bills.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const left = income - billsTotal - monthly;

  const spent = new Map<number, number>();
  for (const t of txs) if (t.project_id && t.amount < 0) spent.set(t.project_id, (spent.get(t.project_id) ?? 0) - t.amount);
  const forecast = forecastProjects(projects, spent, balance, monthly);
  const openTotal = forecast.reduce((s, p) => s + p.remaining, 0);

  const today = new Date().getDate();
  const upcoming = bills
    .filter((b) => b.due_day && b.frequency === "monthly")
    .map((b) => ({ ...b, daysAway: (b.due_day! - today + 31) % 31 }))
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 5);

  const byCategory = Object.entries(
    bills.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + toMonthly(b.amount, b.frequency);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="This month" subtitle="Everything converted to a monthly amount" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" value={usd(income)} hint={`${incomes.length} source${incomes.length === 1 ? "" : "s"}`} />
        <Stat label="Bills" value={usd(billsTotal)} hint={income ? `${Math.round((billsTotal / income) * 100)}% of income` : undefined} />
        <Stat label="To home fund" value={usd(monthly)} hint="planned each month" />
        <Stat label="Left over" value={usd(left)} tone={left >= 0 ? "good" : "bad"} hint={left >= 0 ? "after bills & fund" : "over budget"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Home improvement fund</h2>
            <Link href="/fund" className="text-sm text-brand-600 hover:underline">Manage →</Link>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div><span className="text-3xl font-semibold tabular-nums">{usd(balance)}</span> <span className="text-sm text-stone-500">saved</span></div>
            <div className="text-sm text-stone-500">{usd(openTotal)} needed for open projects</div>
          </div>
          <div className="mt-3"><Bar value={balance} max={openTotal} /></div>

          <h3 className="mb-2 mt-5 text-sm font-medium text-stone-500">Project line-up</h3>
          {forecast.length === 0 ? (
            <Empty>No open projects yet. <Link href="/projects" className="text-brand-600 underline">Add one</Link>.</Empty>
          ) : (
            <ul className="divide-y divide-stone-100">
              {forecast.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-xs text-stone-500">{usd(p.remaining)} to go</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.fundedNow ? "bg-brand-100 text-brand-700" : p.behindSchedule ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {p.fundedNow ? "Funded" : p.affordableBy ? `~${fmtMonth(p.affordableBy)}` : "Set a monthly amount"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Coming up</h2>
            <Link href="/bills" className="text-sm text-brand-600 hover:underline">All bills →</Link>
          </div>
          {upcoming.length === 0 ? (
            <Empty>Add due days to your monthly bills to see them here.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {upcoming.map((b) => (
                <li key={b.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {b.name}
                    <span className="ml-1 text-xs text-stone-500">
                      {b.daysAway === 0 ? "today" : `the ${ordinal(b.due_day!)}`}{b.autopay ? " · auto" : ""}
                    </span>
                  </span>
                  <span className="tabular-nums">{usd(b.amount, true)}</span>
                </li>
              ))}
            </ul>
          )}

          {byCategory.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-sm font-medium text-stone-500">Bills by category</h3>
              <ul className="space-y-2 text-sm">
                {byCategory.map(([cat, amt]) => (
                  <li key={cat}>
                    <div className="flex justify-between"><span>{cat}</span><span className="tabular-nums">{usd(amt)}</span></div>
                    <Bar value={amt} max={billsTotal} className="bg-stone-400" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
