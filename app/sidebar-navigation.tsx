"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  CircleStackIcon,
  CommandLineIcon,
  HomeIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const navigationLinks = [
  { href: "/", label: "Overview", icon: HomeIcon },
  { href: "/dashboard", label: "Dashboard", icon: PresentationChartLineIcon },
  { href: "/insights", label: "Insights", icon: LightBulbIcon },
  { href: "/warehouse", label: "Warehouse", icon: CircleStackIcon },
  { href: "/technical", label: "Technical", icon: CommandLineIcon },
  { href: "/rounds", label: "Rounds", icon: CheckCircleIcon },
  { href: "/majors", label: "Majors", icon: AcademicCapIcon },
  { href: "/quality", label: "Quality", icon: ShieldCheckIcon },
];

export function SidebarNavigation({ activeHref }: { activeHref: string }) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string>();
  const navigationPendingHref = pendingHref === activeHref ? undefined : pendingHref;

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    if (window.location.pathname === href) return;

    setPendingHref(href);
    router.push(href);
  }

  return (
    <aside className="sidebar" aria-label="Dashboard sidebar" aria-busy={Boolean(navigationPendingHref)}>
      <Link className="brand" href="/" onClick={(event) => navigate(event, "/")}>
        <span className="brand-mark" aria-hidden="true" />
        <span><strong>TCAS DW</strong><small>Engineering Admissions</small></span>
      </Link>

      <nav className="side-nav" aria-label="Section navigation">
        {navigationLinks.map(({ href, label, icon: MenuIcon }) => {
          const isActive = navigationPendingHref ? navigationPendingHref === href : activeHref === href;
          return (
            <Link
              aria-current={activeHref === href ? "page" : undefined}
              className={`${isActive ? "active" : ""} ${navigationPendingHref === href ? "pending" : ""}`.trim()}
              href={href}
              key={href}
              onClick={(event) => navigate(event, href)}
            >
              <MenuIcon className="ui-icon" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
