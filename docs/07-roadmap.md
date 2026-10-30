# 07 · Roadmap

## Tahap 0 — Persiapan

- [ ] Install OS di mini PC (Ubuntu Server 24.04 / Debian 12), IP static `10.10.99.5`
- [ ] Docker + Docker Compose
- [ ] Colok mini PC ke port trunk, buat sub-interface VLAN (lihat [03-arsitektur.md](03-arsitektur.md#jaringan-mini-pc))
- [ ] Reservasi IP `.250` di tiap VLAN untuk mini PC
- [ ] Setup user `netmap-api` + REST API di MikroTik (lihat [04-integrasi-mikrotik.md](04-integrasi-mikrotik.md))
- [ ] Tes `curl` ke `/rest/ip/arp` berhasil
- [ ] Data jalur/VLAN asli dicatat (ganti contoh di [01-konsep.md](01-konsep.md))
- [x] Stack final: Laravel + PostgreSQL + Next.js (shadcn/ui) — lihat [`../rules/`](../rules/README.md)
- [ ] Domain `netmap.<domain-kantor>` + DNS static di MikroTik + sertifikat HTTPS (DNS-01)
- [ ] Project Google Cloud: OAuth client (Web), redirect URI `https://netmap.<domain-kantor>/auth/google/callback`

## Tahap 1 — Read-only (inti IPAM)

- [ ] Scaffold project: `backend/` (Laravel), `frontend/` (Next.js + shadcn), `infra/` (docker-compose, Caddy, go2rtc)
- [ ] Login dengan Google + allowlist email + halaman Pengguna & akses
- [ ] Skema database + migrasi
- [ ] Collector: address, pool, lease, arp, interface, route, mangle
- [ ] Layar **Ringkasan** (data asli)
- [ ] Layar **Peta IP** + Cek IP sebelum dipasang
- [ ] Layar **Perangkat** (CRUD di NetMap saja, belum tulis ke MikroTik)
- [ ] Layar **Route per Jalur** (topologi dari data + input manual switch)
- [ ] Peran admin / technician / cctv_viewer
- [ ] Pengaturan: koneksi MikroTik & sinkronisasi

## Tahap 2 — Deteksi konflik & notifikasi

- [ ] `arp_history` + scanner (`fping`, `arping -D`)
- [ ] Rule engine (DUP_IP, RES_MISUSE, REG_MISMATCH, STATIC_IN_POOL, OUT_OF_SUBNET, NEW_DEVICE, CAM_OFFLINE)
- [ ] Layar **Log Konflik**
- [ ] Webhook lease-script & netwatch
- [ ] Notifikasi Telegram
- [ ] (Opsional) SNMP switch managed → lokasi port + MAC_FLAP

## Tahap 3 — Live CCTV

- [ ] Container go2rtc
- [ ] Tabel kamera/NVR + pola RTSP per merek
- [ ] Layar **Live CCTV** (grid sub-stream, perbesar main-stream, snapshot)
- [ ] Status kamera (ping + go2rtc) & panel NVR
- [ ] Peran **Viewer CCTV**

## Tahap 4 — Aksi tulis ke MikroTik

- [ ] Ganti group user API ke `netmap-rw`
- [ ] Buat DHCP lease static, ARP static, blokir MAC, restart PoE
- [ ] Konfirmasi di UI + `audit_log`
- [ ] Peran **Teknisi**
- [ ] Backup harian (DB + `/export` MikroTik)

## Nanti

- Mode terang
- Multi-router (lebih dari satu MikroTik / cabang)
- Playback rekaman langsung di dashboard
- Laporan bulanan (pemakaian IP, uptime kamera, kejadian konflik)
