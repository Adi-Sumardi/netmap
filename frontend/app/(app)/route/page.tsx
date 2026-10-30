import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = { title: "Route per Jalur" };

export default function RoutePage() {
  return (
    <ComingSoon
      title="Route per Jalur"
      description="Topologi per VLAN, trace jalur perangkat, dan tabel route MikroTik."
      phase="Tahap 1 — Read-only"
    />
  );
}
