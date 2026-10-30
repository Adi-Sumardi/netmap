"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-me";
import { initialOf } from "@/lib/format";
import type { Me } from "@/types/api";

export function UserMenu({ me }: { me: Me }) {
  const logout = useLogout();
  const display = me.name ?? me.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-muted flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-left"
        aria-label={`Menu akun ${display}`}
      >
        <Avatar className="size-8">
          {me.avatar_url ? (
            <AvatarImage src={me.avatar_url} alt="" referrerPolicy="no-referrer" />
          ) : null}
          <AvatarFallback>{initialOf(display)}</AvatarFallback>
        </Avatar>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-semibold">{display}</span>
          <span className="text-muted-foreground text-xs">{me.role_label}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block font-mono text-xs">{me.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
