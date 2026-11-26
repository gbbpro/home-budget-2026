import Nav from "@/components/Nav";
import ThemeToggle from "@/components/ThemeToggle";
import { logout } from "../actions";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-brand-700 dark:text-brand-300">⌂ Home Budget</span>
            <div className="flex items-center gap-1 sm:hidden">
              <ThemeToggle />
              <form action={logout}>
                <button className="btn-ghost text-xs">Sign out</button>
              </form>
            </div>
          </div>
          <Nav />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-stone-500 dark:text-stone-400">Hi, {session.name}</span>
            <ThemeToggle />
            <form action={logout}>
              <button className="btn-ghost text-xs">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
