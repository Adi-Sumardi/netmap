"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NetmapLogo } from "@/components/common/netmap-logo";
import { cn } from "@/lib/utils";
import type { Me } from "@/types/api";
import { NAV_ITEMS, isActive } from "./nav-items";

export function SidebarNav({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => me.permissions.includes(item.permission));

  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ me }: { me: Me }) {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 flex-col gap-5 border-r px-3.5 py-5 md:flex">
      <NetmapLogo className="px-2 pb-2" />
      <SidebarNav me={me} />
    </aside>
  );
}
