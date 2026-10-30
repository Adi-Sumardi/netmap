"use client";

import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NetmapLogo } from "@/components/common/netmap-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { ApiError } from "@/lib/api";
import { AppSidebar, SidebarNav } from "./app-sidebar";
import { itemForPath } from "./nav-items";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const item = itemForPath(pathname);
  const allowed =
    me.data !== undefined && (item === undefined || me.data.permissions.includes(item.permission));

  // e.g. a CCTV viewer opening "/" lands on their own home screen instead.
  useEffect(() => {
    if (me.data !== undefined && !allowed) {
      router.replace(me.data.home_path);
    }
  }, [allowed, me.data, router]);

  if (me.isPending || (me.data !== undefined && !allowed)) {
    return <ShellSkeleton />;
  }

  if (me.isError) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      return <ShellSkeleton />;
    }

    return (
      <div className="m-auto flex max-w-sm flex-col items-center gap-3 p-6 text-center">
        <p className="font-semibold">Tidak bisa memuat NetMap</p>
        <p className="text-muted-foreground text-sm">{me.error.message}</p>
        <Button variant="outline" onClick={() => void me.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-1">
      <AppSidebar me={me.data} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-2 md:px-7">
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Buka menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
            <NetmapLogo />
          </div>
          <div className="ml-auto">
            <UserMenu me={me.data} />
          </div>
        </header>
        <main className="flex min-w-0 flex-1 flex-col gap-5 px-4 py-6 md:px-7">{children}</main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="bg-sidebar gap-5 p-4">
          <SheetTitle className="sr-only">Menu utama</SheetTitle>
          <NetmapLogo className="px-2" />
          <SidebarNav me={me.data} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh flex-1" aria-busy="true" aria-label="Memuat">
      <div className="bg-sidebar hidden w-60 flex-col gap-3 border-r p-5 md:flex">
        <Skeleton className="h-10 w-36" />
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-7">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
