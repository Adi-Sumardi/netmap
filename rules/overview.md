# Overview

## Apa itu NetMap

Dashboard lokal (mini PC di LAN) untuk mengatur IP semua jalur/VLAN supaya tidak bentrok, melihat route per jalur, mendeteksi konflik, dan memantau CCTV live. Sumber data utama: **MikroTik RouterOS v7 REST API**.

- Desain: https://claude.ai/artifact/St4Z7yFNYPsRhBpEVnqZgu
- Konsep & arsitektur: [`../docs/`](../docs/)

## Stack (wajib)

| Lapisan | Teknologi |
|---|---|
| Database | **PostgreSQL 16+** |
| Backend | **Laravel 13** (PHP 8.3+) — API saja, tanpa Blade untuk UI |
| Auth | **Login dengan Google** via Laravel **Socialite**, hanya email yang terdaftar (allowlist) + Laravel **Sanctum** (SPA cookie, satu origin) |
| Peran & izin | `spatie/laravel-permission` |
| Antrian & jadwal | Laravel Queue (driver **Redis**) + Scheduler (`everyThirtySeconds`) |
| Real-time | **Laravel Reverb** (WebSocket) + `laravel-echo` di frontend |
| Frontend | **Next.js 16** (App Router, `cacheComponents`, TypeScript strict) — baca `frontend/AGENTS.md` & `node_modules/next/dist/docs/` sebelum memakai API Next |
| UI kit | **shadcn/ui** style `base-nova` (berbasis **Base UI**, bukan Radix) + Tailwind CSS v4 + `lucide-react` (ikon) |
| Toast | **sonner** (via shadcn) — untuk toast alert & toast konfirmasi |
| Data fetching | TanStack Query |
| Form | react-hook-form + zod |
| Tabel | TanStack Table (pola shadcn Data Table) |
| Stream CCTV | go2rtc |
| Reverse proxy | Caddy (satu origin `https://netmap.<domain-kantor>`: `/` → Next.js, `/api`, `/auth`, `/sanctum`, `/webhook` → Laravel, `/app` → Reverb, `/stream` → go2rtc) |
| Deploy | Docker Compose di mini PC |

Jangan menambah framework/library besar di luar daftar ini tanpa dicatat di sini dulu.

## Struktur monorepo

```
netmap/
├── backend/            # Laravel (API, collector jobs, rule engine, notifier)
├── frontend/           # Next.js + shadcn/ui
├── infra/
│   ├── docker-compose.yml
│   ├── caddy/Caddyfile
│   └── go2rtc/go2rtc.yaml
├── docs/               # konsep, arsitektur, integrasi
└── rules/              # aturan ini
```

## Prinsip

1. **MikroTik adalah sumber kebenaran jaringan.** NetMap membaca, memperkaya (nama, lokasi, reservasi), dan baru menulis ke MikroTik lewat fitur tahap 4 yang dikunci flag.
2. **Read-only dulu.** Fitur yang mengubah MikroTik wajib konfirmasi + audit log.
3. **Lokal & tertutup.** Tidak ada layanan cloud wajib. Akses luar hanya via WireGuard.
4. **Kode bahasa Inggris, UI bahasa Indonesia.** Nama tabel, kelas, variabel dalam bahasa Inggris. Semua teks yang dilihat pengguna dalam bahasa Indonesia sederhana.
5. **Ikuti desain.** Layout, warna status, dan perilaku layar mengikuti canvas desain dan [design.md](design.md).

## Kosakata domain (UI ↔ kode)

| UI (Indonesia) | Kode (Inggris) |
|---|---|
| Jalur | `Segment` (`segments`) |
| Perangkat | `Device` (`devices`) |
| Reservasi | `IpReservation` (`ip_reservations`) |
| Konflik / log konflik | `ConflictEvent` (`conflict_events`) |
| Kamera | `Camera` (`cameras`) |
| Peta IP | `ip-map` |
| Route per jalur | `routes` / `topology` |
| Pengaturan | `settings` |

## Urutan prioritas aturan

1. [security.md](security.md)
2. [api.md](api.md) & [database.md](database.md) (kontrak data)
3. [system-features.md](system-features.md)
4. File lain

Kalau ada aturan yang tidak cocok dengan kebutuhan, ubah file aturannya di PR yang sama, jangan diam-diam menyimpang.
