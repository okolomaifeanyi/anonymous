"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

import ThemeToggle from "@/components/theme-toggle";

const labelMap: Record<string, string> = {
  admin: "Admin",
  login: "Admin sign in",
  org: "Organization",
  participants: "Participants",
  levels: "Levels",
  votes: "Votes",
  room: "Room",
  space: "Space",
  messages: "Messages",
  new: "New",
};

function toLabel(segment: string) {
  if (labelMap[segment]) return labelMap[segment];
  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function isLinkableCrumb(segments: string[], index: number) {
  const href = `/${segments.slice(0, index + 1).join("/")}`;
  const first = segments[0];

  if (href === "/admin") return true;
  if (first === "auth") return href === "/auth/login";

  if (first === "admin") {
    if (segments[1] !== "org") return false;
    if (href === "/admin/org/new") return true;
    if (index >= 2 && segments[2] !== "new") return true;
    return false;
  }

  if (first === "room") return index >= 1;
  if (first === "org") return index >= 1;

  return index === 0;
}

export default function Breadcrumbs() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments
    .map((segment, index) => {
      if (segments[0] === "auth" && index === 0) return null;
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        href,
        label: toLabel(segment),
        linkable: isLinkableCrumb(segments, index),
      };
    })
    .filter((crumb): crumb is NonNullable<typeof crumb> => Boolean(crumb));

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition hover:text-foreground"
      >
        <HomeIcon className="h-3.5 w-3.5" />
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-2">
          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
          {crumb.linkable ? (
            <Link
              href={crumb.href}
              className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition hover:text-foreground"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground/60">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
      <span className="ml-auto">
        <ThemeToggle />
      </span>
    </nav>
  );
}
