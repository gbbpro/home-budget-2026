/** Tiny server-rendered line chart for the net worth trend. */
export default function Trend({ points }: { points: { date: string; value: number }[] }) {
  if (points.length < 2) return null;
  const W = 600, H = 120, P = 4;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const t0 = new Date(points[0].date).getTime();
  const span = new Date(points[points.length - 1].date).getTime() - t0 || 1;
  const xy = points.map((p) => [
    P + ((new Date(p.date).getTime() - t0) / span) * (W - 2 * P),
    H - P - ((p.value - min) / range) * (H - 2 * P),
  ]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${H} L${xy[0][0].toFixed(1)},${H} Z`;
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" preserveAspectRatio="none" role="img" aria-label="Net worth over time">
        <path d={area} className="fill-brand-50" />
        <path d={line} className="fill-none stroke-brand-600" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-stone-400">
        <span>{fmt(points[0].date)}</span><span>{fmt(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
