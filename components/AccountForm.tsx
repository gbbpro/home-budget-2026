import { saveAccount } from "@/app/actions";
import type { Account } from "@/lib/accounts";
import { Field } from "./ui";
import SubmitButton from "./SubmitButton";

export default function AccountForm({
  account, kinds, cashLabel = "Balance", showApy = true,
}: {
  account?: Account; kinds: { value: string; label: string }[]; cashLabel?: string; showApy?: boolean;
}) {
  return (
    <form action={saveAccount} className="grid gap-3 sm:grid-cols-2">
      {account && <input type="hidden" name="id" value={account.id} />}
      <Field label="Account name"><input name="name" required defaultValue={account?.name} placeholder={showApy ? "Emergency fund" : "Roth IRA"} className="input" /></Field>
      <Field label="Bank / broker"><input name="institution" defaultValue={account?.institution ?? ""} placeholder={showApy ? "Ally" : "Fidelity"} className="input" /></Field>
      <Field label="Type">
        <select name="kind" defaultValue={account?.kind ?? kinds[0].value} className="input">
          {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </Field>
      <Field label="Whose"><input name="owner" defaultValue={account?.owner ?? ""} placeholder="Joint, Alex…" className="input" /></Field>
      <Field label={cashLabel}><input name="cash_balance" inputMode="decimal" defaultValue={account?.cash_balance ?? ""} placeholder="0.00" className="input" /></Field>
      {showApy ? (
        <Field label="Interest rate (APY %)"><input name="apy" inputMode="decimal" defaultValue={account?.apy ?? ""} placeholder="4.10" className="input" /></Field>
      ) : (
        <input type="hidden" name="apy" value="" />
      )}
      {showApy && <Field label="Savings goal (optional)"><input name="goal" inputMode="decimal" defaultValue={account?.goal ?? ""} placeholder="10000" className="input" /></Field>}
      <Field label="Notes" className={showApy ? "" : "sm:col-span-2"}><input name="notes" defaultValue={account?.notes ?? ""} className="input" /></Field>
      <div className="sm:col-span-2"><SubmitButton>{account ? "Save changes" : "Add account"}</SubmitButton></div>
    </form>
  );
}
