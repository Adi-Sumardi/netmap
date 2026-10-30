# NetMap — Dashboard IP & CCTV di atas MikroTik

Dashboard berbasis web yang berjalan di **mini PC** lokal untuk:

1. **Mengatur alamat IP** di semua jalur (VLAN) supaya **tidak ada bentrok IP**.
2. **Melihat route per jalur**: dari internet → ISP → MikroTik → switch → perangkat.
3. **Memantau CCTV secara live** langsung dari dashboard.
4. **Mencatat & memberi peringatan** saat ada konflik IP, kamera offline, atau ISP pindah ke cadangan.

Sumber data utama: **MikroTik RouterOS v7** (REST API).

---

## Link desain

- **Canvas desain (8 layar, interaktif):** https://claude.ai/artifact/St4Z7yFNYPsRhBpEVnqZgu
  - Status share: *siapa saja yang punya link* bisa melihat. Datanya contoh, bukan data asli.

| # | Layar | Isi singkat |
|---|---|---|
| 0 | Login | Masuk dengan Google, hanya akun terdaftar; pesan error per kasus |
| 1 | Ringkasan | Statistik, peringatan bentrok IP, tabel jalur, uplink ISP, aktivitas |
| 2 | Peta IP per Jalur | Grid 256 kotak per subnet, detail IP, cek IP sebelum dipasang |
| 3 | Route per Jalur | Topologi per VLAN, trace jalur perangkat, tabel `/ip route` |
| 4 | Live CCTV | Grid live 1/4/9/16, filter lokasi, perbesar kamera, status NVR |
| 5 | Perangkat | Inventaris perangkat static + form tambah perangkat |
| 6 | Log Konflik | Riwayat konflik, kronologi, saran perbaikan |
| 7 | Pengaturan | Koneksi MikroTik, sinkronisasi, aturan konflik, notifikasi, CCTV, pengguna, backup |

---

## Dokumentasi

| File | Isi |
|---|---|
| [docs/01-konsep.md](docs/01-konsep.md) | Masalah, tujuan, prinsip, rencana jalur/VLAN, istilah |
| [docs/02-desain-ui.md](docs/02-desain-ui.md) | Detail tiap layar, perilaku, design token |
| [docs/03-arsitektur.md](docs/03-arsitektur.md) | Alur data, komponen, stack, model database, keamanan |
| [docs/04-integrasi-mikrotik.md](docs/04-integrasi-mikrotik.md) | Setup RouterOS, endpoint REST, webhook, SNMP switch |
| [docs/05-deteksi-konflik.md](docs/05-deteksi-konflik.md) | Aturan deteksi bentrok IP & cara kerjanya |
| [docs/06-cctv-streaming.md](docs/06-cctv-streaming.md) | Live CCTV via go2rtc (RTSP → WebRTC) |
| [docs/07-roadmap.md](docs/07-roadmap.md) | Tahapan pengerjaan & checklist |

---

## Stack

| Bagian | Teknologi |
|---|---|
| Database | PostgreSQL |
| Backend | Laravel (API, collector, rule engine, Reverb real-time) |
| Frontend | Next.js + shadcn/ui + toast (sonner) |
| Login | Google (Socialite), **hanya email yang sudah didaftarkan admin** |
| CCTV | go2rtc |
| Deploy | Docker Compose + Caddy di mini PC |

## Aturan pengerjaan

Semua aturan kode ada di [`rules/`](rules/README.md): overview, design, components, formatting, controllers, models, database, views, security, code-style, api, system-features.

## Status

- [x] Desain UI (8 layar termasuk Login) — selesai, lihat link di atas
- [x] Konsep & arsitektur — didokumentasikan di `docs/`
- [x] Stack final: Laravel + PostgreSQL + Next.js (shadcn/ui), login Google allowlist
- [x] Aturan pengerjaan — `rules/`
- [x] Scaffold project (`backend/`, `frontend/`, `infra/`)
- [x] Login Google allowlist + peran + halaman Pengguna & akses + login darurat + audit log
- [ ] Tahap 1 lanjutan: koneksi MikroTik, jalur, Peta IP, Perangkat, Route — lihat [roadmap](docs/07-roadmap.md)

---

## Menjalankan di lokal (development)

Butuh: PHP 8.3+, Composer, Node 22+, PostgreSQL (lokal: user/password `postgres`, database `netmap` & `netmap_test`).

```bash
# 1. Backend (Laravel) — http://127.0.0.1:8010
cd backend
cp .env.example .env            # isi DB_USERNAME/DB_PASSWORD, NETMAP_INITIAL_ADMIN_EMAIL, GOOGLE_*
composer install
php artisan key:generate
php artisan migrate --seed      # membuat peran + memasukkan email admin pertama ke allowlist
php artisan serve --port=8010

# 2. Frontend (Next.js) — http://localhost:3010  ← buka yang ini
cd frontend
cp .env.example .env.local      # NETMAP_BACKEND_URL=http://127.0.0.1:8010
npm install
npm run dev
```

Next mem-proxy `/api`, `/auth`, `/sanctum`, `/broadcasting` ke Laravel, jadi browser melihat satu origin (sama seperti Caddy di produksi).

### Login Google di lokal

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. Authorized redirect URI: `http://localhost:3010/auth/google/callback`.
3. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `backend/.env`.
4. Pastikan email kamu ada di `NETMAP_INITIAL_ADMIN_EMAIL` lalu `php artisan db:seed`.

Belum punya OAuth client? Masuk lewat link darurat:

```bash
cd backend && php artisan netmap:emergency-login email-admin@gmail.com
```

### Cek kualitas

```bash
cd backend  && ./vendor/bin/pest && ./vendor/bin/phpstan analyse && ./vendor/bin/pint --test
cd frontend && npm run typecheck && npm run lint && npm run format:check && npm run build
```

### Produksi (mini PC)

Lihat [`infra/docker-compose.yml`](infra/docker-compose.yml): Caddy, Next.js, Laravel (FrankenPHP), queue, scheduler, Reverb, PostgreSQL, Redis, go2rtc.
- [ ] Tahap 1 (read-only) — lihat [roadmap](docs/07-roadmap.md)
