import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = { title: "Live CCTV" };

export default function CctvPage() {
  return (
    <ComingSoon
      title="Live CCTV"
      description="Grid kamera live, perbesar kamera, status NVR, dan kamera bermasalah."
      phase="Tahap 3 — Live CCTV (go2rtc)"
    />
  );
}
