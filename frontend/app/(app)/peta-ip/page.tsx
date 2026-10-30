import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = { title: "Peta IP" };

export default function IpMapPage() {
  return (
    <ComingSoon
      title="Peta IP per Jalur"
      description="Grid 256 alamat per subnet, detail IP, dan cek IP sebelum dipasang."
      phase="Tahap 1 — Read-only"
    />
  );
}
