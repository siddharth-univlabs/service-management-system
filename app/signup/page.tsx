import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { signUp } from "./actions";

type SignupPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#060a17_45%,#040610_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
            MedDevice Suite
          </p>
          <h1 className="text-4xl font-semibold text-slate-100 md:text-5xl">
            Request access
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Submit your details. An administrator will review and assign you a role.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8 shadow-[0_24px_60px_rgba(2,6,23,0.6)]">
            <form action={signUp} className="space-y-5">
              {error ? (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}
              <Input label="Full name" name="fullName" placeholder="Your name" required />
              <Input label="Phone" name="phone" placeholder="+91 90000 00000" />
              <Input label="Email" name="email" type="email" placeholder="name@hospital.com" required />
              <Input label="Password" name="password" type="password" placeholder="••••••••" required />
              <div className="flex items-center justify-between">
                <Link className="text-sm text-slate-400" href="/login">
                  Back to login
                </Link>
                <Button type="submit">Submit request</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
