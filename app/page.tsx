import Link from "next/link";
import Button from "@/components/ui/button";
import FloatingLines from "./FloatingLines";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0">
        <div className="h-[600px] w-full">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive
            parallax
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/55 to-slate-950" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between gap-12 px-6 py-12">
        <header className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Univlabs
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
              Medical Device Operations
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
              Univlabs · Asset & Service Management System
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold text-slate-100 md:text-6xl">
              Command center for every device and demo in the fleet.
            </h1>
            <p className="max-w-2xl text-base text-slate-300 md:text-lg">
              A single control plane for hospital fleets. Track deployments, demo
              rotations, and field service workflows with real-time visibility and
              role-secured access.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild className="px-6">
              <Link href="/login">Enter Secure Login</Link>
            </Button>
            <div className="text-xs text-slate-400">
              Admins and engineers are routed to their workspace automatically.
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Fleet Intelligence",
              description:
                "Unified inventory, demo, and deployment telemetry across hospitals.",
            },
            {
              title: "Service Orchestration",
              description:
                "Coordinate device coverage, maintenance readiness, and engineer workflows.",
            },
            {
              title: "Compliance Ready",
              description:
                "Audit trails for movement history, usage type, and ownership tracking.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.55)]"
            >
              <h3 className="text-lg font-semibold text-slate-100">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
