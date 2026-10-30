# API

REST JSON milik Laravel, dipakai oleh frontend Next.js. Base path: **`/api/v1`**. Semua endpoint (kecuali login & webhook) butuh sesi Sanctum.

## Format response

**Satu resource**

```json
{ "data": { "id": 12, "name": "Cam-Gudang-03", "ip": "192.168.20.31", "mac": "bc:32:5f:1a:0c:31" } }
```

**Koleksi + pagination** (bawaan Laravel Resource)

```json
{ "data": [ ... ], "links": { ... }, "meta": { "current_page": 1, "per_page": 50, "total": 128 } }
```

**Aksi dengan pesan** → tambah `"message": "Perangkat disimpan."` (ditampilkan sebagai toast).

**Error**

```json
{ "message": "IP 192.168.20.31 sudah dipakai Cam-Gudang-03.", "code": "ip_already_used", "errors": { "ip": ["IP sudah dipakai."] } }
```

| Status | Kapan | `code` contoh |
|---|---|---|
| 401 | belum login | `unauthenticated` |
| 403 | tidak punya izin / fitur tulis dimatikan | `forbidden`, `write_disabled` |
| 404 | resource tidak ada | `not_found` |
| 409 | konflik bisnis (IP dipakai, reservasi tumpang tindih) | `ip_already_used`, `reservation_overlap` |
| 422 | validasi gagal (format Laravel `errors`) | `validation_failed` |
| 429 | rate limit | `too_many_requests` |
| 503 | MikroTik / go2rtc tidak bisa dihubungi | `mikrotik_unavailable`, `stream_unavailable` |

## Konvensi

- URL kebab-case, jamak: `/devices`, `/ip-reservations`, `/conflict-events`.
- Field JSON **snake_case**. Waktu ISO 8601 UTC. MAC huruf kecil `aa:bb:..`. IP string.
- Filter lewat query: `?segment_id=2&status=active&q=gudang&sort=ip&per_page=50`.
- Enum dikirim sebagai kode (`"status": "conflict"`) + `status_label` bila perlu ditampilkan langsung.
- Aksi non-CRUD: `POST /resource/{id}/<aksi>` (`POST /conflict-events/12/resolve`).
- Pekerjaan panjang → `202 { "data": { "job_id": "…" } }`, hasil lewat event real-time.

## Endpoint

### Auth & profil (Login dengan Google, lihat [security.md](security.md#autentikasi--login-dengan-google-allowlist))
| Method | Path | Ket. |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | ambil cookie CSRF |
| GET | `/auth/google/redirect` | route **web** Laravel → redirect ke Google |
| GET | `/auth/google/callback` | route **web** Laravel → cek allowlist → login → redirect ke frontend (`/`, `/cctv`, atau `/login?error=not_registered\|disabled\|unverified`) |
| POST | `/api/v1/auth/logout` | hapus sesi |
| GET | `/api/v1/me` | user (`name`, `email`, `avatar_url`) + `roles` + `permissions` |

Tidak ada endpoint login email/password dan tidak ada endpoint register.

### Ringkasan
| GET | `/api/v1/dashboard/summary` | statistik, uplink, aktivitas terbaru |

### Jalur & Peta IP
| Method | Path | Ket. |
|---|---|---|
| GET | `/api/v1/segments` | daftar jalur + pemakaian |
| GET | `/api/v1/segments/{id}` | detail jalur |
| GET | `/api/v1/segments/{id}/ip-map` | 256 item `{ octet, ip, status, device?, mac?, last_seen_at?, note? }` |
| GET | `/api/v1/segments/{id}/next-free-ip?range=50-99` | saran IP kosong |
| GET | `/api/v1/ip-check?ip=192.168.20.57` | hasil: `free`/`used`/`reserved`/`in_pool`/`gateway`/`network`/`out_of_segment` + `suggestion` |
| CRUD | `/api/v1/ip-reservations` | reservasi |

### Perangkat
| CRUD | `/api/v1/devices` | perangkat (filter `segment_id`, `type`, `status`, `q`) |
| POST | `/api/v1/devices/import` | impor CSV (202) |
| GET | `/api/v1/devices/export?segment_id=` | ekspor CSV |
| GET | `/api/v1/devices/{id}/trace` | daftar hop untuk Trace jalur |

### Route & topologi
| GET | `/api/v1/topology` | ISP, router, jalur, switch, ringkasan perangkat per cabang |
| GET | `/api/v1/routes` | snapshot `/ip route` + jalur yang memakai |

### Konflik
| GET | `/api/v1/conflict-events?status=active` | daftar |
| GET | `/api/v1/conflict-events/{id}` | detail + timeline + saran |
| POST | `/api/v1/conflict-events/{id}/resolve` | tandai selesai (catatan opsional) |

### CCTV
| GET | `/api/v1/cameras?group=gudang` | daftar kamera + status |
| GET | `/api/v1/cameras/{id}/stream?quality=sub|main` | `{ webrtc_url, mse_url }` (path `/stream/...`, tanpa kredensial) |
| POST | `/api/v1/cameras/{id}/snapshot` | ambil snapshot |
| POST | `/api/v1/cameras/{id}/ping` | ping ulang (202) |
| GET | `/api/v1/nvrs` | status NVR |
| GET | `/api/v1/stream-auth` | dipakai Caddy forward-auth (200/401) |

### Aksi MikroTik (tahap 4, izin `mikrotik-write`, flag aktif)
| POST | `/api/v1/mikrotik/leases/make-static` | `{ segment_id, ip, mac, comment }` |
| POST | `/api/v1/mikrotik/arp` | ARP static |
| POST | `/api/v1/mikrotik/mac-blocks` | blokir MAC |
| DELETE | `/api/v1/mikrotik/mac-blocks/{id}` | buka blokir |
| POST | `/api/v1/mikrotik/poe/{interface}/restart` | restart PoE |
| POST | `/api/v1/mikrotik/sync` | sinkron manual (202) |
| POST | `/api/v1/mikrotik/scan` | scan ARP aktif per jalur (202) |

### Pengaturan & pengguna (izin admin)
| GET/PUT | `/api/v1/settings/{group}` | `mikrotik`, `sync`, `rules`, `notifications`, `cctv`, `backup` (rahasia → `has_*`) |
| POST | `/api/v1/settings/mikrotik/test` | tes koneksi |
| POST | `/api/v1/settings/notifications/test` | kirim notifikasi tes |
| CRUD | `/api/v1/users` | allowlist pengguna. `POST { email, role, name? }` → status `invited`. `PATCH { role?, enabled?, name? }` (`enabled: false` = nonaktifkan + putus sesi). `DELETE` hanya untuk undangan yang belum pernah login. Email unik (case-insensitive) |
| POST | `/api/v1/users/{id}/revoke-sessions` | paksa logout semua sesi user |
| GET | `/api/v1/audit-logs` | jejak aksi |
| POST | `/api/v1/backups` | backup sekarang (202) |

### Webhook (tanpa sesi, lihat [security.md](security.md))
| GET/POST | `/webhook/mikrotik/lease?token=&mac=&ip=&bound=&server=` | event DHCP |
| GET/POST | `/webhook/mikrotik/netwatch?token=&name=&status=` | ISP up/down |

## Event real-time

Broadcast lewat Reverb, channel **private** (otorisasi di `routes/channels.php`).

| Channel | Event | Payload |
|---|---|---|
| `netmap` | `sync.completed` | `{ router_id, finished_at, changes }` |
| `netmap` | `conflict.opened` | `ConflictEventResource` |
| `netmap` | `conflict.resolved` | `{ id }` |
| `netmap` | `device.discovered` | `{ segment_id, ip, mac }` |
| `netmap` | `uplink.changed` | `{ name, status }` |
| `segment.{id}` | `ip-map.updated` | `{ octets: [31, 50] }` (frontend refetch item tersebut) |
| `cctv` | `camera.status` | `{ id, status, last_ok_at }` |
| `netmap` | `job.finished` | `{ job_id, status, message }` |

Nama event = `broadcastAs()` dengan format `domain.verb`.

## Dokumentasi API

- Spesifikasi OpenAPI dibuat otomatis dengan **Scramble** (`dedoc/scramble`) di `/docs/api` (hanya admin, hanya non-produksi atau di balik login).
