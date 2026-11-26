import { deleteIncome, saveIncome } from "@/app/actions";
import { getIncomes, type Income } from "@/lib/db";
import { FREQUENCIES, freqLabel, toMonthly, usd } from "@/lib/money";
import { Card, Disclosure, Empty, Field, PageHeader } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

function IncomeForm({ income }: { income?: Income }) {
  return (
    <form action={saveIncome} className="grid gap-3 sm:grid-cols-2">
      {income && <input type="hidden" name="id" value={income.id} />}
      <Field label="Source"><input name="name" required defaultValue={income?.name} placeholder="Paycheck, side job…" className="input" /></Field>
      <Field label="Whose"><input name="owner" defaultValue={income?.owner ?? ""} placeholder="Optional" className="input" /></Field>
      <Field label="Amount (take-home)"><input name="amount" inputMode="decimal" required defaultValue={income?.amount} placeholder="0.00" className="input" /></Field>
      <Field label="How often">
        <select name="frequency" defaultValue={income?.frequency ?? "monthly"} className="input">
          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="Notes" className="sm:col-span-2"><input name="notes" defaultValue={income?.notes ?? ""} className="input" /></Field>
      <div className="sm:col-span-2"><SubmitButton>{income ? "Save changes" : "Add income"}</SubmitButton></div>
    </form>
  );
}

export default async function IncomePage() {
  const incomes = await getIncomes();
  const total = incomes.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);

  return (
    <>
      <PageHeader title="Income" subtitle={`${usd(total)} per month in total`} />

      <Card className="mb-4">
        <Disclosure open={incomes.length === 0} summary={<span className="btn">+ Add income</span>}>
          <IncomeForm />
        </Disclosure>
      </Card>

      {incomes.length === 0 ? (
        <Empty>No income added yet.</Empty>
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {incomes.map((i) => (
              <li key={i.id} className="p-4">
                <Disclosure
                  summary={
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{i.name}</div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {[i.owner, `${usd(i.amount, true)} ${freqLabel(i.frequency).toLowerCase()}`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">{usd(toMonthly(i.amount, i.frequency))}</div>
                        <div className="text-xs text-stone-400 dark:text-stone-500">/ month · tap to edit</div>
                      </div>
                    </div>
                  }
                >
                  <IncomeForm income={i} />
                  <form action={deleteIncome} className="mt-2">
                    <input type="hidden" name="id" value={i.id} />
                    <ConfirmButton message={`Delete ${i.name}?`} />
                  </form>
                </Disclosure>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
