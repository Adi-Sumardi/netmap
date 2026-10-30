import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = { title: "Ringkasan" };

export default function DashboardPage() {
  return (
    <ComingSoon
      title="Ringkasan Jaringan"
      description="Statistik IP, peringatan bentrok, jalur, dan uplink ISP."
      phase="Tahap 1 — Read-only (setelah koneksi MikroTik)"
    />
  );
}
