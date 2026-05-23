"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

const labelMap: Record<string, string> = {
  admin: "Admin",
  org: "Organization",
  participants: "Participants",
  levels: "Levels",
  votes: "Votes",
  room: "Room",
  space: "Space",
  vote: "Vote",
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

export default function Breadcrumbs() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    return {
      href,
      label: toLabel(segment),
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-xs text-white/60"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70 transition hover:text-white"
      >
        <HomeIcon className="h-3.5 w-3.5" />
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="inline-flex items-center gap-2">
          <ChevronRightIcon className="h-3.5 w-3.5 text-white/40" />
          <Link
            href={crumb.href}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70 transition hover:text-white"
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
