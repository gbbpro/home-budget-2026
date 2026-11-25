import { addFundTransaction, deleteFundTransaction, saveMonthlyContribution } from "@/app/actions";
import { getFundBalance, getFundTransactions, getProjects, getSetting } from "@/lib/db";
import { fmtDate, usd } from "@/lib/money";
import { Card, Empty, Field, PageHeader, Stat } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

export default async function FundPage() {
  const [txs, balance, projects, contribution] = await Promise.all([
    getFundTransactions(), getFundBalance(), getProjects(), getSetting("monthly_fund_contribution", "0"),
  ]);
  const monthly = Number(contribution) || 0;
  const year = new Date().getFullYear().toString();
  const ytdIn = txs.filter((t) => t.amount > 0 && t.tx_date.startsWith(year)).reduce((s, t) => s + t.amount, 0);
  const ytdOut = txs.filter((t) => t.amount < 0 && t.tx_date.startsWith(year)).reduce((s, t) => s - t.amount, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Home improvement fund" subtitle="Money set aside for projects around the house" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Balance" value={usd(balance, true)} tone={balance >= 0 ? "good" : "bad"} />
        <Stat label="Planned monthly" value={usd(monthly)} />
        <Stat label={`Added in ${year}`} value={usd(ytdIn)} />
        <Stat label={`Spent in ${year}`} value={usd(ytdOut)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-semibold">Record money in or out</h2>
          <form action={addFundTransaction} className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2 sm:col-span-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="kind" value="deposit" defaultChecked className="accent-brand-600" /> Deposit
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm has-[:checked]:border-red-400 has-[:checked]:bg-red-50">
                <input type="radio" name="kind" value="withdraw" className="accent-red-600" /> Spend
              </label>
            </div>
            <Field label="Amount"><input name="amount" inputMode="decimal" required placeholder="0.00" className="input" /></Field>
            <Field label="Date"><input name="tx_date" type="date" defaultValue={today} className="input" /></Field>
            <Field label="For project (optional)">
              <select name="project_id" className="input" defaultValue="">
                <option value="">—</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Note"><input name="note" placeholder="Paycheck transfer, Home Depot…" className="input" /></Field>
            <div className="sm:col-span-2"><SubmitButton>Save</SubmitButton></div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">Monthly contribution</h2>
          <p className="mb-3 text-sm text-stone-500">How much you plan to set aside each month. It's subtracted on the overview and used to forecast when projects are affordable.</p>
          <form action={saveMonthlyContribution} className="flex gap-2">
            <input name="amount" inputMode="decimal" defaultValue={monthly || ""} placeholder="0" className="input" />
            <SubmitButton>Set</SubmitButton>
          </form>
        </Card>
      </div>

      <h2 className="mb-2 mt-8 font-semibold">History</h2>
      {txs.length === 0 ? (
        <Empty>No deposits or spending recorded yet.</Empty>
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-stone-100">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.note || (t.amount > 0 ? "Deposit" : "Spent")}</div>
                  <div className="text-xs text-stone-500">
                    {[fmtDate(t.tx_date), t.project_name, t.created_by && `by ${t.created_by}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`font-semibold tabular-nums ${t.amount > 0 ? "text-brand-600" : "text-red-600"}`}>
                    {t.amount > 0 ? "+" : "−"}{usd(Math.abs(t.amount), true)}
                  </span>
                  <form action={deleteFundTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton message="Delete this entry?">✕</ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
