"use client";

import { CircleAlert, Loader2, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { NetmapLogo } from "@/components/common/netmap-logo";
import { cn } from "@/lib/utils";

const ERRORS: Record<
  string,
  { title: string; text: string; tone: "warn" | "info"; showEmail: boolean }
> = {
  not_registered: {
    title: "Akun belum terdaftar",
    text: "Akun Google ini belum terdaftar di NetMap. Hubungi admin untuk ditambahkan.",
    tone: "warn",
    showEmail: true,
  },
  disabled: {
    title: "Akun dinonaktifkan",
    text: "Akun ini sedang dinonaktifkan oleh admin. Hubungi admin jaringan.",
    tone: "warn",
    showEmail: true,
  },
  unverified: {
    title: "Email belum terverifikasi",
    text: "Email Google ini belum terverifikasi. Verifikasi dulu di akun Google, lalu coba lagi.",
    tone: "warn",
    showEmail: true,
  },
  oauth_failed: {
    title: "Login Google gagal",
    text: "Tidak bisa terhubung ke Google. Periksa koneksi internet lalu coba lagi.",
    tone: "info",
    showEmail: false,
  },
};

export function LoginCard() {
  const params = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const error = ERRORS[params.get("error") ?? ""];
  const email = params.get("email");

  return (
    <main className="bg-card flex w-full max-w-[420px] flex-col gap-6 rounded-2xl border px-8 py-9">
      <NetmapLogo size="lg" />

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-bold">Masuk ke dashboard</h1>
        <p className="text-subtle-foreground leading-relaxed">
          Gunakan akun Google yang sudah didaftarkan oleh admin jaringan.
        </p>
      </div>

      {error && !redirecting ? (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-lg border px-3.5 py-3",
            error.tone === "warn"
              ? "bg-warn-bg border-warn-border text-warn-fg"
              : "bg-info-bg border-info-border text-info-fg",
          )}
        >
          <CircleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{error.title}</span>
            <span className="text-[13px] leading-snug">{error.text}</span>
            {error.showEmail && email ? (
              <span className="font-mono text-xs opacity-85">{email}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* A full navigation, not fetch: Laravel redirects to Google. */}
      <a
        href="/auth/google/redirect"
        onClick={() => setRedirecting(true)}
        aria-busy={redirecting}
        className="focus-visible:ring-ring/50 flex min-h-12 items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white px-4 text-[15px] font-semibold text-[#1f1f1f] transition-colors hover:bg-[#f4f6f9] focus-visible:ring-3 focus-visible:outline-none"
      >
        {redirecting ? (
          <Loader2 className="size-5 animate-spin text-[#5f6368]" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {redirecting ? "Mengalihkan ke Google…" : "Masuk dengan Google"}
      </a>

      <div className="bg-panel text-subtle-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[13px] leading-snug">
        <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Hanya akun yang terdaftar yang bisa masuk. Belum punya akses? Minta admin menambahkan
          email Google kamu di{" "}
          <span className="text-foreground font-medium">Pengaturan → Pengguna &amp; akses</span>.
        </span>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
