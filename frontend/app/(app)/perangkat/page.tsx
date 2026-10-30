import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = { title: "Perangkat" };

export default function DevicesPage() {
  return (
    <ComingSoon
      title="Perangkat"
      description="Inventaris perangkat ber-IP static dan form tambah perangkat."
      phase="Tahap 1 — Read-only"
    />
  );
}
