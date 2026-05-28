import type { ReactNode } from "react";

import Breadcrumbs from "@/components/breadcrumbs";
import OrgAdminNav from "@/components/org-admin-nav";

type AdminShellProps = {
  title: string;
  description: string;
  code?: string;
  children: ReactNode;
};

export default function AdminShell({
  title,
  description,
  code,
  children,
}: AdminShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(15,23,42,0.35)] md:p-8">
          <div className="space-y-6">
            <header className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/70">
                Admin
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <h1 className="font-heading text-3xl md:text-4xl">{title}</h1>
                  <p className="max-w-2xl text-sm text-white/60 md:text-base">
                    {description}
                  </p>
                </div>
                {code ? (
                  <div className="rounded-2xl border border-white/10 bg-[#0f141d] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      Organization code
                    </p>
                    <p className="mt-1 font-mono text-sm text-white/85">{code}</p>
                  </div>
                ) : null}
              </div>
            </header>

            {code ? <OrgAdminNav code={code} /> : null}

            <div className="space-y-6">{children}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
