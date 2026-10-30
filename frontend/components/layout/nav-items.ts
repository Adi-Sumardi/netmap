import {
  Cctv,
  Grid3x3,
  LayoutDashboard,
  Network,
  Route,
  Settings,
  TriangleAlert,
} from "lucide-react";
import type { PermissionCode } from "@/types/api";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: PermissionCode;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Ringkasan", icon: LayoutDashboard, permission: "view-network" },
  { href: "/peta-ip", label: "Peta IP", icon: Grid3x3, permission: "view-network" },
  { href: "/route", label: "Route per Jalur", icon: Route, permission: "view-network" },
  { href: "/cctv", label: "Live CCTV", icon: Cctv, permission: "view-cctv" },
  { href: "/perangkat", label: "Perangkat", icon: Network, permission: "view-network" },
  { href: "/konflik", label: "Log Konflik", icon: TriangleAlert, permission: "view-network" },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, permission: "manage-users" },
];

export function isActive(item: NavItem, pathname: string): boolean {
  return item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function itemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActive(item, pathname));
}
