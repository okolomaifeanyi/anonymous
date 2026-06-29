import type { ReactNode } from "react";

import BackgroundOrbs from "@/components/background-orbs";
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
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <BackgroundOrbs variant="minimal" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-10">
        <Breadcrumbs />

        <section className="rounded-[2rem] border border-border bg-[var(--app-surface)]/40 p-6 md:p-8">
          <div className="space-y-6">
            <header className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Admin
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <h1 className="font-heading text-3xl md:text-4xl">{title}</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                    {description}
                  </p>
                </div>
                {code ? (
                  <div className="rounded-2xl border border-border bg-[var(--app-card)] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/60">
                      Organization code
                    </p>
                    <p className="mt-1 font-mono text-sm text-foreground/85">{code}</p>
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
