import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { signIn } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;
  const error = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : null;
  const success = resolvedSearchParams?.success
    ? decodeURIComponent(resolvedSearchParams.success)
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#060a17_45%,#040610_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
            MedDevice Suite
          </p>
          <h1 className="text-4xl font-semibold text-slate-100 md:text-5xl">
            Sign in to manage device fleets and service operations.
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Use your Supabase-authenticated account to access admin or engineer
            workspaces. New users must be created by an administrator.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8 shadow-[0_24px_60px_rgba(2,6,23,0.6)]">
            <form action={signIn} className="space-y-5">
              {success ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {success}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="name@hospital.com"
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
              <div className="flex items-center justify-between">
                <Link className="text-sm text-slate-400" href="/">
                  Back to landing
                </Link>
                <div className="flex items-center gap-3">
                  <Link className="text-sm text-slate-300 hover:text-slate-100" href="/signup">
                    Sign up
                  </Link>
                  <Button type="submit">Sign In</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
