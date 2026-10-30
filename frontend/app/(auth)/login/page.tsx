import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginCard } from "@/components/auth/login-card";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Suspense
        fallback={<div className="bg-card h-[420px] w-full max-w-[420px] rounded-2xl border" />}
      >
        <LoginCard />
      </Suspense>
      <footer className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        <span>Akses dari luar kantor hanya lewat VPN</span>
      </footer>
    </div>
  );
}
