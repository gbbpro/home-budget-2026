import { deleteAccount, deleteHolding, refreshPrices, saveHolding } from "@/app/actions";
import { INVEST_KINDS, getAccountViews, isCashKind, kindLabel, type HoldingView } from "@/lib/accounts";
import { pricesEnabled } from "@/lib/prices";
import { usd } from "@/lib/money";
import { Bar, Card, Disclosure, Empty, Field, PageHeader, Stat } from "@/components/ui";
import AccountForm from "@/components/AccountForm";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

const signed = (n: number) => (n >= 0 ? "+" : "−") + usd(Math.abs(n));
const pct = (part: number, whole: number) => (whole ? `${part >= 0 ? "+" : "−"}${Math.abs((part / whole) * 100).toFixed(1)}%` : "");
const tone = (n: number | null) => (n === null ? "text-stone-500 dark:text-stone-400" : n >= 0 ? "text-brand-600 dark:text-brand-400" : "text-red-600 dark:text-red-400");

function HoldingForm({ accountId, h }: { accountId: number; h?: HoldingView }) {
  return (
    <form action={saveHolding} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <input type="hidden" name="account_id" value={accountId} />
      {h && <input type="hidden" name="id" value={h.id} />}
      <Field label="Ticker"><input name="symbol" required defaultValue={h?.symbol} placeholder="VTI" className="input uppercase" /></Field>
      <Field label="Shares"><input name="shares" inputMode="decimal" required defaultValue={h?.shares} placeholder="10" className="input" /></Field>
      <Field label="Total cost"><input name="cost_basis" inputMode="decimal" defaultValue={h?.cost_basis ?? ""} placeholder="What you paid" className="input" /></Field>
      <Field label="Price (if no live quote)"><input name="price" inputMode="decimal" defaultValue={h?.price ?? ""} placeholder="Optional" className="input" /></Field>
      <Field label="Name" className="col-span-2 sm:col-span-1"><input name="name" defaultValue={h?.name ?? ""} placeholder="Optional" className="input" /></Field>
      <div className="col-span-2 sm:col-span-5"><SubmitButton>{h ? "Save holding" : "Add holding"}</SubmitButton></div>
    </form>
  );
}

export default async function InvestmentsPage() {
  const accounts = (await getAccountViews()).filter((a) => !isCashKind(a.kind));
  const total = accounts.reduce((s, a) => s + a.total, 0);
  const allHoldings = accounts.flatMap((a) => a.holdings);
  const withGain = allHoldings.filter((h) => h.gain !== null);
  const gain = withGain.reduce((s, h) => s + h.gain!, 0);
  const basis = withGain.reduce((s, h) => s + h.cost_basis!, 0);
  const day = allHoldings.reduce((s, h) => s + (h.dayChange ?? 0), 0);
  const live = pricesEnabled();
  const lastPriced = allHoldings.map((h) => h.price_updated_at).filter(Boolean).sort().pop();

  // Combine the same ticker across accounts for the "top holdings" list.
  const bySymbol = new Map<string, number>();
  for (const h of allHoldings) bySymbol.set(h.symbol, (bySymbol.get(h.symbol) ?? 0) + h.value);
  const top = [...bySymbol.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <>
      <PageHeader title="Investments" subtitle="Brokerage, retirement and other portfolios">
        {live && allHoldings.length > 0 && (
          <form action={refreshPrices}><SubmitButton className="btn">↻ Refresh prices</SubmitButton></form>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Portfolio value" value={usd(total)} />
        <Stat label="Total gain" value={withGain.length ? signed(gain) : "—"} tone={gain >= 0 ? "good" : "bad"} hint={withGain.length ? `${pct(gain, basis)} on ${usd(basis)} invested` : "add cost to see gains"} />
        <Stat label="Today" value={live ? signed(day) : "—"} tone={day >= 0 ? "good" : "bad"} hint={live ? "vs. previous close" : "needs live prices"} />
        <Stat label="Accounts" value={String(accounts.length)} hint={`${allHoldings.length} holdings`} />
      </div>

      {!live && (
        <p className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          Prices are entered by hand. For live stock & ETF prices, add a free Finnhub key as <code>FINNHUB_API_KEY</code> in Vercel (see README).
        </p>
      )}
      {live && lastPriced && (
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Prices last updated {new Date(lastPriced).toLocaleString("en-US", { timeZone: "America/Denver", dateStyle: "medium", timeStyle: "short" })}</p>
      )}

      <Card className="my-4">
        <Disclosure open={accounts.length === 0} summary={<span className="btn">+ Add account</span>}>
          <AccountForm kinds={INVEST_KINDS} cashLabel="Uninvested cash" showApy={false} />
        </Disclosure>
      </Card>

      {accounts.length === 0 ? (
        <Empty>No investment accounts yet. Add one, then add the stocks or funds you hold in it.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {accounts.map((a) => (
              <Card key={a.id} className="p-0 sm:p-0">
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.name}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{[kindLabel(a.kind), a.institution, a.owner].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold tabular-nums">{usd(a.total)}</div>
                    {a.gain !== null && <div className={`text-xs tabular-nums ${tone(a.gain)}`}>{signed(a.gain)} {pct(a.gain, a.invested ?? 0)}</div>}
                  </div>
                </div>

                {a.holdings.length > 0 && (
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800 border-t border-stone-100 dark:border-stone-800">
                    {a.holdings.map((h) => (
                      <li key={h.id} className="px-4 py-3">
                        <Disclosure
                          summary={
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <div className="font-semibold">{h.symbol}{h.name && <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">{h.name}</span>}</div>
                                <div className="text-xs text-stone-500 dark:text-stone-400">
                                  {h.shares.toLocaleString("en-US", { maximumFractionDigits: 4 })} sh
                                  {h.priced ? ` @ ${usd(h.price!, true)}` : " · no price yet"}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium tabular-nums">{usd(h.value)}</div>
                                <div className={`text-xs tabular-nums ${tone(h.gain)}`}>
                                  {h.gain !== null ? `${signed(h.gain)} ${pct(h.gain, h.cost_basis ?? 0)}` : ""}
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <HoldingForm accountId={a.id} h={h} />
                          <form action={deleteHolding} className="mt-2">
                            <input type="hidden" name="id" value={h.id} />
                            <ConfirmButton message={`Remove ${h.symbol}?`}>Remove holding</ConfirmButton>
                          </form>
                        </Disclosure>
                      </li>
                    ))}
                  </ul>
                )}
                {a.cash_balance !== 0 && (
                  <div className="flex justify-between border-t border-stone-100 dark:border-stone-800 px-4 py-2 text-sm">
                    <span className="text-stone-500 dark:text-stone-400">Cash</span><span className="tabular-nums">{usd(a.cash_balance)}</span>
                  </div>
                )}

                <div className="space-y-3 border-t border-stone-100 dark:border-stone-800 p-4">
                  <Disclosure summary={<span className="text-sm font-medium text-brand-600 dark:text-brand-400">+ Add holding</span>}>
                    <HoldingForm accountId={a.id} />
                  </Disclosure>
                  <Disclosure summary={<span className="text-sm text-stone-500 dark:text-stone-400">Edit account</span>}>
                    <AccountForm account={a} kinds={INVEST_KINDS} cashLabel="Uninvested cash" showApy={false} />
                    <form action={deleteAccount} className="mt-2">
                      <input type="hidden" name="id" value={a.id} />
                      <ConfirmButton message={`Delete ${a.name} and all its holdings?`}>Delete account</ConfirmButton>
                    </form>
                  </Disclosure>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 font-semibold">By account</h2>
              <ul className="space-y-2 text-sm">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <div className="flex justify-between gap-2"><span className="truncate">{a.name}</span><span className="tabular-nums">{total ? Math.round((a.total / total) * 100) : 0}%</span></div>
                    <Bar value={a.total} max={total} />
                  </li>
                ))}
              </ul>
            </Card>
            {top.length > 0 && (
              <Card>
                <h2 className="mb-3 font-semibold">Top holdings</h2>
                <ul className="space-y-2 text-sm">
                  {top.map(([sym, val]) => (
                    <li key={sym}>
                      <div className="flex justify-between gap-2"><span className="font-medium">{sym}</span><span className="tabular-nums">{usd(val)} · {total ? Math.round((val / total) * 100) : 0}%</span></div>
                      <Bar value={val} max={total} className="bg-stone-400 dark:bg-stone-500" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
