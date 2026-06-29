"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type OrgAdminNavProps = {
  code: string;
};

const navItems = [
  { label: "Overview", slug: "" },
  { label: "Participants", slug: "participants" },
  { label: "Levels", slug: "levels" },
  { label: "Votes", slug: "votes" },
  { label: "Messages", slug: "messages" },
];

function isActivePath(pathname: string, href: string, slug: string) {
  if (!slug) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function OrgAdminNav({ code }: OrgAdminNavProps) {
  const pathname = usePathname() ?? "";
  const basePath = `/admin/org/${code}`;

  return (
    <nav
      aria-label="Organization admin navigation"
      className="flex flex-wrap gap-2"
    >
      {navItems.map(({ label, slug }) => {
        const href = slug ? `${basePath}/${slug}` : basePath;
        const active = isActivePath(pathname, href, slug);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-border bg-foreground text-background shadow-sm"
                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
