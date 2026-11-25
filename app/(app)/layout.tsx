import Nav from "@/components/Nav";
import { logout } from "../actions";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-brand-700">⌂ Home Budget</span>
            <form action={logout} className="sm:hidden">
              <button className="btn-ghost text-xs">Sign out</button>
            </form>
          </div>
          <Nav />
          <form action={logout} className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-stone-500">Hi, {session.name}</span>
            <button className="btn-ghost text-xs">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
