import { deleteBill, saveBill } from "@/app/actions";
import { getBills, type Bill } from "@/lib/db";
import { FREQUENCIES, freqLabel, ordinal, toMonthly, usd } from "@/lib/money";
import { BILL_CATEGORIES } from "@/lib/constants";
import { Card, Disclosure, Empty, Field, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

function BillForm({ bill }: { bill?: Bill }) {
  return (
    <form action={saveBill} className="grid gap-3 sm:grid-cols-2">
      {bill && <input type="hidden" name="id" value={bill.id} />}
      <Field label="Bill"><input name="name" required defaultValue={bill?.name} placeholder="Electric, mortgage…" className="input" /></Field>
      <Field label="Category">
        <select name="category" defaultValue={bill?.category ?? "Other"} className="input">
          {BILL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Amount"><input name="amount" inputMode="decimal" required defaultValue={bill?.amount} placeholder="0.00" className="input" /></Field>
      <Field label="How often">
        <select name="frequency" defaultValue={bill?.frequency ?? "monthly"} className="input">
          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="Due day of month"><input name="due_day" type="number" min={1} max={31} defaultValue={bill?.due_day ?? ""} placeholder="e.g. 15" className="input" /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input type="checkbox" name="autopay" defaultChecked={bill?.autopay} className="h-4 w-4 accent-brand-600" /> Autopay
      </label>
      <Field label="Notes" className="sm:col-span-2"><input name="notes" defaultValue={bill?.notes ?? ""} className="input" /></Field>
      <div className="sm:col-span-2"><SubmitButton>{bill ? "Save changes" : "Add bill"}</SubmitButton></div>
    </form>
  );
}

export default async function BillsPage() {
  const bills = await getBills();
  const total = bills.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const groups = BILL_CATEGORIES.map((c) => ({ c, items: bills.filter((b) => b.category === c) }))
    .concat([{ c: "Other categories", items: bills.filter((b) => !BILL_CATEGORIES.includes(b.category)) }])
    .filter((g) => g.items.length);

  return (
    <>
      <PageHeader title="Monthly bills" subtitle={`${usd(total)} per month across ${bills.length} bill${bills.length === 1 ? "" : "s"}`} />

      <Card className="mb-4">
        <Disclosure open={bills.length === 0} summary={<span className="btn">+ Add bill</span>}>
          <BillForm />
        </Disclosure>
      </Card>

      {bills.length === 0 ? (
        <Empty>No bills added yet.</Empty>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const sub = g.items.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
            return (
              <Card key={g.c} className="p-0 sm:p-0">
                <div className="flex justify-between border-b border-stone-100 px-4 py-2 text-sm font-medium text-stone-500">
                  <span>{g.c}</span><span className="tabular-nums">{usd(sub)}/mo</span>
                </div>
                <ul className="divide-y divide-stone-100">
                  {g.items.map((b) => (
                    <li key={b.id} className="p-4">
                      <Disclosure
                        summary={
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {b.name}
                                {b.autopay && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700">Auto</span>}
                              </div>
                              <div className="text-xs text-stone-500">
                                {[b.due_day ? `Due the ${ordinal(b.due_day)}` : null, b.frequency !== "monthly" ? `${usd(b.amount, true)} ${freqLabel(b.frequency).toLowerCase()}` : null, b.notes]
                                  .filter(Boolean).join(" · ") || "Tap to edit"}
                              </div>
                            </div>
                            <div className="font-semibold tabular-nums">{usd(toMonthly(b.amount, b.frequency), true)}</div>
                          </div>
                        }
                      >
                        <BillForm bill={b} />
                        <form action={deleteBill} className="mt-2">
                          <input type="hidden" name="id" value={b.id} />
                          <ConfirmButton message={`Delete ${b.name}?`} />
                        </form>
                      </Disclosure>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
