import { deleteAccount, updateBalance } from "@/app/actions";
import { CASH_KINDS, getAccountViews, isCashKind, kindLabel } from "@/lib/accounts";
import { usd } from "@/lib/money";
import { Bar, Card, Disclosure, Empty, PageHeader, Stat } from "@/components/ui";
import AccountForm from "@/components/AccountForm";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

export default async function SavingsPage() {
  const accounts = (await getAccountViews()).filter((a) => isCashKind(a.kind));
  const total = accounts.reduce((s, a) => s + a.total, 0);
  const monthlyInterest = accounts.reduce((s, a) => s + (a.apy ? (a.total * a.apy) / 100 / 12 : 0), 0);
  const blendedApy = total > 0 ? (monthlyInterest * 12 * 100) / total : 0;

  return (
    <>
      <PageHeader title="Savings" subtitle="Bank, savings and cash accounts" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Total saved" value={usd(total)} tone="good" />
        <Stat label="Interest / month" value={usd(monthlyInterest)} hint="estimated from APY" />
        <Stat label="Average APY" value={`${blendedApy.toFixed(2)}%`} hint="weighted by balance" />
      </div>

      <Card className="my-4">
        <Disclosure open={accounts.length === 0} summary={<span className="btn">+ Add account</span>}>
          <AccountForm kinds={CASH_KINDS} />
        </Disclosure>
      </Card>

      {accounts.length === 0 ? (
        <Empty>No savings accounts yet.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{a.name}</div>
                  <div className="text-xs text-stone-500">
                    {[kindLabel(a.kind), a.institution, a.owner, a.apy ? `${a.apy}% APY` : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="text-right text-xl font-semibold tabular-nums">{usd(a.total, true)}</div>
              </div>

              {a.goal ? (
                <div className="mt-3">
                  <Bar value={a.total} max={a.goal} />
                  <div className="mt-1 text-xs text-stone-500">
                    {a.total >= a.goal ? "✓ Goal reached" : `${usd(a.goal - a.total)} to go`} · goal {usd(a.goal)}
                  </div>
                </div>
              ) : null}

              <form action={updateBalance} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={a.id} />
                <input name="cash_balance" inputMode="decimal" placeholder="New balance" aria-label="New balance" className="input" />
                <SubmitButton>Update</SubmitButton>
              </form>
              <div className="mt-1 text-[11px] text-stone-400">Updated {new Date(a.updated_at).toLocaleDateString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric", year: "numeric" })}</div>

              <div className="mt-2 border-t border-stone-100 pt-2">
                <Disclosure summary={<span className="text-sm text-brand-600">Edit details</span>}>
                  <AccountForm account={a} kinds={CASH_KINDS} />
                  <form action={deleteAccount} className="mt-2">
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton message={`Delete ${a.name}?`} />
                  </form>
                </Disclosure>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
