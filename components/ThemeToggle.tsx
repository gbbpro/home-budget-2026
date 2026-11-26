"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Mode, string> = { system: "Auto", light: "Light", dark: "Dark" };
function Icon({ mode }: { mode: Mode }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (mode === "light")
    return (<svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
  if (mode === "dark") return (<svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>);
  return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /></svg>);
}

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Cycles Auto (follow the device) → Light → Dark. Remembered per browser. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    let saved: Mode = "system";
    try {
      const t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") saved = t;
    } catch {}
    setMode(saved);
  }, []);

  // While on Auto, follow the device if it switches (e.g. at sunset).
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const cycle = () => {
    const next = NEXT[mode];
    setMode(next);
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    apply(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className={`btn-ghost gap-1 text-xs ${className}`}
      aria-label={`Theme: ${LABEL[mode]}. Tap to change.`}
      title={`Theme: ${LABEL[mode]}`}
    >
      <Icon mode={mode} />
      {LABEL[mode]}
    </button>
  );
}
