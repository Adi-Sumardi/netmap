import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = { title: "Log Konflik" };

export default function ConflictsPage() {
  return (
    <ComingSoon
      title="Log Konflik"
      description="Riwayat bentrok IP, kronologi, dan saran perbaikan."
      phase="Tahap 2 — Deteksi konflik & notifikasi"
    />
  );
}
