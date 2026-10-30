# 03 · Arsitektur

## Alur data

```
 ┌─────────────┐   REST API (HTTPS)    ┌──────────────────────────── Mini PC (10.10.99.5) ──┐
 │ MikroTik    │◄──── poll 30 detik ───┤  Collector ──► Database ──► API backend ──► Web UI │◄── Browser admin
 │ RouterOS v7 │──── webhook event ───►│      ▲            ▲             │                   │
 └─────────────┘  (DHCP lease-script)  │      │            │             ▼                   │
                                       │  Ping/ARP scan   Rule engine  Notif Telegram        │
 ┌─────────────┐   SNMP (opsional)     │  ke tiap VLAN    (deteksi                           │
 │ Switch      │◄──────────────────────┤                   konflik)                         │
 │ managed     │                       │                                                    │
 └─────────────┘                       │  go2rtc  ◄── RTSP ── Kamera  ──► WebRTC ke browser  │
                                       └────────────────────────────────────────────────────┘
```

Browser **tidak pernah** bicara langsung ke MikroTik atau kamera. Semua lewat mini PC.

## Komponen

| Komponen | Tugas |
|---|---|
| **Collector** | Worker berkala (default 30 detik): tarik data REST MikroTik, simpan snapshot, catat perubahan (ARP/lease baru, MAC berubah) |
| **Webhook receiver** | Endpoint `/hook/lease` untuk event DHCP real-time dari MikroTik |
| **Scanner** | `fping` (status online) + `arping -D` (deteksi IP duplikat) di tiap VLAN |
| **SNMP poller** (opsional) | Baca tabel MAC switch managed → lokasi "switch X port Y" |
| **Rule engine** | Jalankan aturan konflik (lihat [05-deteksi-konflik.md](05-deteksi-konflik.md)) → buat/tutup event |
| **API backend** | REST + WebSocket/SSE untuk UI; auth & role; aksi tulis ke MikroTik (tahap 4) |
| **Web UI** | Implementasi 7 layar dari desain |
| **go2rtc** | Konversi RTSP kamera → WebRTC/MSE untuk browser |
| **Notifier** | Kirim pesan Telegram sesuai pemicu di Pengaturan |

## Stack (final)

Detail & aturan: [`../rules/overview.md`](../rules/overview.md).

| Lapisan | Pilihan | Catatan |
|---|---|---|
| OS mini PC | Ubuntu Server 24.04 / Debian 12 | IP static 10.10.99.5 |
| Deploy | Docker Compose + Caddy | satu origin `https://netmap.<domain-kantor>` |
| Backend | **Laravel** (PHP 8.3+) | API, collector (Jobs + Scheduler), rule engine, notifier |
| Real-time | Laravel Reverb | WebSocket ke frontend |
| Antrian | Laravel Queue + Redis | |
| Database | **PostgreSQL** | tipe `inet`/`cidr`/`macaddr` bawaan, cocok untuk IPAM |
| Frontend | **Next.js** + shadcn/ui + sonner (toast) | TanStack Query, react-hook-form + zod |
| Login | Google via Laravel Socialite + Sanctum | hanya email yang didaftarkan admin |
| Stream | go2rtc | ringan, mendukung WebRTC |
| Notifikasi | Telegram Bot API | |

### Jaringan mini PC

Colok mini PC ke **port trunk** lalu buat sub-interface VLAN di Linux:

```
eth0        → VLAN 99 (untagged)  10.10.99.5/24   ← akses dashboard & API MikroTik
eth0.10     → VLAN 10             192.168.10.250/24 (hanya scan/ping)
eth0.20     → VLAN 20             192.168.20.250/24 (scan/ping + RTSP kamera)
eth0.30     → VLAN 30             192.168.30.250/24 (hanya scan/ping)
```

> IP `.250` harus ditandai **reservasi NetMap** supaya tidak dipakai perangkat lain.
> Kalau tidak mau trunk, scan/RTSP bisa lewat routing MikroTik dengan firewall rule khusus dari 10.10.99.5. Tapi `arping` hanya bisa dilakukan di VLAN yang sama.

## Model database (garis besar)

Nama tabel bahasa Inggris (UI tetap bahasa Indonesia). Aturan lengkap: [`../rules/database.md`](../rules/database.md) & [`../rules/models.md`](../rules/models.md).

| Tabel | Kolom penting |
|---|---|
| `routers` | id, name, host, api_port, webhook_token |
| `segments` (jalur) | id, router_id, name, vlan_id, subnet `cidr`, gateway `inet`, interface, pool_start, pool_end, static_range, egress (keluar lewat), color |
| `devices` (perangkat) | id, name, type, segment_id, ip `inet`, mac `macaddr`, location, network_switch_id, port, note, monitor_ping |
| `ip_reservations` | id, segment_id, ip_start, ip_end, description, created_by |
| `arp_observations` | segment_id, ip, mac, interface, first_seen_at, last_seen_at (deteksi IP ganti MAC) |
| `dhcp_leases` | ip, mac, host_name, status, dynamic, last_seen_at |
| `mac_locations` | mac, network_switch_id, port, source (bridge_host/snmp/manual), last_seen_at |
| `router_routes` | dst, gateway, routing_table, distance, active |
| `conflict_events` | id, type, severity, segment_id, ip, macs, status (active/resolved), opened_at, resolved_at, resolved_by |
| `conflict_event_logs` | conflict_event_id, logged_at, message |
| `cameras` | device_id, nvr_id, location_group, stream_main, stream_sub, status, last_ok_at |
| `nvrs` | device_id, capacity_bytes, used_bytes, retention_days |
| `users` | id, email (allowlist), name, google_id, avatar_url, status (invited/active/disabled), last_login_at, last_login_ip — **tanpa password** |
| `audit_logs` | created_at, user_id, action, target, before, after |
| `settings` | key, value (terenkripsi untuk kredensial) |

## Keamanan

- User API MikroTik khusus (`netmap-api`), dibatasi hanya dari IP mini PC.
- Tahap 1–3: hak **read + api + rest-api** saja. Hak `write` baru diberikan di tahap 4.
- Kredensial MikroTik/kamera/Telegram disimpan **terenkripsi** di DB (atau di `.env` yang tidak di-commit).
- Login **hanya dengan Google**, dan hanya email yang sudah didaftarkan admin (allowlist). Email lain ditolak, tidak ada pendaftaran mandiri. Detail: [`../rules/security.md`](../rules/security.md#autentikasi--login-dengan-google-allowlist).
- Karena syarat Google OAuth, dashboard diakses lewat domain HTTPS (`https://netmap.<domain-kantor>` → IP mini PC), bukan IP langsung.
- Peran **Viewer CCTV** hanya boleh membuka Live CCTV.
- Semua aksi tulis masuk `audit_log`.
- Akses dari luar kantor **hanya lewat WireGuard** di MikroTik. Jangan port-forward dashboard atau kamera.
- Firewall MikroTik: mini PC boleh ke VLAN 20 hanya port 554 (RTSP) + ICMP. VLAN CCTV tidak boleh ke VLAN lain.
