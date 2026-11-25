import { deleteProject, saveProject } from "@/app/actions";
import { getFundBalance, getFundTransactions, getProjects, getSetting, type Project } from "@/lib/db";
import { forecastProjects } from "@/lib/forecast";
import { fmtDate, fmtMonth, usd } from "@/lib/money";
import { PRIORITIES, STATUSES } from "@/lib/constants";
import { Bar, Card, Disclosure, Empty, Field, PageHeader, Stat } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import ConfirmButton from "@/components/ConfirmButton";

function ProjectForm({ project }: { project?: Project }) {
  return (
    <form action={saveProject} className="grid gap-3 sm:grid-cols-2">
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field label="Project"><input name="name" required defaultValue={project?.name} placeholder="Repaint the deck" className="input" /></Field>
      <Field label="Room / area"><input name="room" defaultValue={project?.room ?? ""} placeholder="Backyard" className="input" /></Field>
      <Field label="Estimate"><input name="estimate" inputMode="decimal" required defaultValue={project?.estimate} placeholder="0" className="input" /></Field>
      <Field label="Actual cost (when known)"><input name="actual_cost" inputMode="decimal" defaultValue={project?.actual_cost ?? ""} className="input" /></Field>
      <Field label="Status">
        <select name="status" defaultValue={project?.status ?? "idea"} className="input">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Priority">
        <select name="priority" defaultValue={project?.priority ?? 2} className="input">
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </Field>
      <Field label="Target start"><input name="target_start" type="date" defaultValue={project?.target_start ?? ""} className="input" /></Field>
      <Field label="Target finish"><input name="target_end" type="date" defaultValue={project?.target_end ?? ""} className="input" /></Field>
      <Field label="Details" className="sm:col-span-2">
        <textarea name="description" rows={3} defaultValue={project?.description ?? ""} placeholder="Quotes, contractor, materials…" className="input" />
      </Field>
      <div className="sm:col-span-2"><SubmitButton>{project ? "Save changes" : "Add project"}</SubmitButton></div>
    </form>
  );
}

const statusOf = (s: string) => STATUSES.find((x) => x.value === s) ?? STATUSES[0];

export default async function ProjectsPage() {
  const [projects, txs, balance, contribution] = await Promise.all([
    getProjects(), getFundTransactions(), getFundBalance(), getSetting("monthly_fund_contribution", "0"),
  ]);
  const monthly = Number(contribution) || 0;
  const spent = new Map<number, number>();
  for (const t of txs) if (t.project_id && t.amount < 0) spent.set(t.project_id, (spent.get(t.project_id) ?? 0) - t.amount);
  const forecast = new Map(forecastProjects(projects, spent, balance, monthly).map((f) => [f.id, f]));

  const open = projects.filter((p) => p.status !== "done");
  const done = projects.filter((p) => p.status === "done");
  const openEstimate = open.reduce((s, p) => s + p.estimate, 0);
  const doneActual = done.reduce((s, p) => s + (p.actual_cost ?? p.estimate), 0);

  const renderProject = (p: Project) => {
    const f = forecast.get(p.id);
    const st = statusOf(p.status);
    const spentOn = spent.get(p.id) ?? 0;
    return (
      <li key={p.id} className="p-4">
        <Disclosure
          summary={
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    {p.priority === 1 && p.status !== "done" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">High priority</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-stone-500">
                    {[p.room, (p.target_start || p.target_end) && `${fmtDate(p.target_start)} → ${fmtDate(p.target_end)}`].filter(Boolean).join(" · ") || "Tap to edit"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold tabular-nums">{usd(p.status === "done" && p.actual_cost != null ? p.actual_cost : p.estimate)}</div>
                  <div className="text-xs text-stone-400">{p.status === "done" && p.actual_cost != null ? `est. ${usd(p.estimate)}` : "estimate"}</div>
                </div>
              </div>
              {f && (
                <div className="mt-2">
                  {spentOn > 0 && (
                    <div className="mb-1">
                      <Bar value={spentOn} max={p.estimate} className={spentOn > p.estimate ? "bg-red-500" : "bg-amber-400"} />
                      <div className="mt-0.5 text-xs text-stone-500">{usd(spentOn)} spent of {usd(p.estimate)}</div>
                    </div>
                  )}
                  <div className={`text-xs ${f.fundedNow ? "text-brand-600" : f.behindSchedule ? "text-red-600" : "text-stone-500"}`}>
                    {f.fundedNow
                      ? "✓ Covered by the fund today"
                      : f.affordableBy
                        ? `Fund reaches it around ${fmtMonth(f.affordableBy)}${f.behindSchedule ? " — after the target start" : ""}`
                        : "Set a monthly contribution on the Fund page to see when it's affordable"}
                  </div>
                </div>
              )}
              {p.description && <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{p.description}</p>}
            </div>
          }
        >
          <ProjectForm project={p} />
          <form action={deleteProject} className="mt-2">
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton message={`Delete ${p.name}? Fund entries tied to it are kept.`} />
          </form>
        </Disclosure>
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Home projects" subtitle="Estimates, timeframes, and when the fund can cover each one" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open projects" value={String(open.length)} />
        <Stat label="Open estimates" value={usd(openEstimate)} />
        <Stat label="Fund balance" value={usd(balance)} tone={balance >= openEstimate ? "good" : "default"} />
        <Stat label="Completed" value={usd(doneActual)} hint={`${done.length} project${done.length === 1 ? "" : "s"}`} />
      </div>

      <Card className="my-4">
        <Disclosure open={projects.length === 0} summary={<span className="btn">+ Add project</span>}>
          <ProjectForm />
        </Disclosure>
      </Card>

      {projects.length === 0 ? (
        <Empty>No projects yet.</Empty>
      ) : (
        <>
          {open.length > 0 && (
            <Card className="p-0 sm:p-0">
              <p className="border-b border-stone-100 px-4 py-2 text-xs text-stone-500">
                In line by status, then priority, then target date. Forecast assumes {usd(monthly)}/month into the fund.
              </p>
              <ul className="divide-y divide-stone-100">
                {[...forecast.values()].map((f) => renderProject(f))}
              </ul>
            </Card>
          )}
          {done.length > 0 && (
            <>
              <h2 className="mb-2 mt-8 font-semibold">Done</h2>
              <Card className="p-0 sm:p-0"><ul className="divide-y divide-stone-100">{done.map(renderProject)}</ul></Card>
            </>
          )}
        </>
      )}
    </>
  );
}
