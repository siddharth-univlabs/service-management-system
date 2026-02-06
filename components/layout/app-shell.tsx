import Link from "next/link";
import type { ReactNode } from "react";
import Button from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

type AppShellProps = {
  roleLabel: string;
  navItems: NavItem[];
  userName?: string | null;
  children: ReactNode;
};

export default function AppShell({
  roleLabel,
  navItems,
  userName,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#060a17_45%,#040610_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="w-full max-w-none lg:w-72">
          <div className="sticky top-6 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_32px_70px_rgba(2,6,23,0.65)] backdrop-blur">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                MedDevice
              </span>
              <div>
                <h1 className="text-lg font-semibold text-slate-100 font-display">
                  Asset & Service
                </h1>
                <p className="text-sm text-slate-400">Management Suite</p>
              </div>
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-3">
                <p className="text-xs font-medium text-teal-200">Active Role</p>
                <p className="text-sm font-semibold text-teal-100">{roleLabel}</p>
              </div>
              {userName ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-100">{userName}</p>
                </div>
              ) : null}
            </div>
            <nav className="mt-6 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-100"
                >
                  <span className="block text-slate-100">{item.label}</span>
                  {item.description ? (
                    <span className="text-xs text-slate-400">
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
            <form action={signOut} className="mt-6">
              <Button type="submit" variant="secondary" className="w-full">
                Sign out
              </Button>
            </form>
          </div>
        </aside>
        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
