import type { Project } from "./db";

export type ProjectForecast = Project & {
  /** Money still needed for this project (estimate minus what's been spent on it). */
  remaining: number;
  /** Month when the fund should cover this project, given everything ahead of it in line. */
  affordableBy: Date | null;
  /** True if it's already covered by today's balance. */
  fundedNow: boolean;
  /** True if the affordable month is after the target start date. */
  behindSchedule: boolean;
};

/**
 * Lines up open projects (in progress → planned → ideas, then priority, then target date)
 * and works out when the fund will reach each one with the planned monthly contribution.
 */
export function forecastProjects(
  projects: Project[],
  spentByProject: Map<number, number>,
  balance: number,
  monthly: number,
  today = new Date(),
): ProjectForecast[] {
  const order: Record<string, number> = { in_progress: 0, planned: 1, idea: 2 };
  const open = projects
    .filter((p) => p.status !== "done")
    .sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        a.priority - b.priority ||
        (a.target_start ?? "9999").localeCompare(b.target_start ?? "9999"),
    );

  let cumulative = 0;
  return open.map((p) => {
    const spent = spentByProject.get(p.id) ?? 0;
    const remaining = Math.max(0, p.estimate - spent);
    cumulative += remaining;
    const shortfall = cumulative - balance;
    let affordableBy: Date | null;
    if (shortfall <= 0) affordableBy = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (monthly > 0) {
      const months = Math.ceil(shortfall / monthly);
      affordableBy = new Date(today.getFullYear(), today.getMonth() + months, 1);
    } else affordableBy = null;

    const behindSchedule =
      !!p.target_start &&
      (affordableBy === null || affordableBy > new Date(p.target_start + "T12:00:00"));

    return { ...p, remaining, affordableBy, fundedNow: shortfall <= 0, behindSchedule };
  });
}
