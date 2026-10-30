# Security

Aturan di file ini **mengalahkan** aturan lain.

## Jaringan & akses

- NetMap hanya diakses dari LAN (VLAN Manajemen/Kantor) dan dari luar **hanya lewat WireGuard** di MikroTik. Tidak boleh ada port-forward ke dashboard, Reverb, go2rtc, atau kamera.
- Caddy melayani HTTPS (sertifikat internal/self-signed CA kantor). HTTP diarahkan ke HTTPS.
- go2rtc API (`:1984`) hanya `listen 127.0.0.1` / jaringan docker internal. Browser mengakses stream lewat Caddy `/stream/*` yang **memeriksa sesi login** (forward auth ke Laravel `GET /api/v1/stream-auth`).

## Autentikasi — Login dengan Google (allowlist)

Login **hanya** lewat akun Google (Gmail). Akun yang bisa masuk **hanya akun yang sudah didaftarkan admin**. Tidak ada pendaftaran mandiri.

### Alur

1. Admin menambah pengguna di **Pengaturan → Pengguna & akses**: email Gmail + peran. Status awal `invited`.
2. Pengguna klik **Masuk dengan Google** → `GET /auth/google/redirect` (Laravel Socialite, scope `openid email profile`).
3. Google → `GET /auth/google/callback`. Backend memeriksa:
   - `email_verified` dari Google harus `true`.
   - Cari user: berdasarkan `google_id` dulu; kalau belum ada, berdasarkan `email` (case-insensitive).
   - User **tidak ditemukan** atau `status = disabled` → **tolak**, tidak membuat user baru, redirect `/login?error=not_registered` / `?error=disabled`, catat di `audit_logs` (`login_rejected`, email yang mencoba).
   - Login pertama: simpan `google_id`, `avatar_url`, nama dari Google, ubah status ke `active`.
   - Login berikutnya: kalau `google_id` cocok tapi email Google berubah, perbarui email **hanya** jika email baru tidak dipakai user lain.
4. `Auth::login($user)` → sesi Sanctum SPA (cookie) → redirect ke `/` (atau `/cctv` untuk `cctv_viewer`).
5. Simpan `last_login_at`, `last_login_ip`.

### Aturan

- Pakai **Laravel Socialite** (driver `google`) dengan parameter `state` (proteksi CSRF bawaan). Jangan memakai mode `stateless()`.
- Tidak ada kolom/endpoint password untuk pengguna biasa. Form login hanya berisi tombol **Masuk dengan Google**.
- Opsional: batasi domain Google Workspace lewat `GOOGLE_ALLOWED_DOMAINS` (kosong = semua Gmail, tetap wajib terdaftar di allowlist).
- Menonaktifkan user (`status = disabled`) langsung **menghapus semua sesinya** (plus `remember_token`), dan middleware `active` menolak sesi yang masih tersisa (session driver `database`, hapus baris sesi user).
- Admin tidak bisa menonaktifkan/menurunkan perannya sendiri, dan harus selalu ada minimal 1 admin aktif.
- Pesan penolakan di UI: "Akun Google ini belum terdaftar di NetMap. Hubungi admin." Jangan menyebut apakah email lain terdaftar.
- Rate limit callback & redirect: 10 / menit / IP.
- Sesi kedaluwarsa 12 jam. Peran `cctv_viewer` (layar pos satpam) boleh sesi 30 hari.
- Admin pertama: email dari `.env` (`NETMAP_INITIAL_ADMIN_EMAIL`) dimasukkan seeder sebagai user `admin` berstatus `invited`.

### Syarat teknis Google OAuth

- Google **tidak menerima IP privat** (misal `https://10.10.99.5`) sebagai redirect URI. Wajib memakai **nama domain**, misal `https://netmap.<domain-kantor>` yang di-resolve ke IP mini PC (DNS lokal MikroTik `/ip dns static` atau A record ke IP privat).
- HTTPS dengan sertifikat valid: Caddy + Let's Encrypt **DNS-01 challenge** (tidak butuh port terbuka ke internet).
- Redirect URI terdaftar di Google Cloud Console: `https://netmap.<domain-kantor>/auth/google/callback`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` hanya di `.env`.
- Mini PC perlu akses internet ke `accounts.google.com` / `oauth2.googleapis.com` saat login.

### Akun darurat (break-glass)

Kalau internet mati, login Google tidak bisa. Sediakan **satu** jalur darurat:

- Perintah artisan di mini PC: `php artisan netmap:emergency-login {email}` → membuat **link login sekali pakai** berlaku 10 menit untuk user admin yang terdaftar.
- Hanya bisa dijalankan dari shell mini PC (bukan dari web). Setiap pemakaian dicatat di `audit_logs` dan dikirim notifikasi saat internet kembali.
- Tidak ada password statis yang tersimpan.

## Otorisasi

- Peran (spatie): `admin`, `technician`, `cctv_viewer`. Izin dicek lewat Policy/`can:` middleware, **tidak** dengan membandingkan nama peran di kode.

| Izin | admin | technician | cctv_viewer |
|---|---|---|---|
| `view-network` (Ringkasan, Peta IP, Route, Perangkat, Konflik) | ✓ | ✓ | |
| `manage-devices` / `manage-reservations` | ✓ | ✓ | |
| `resolve-conflicts` | ✓ | ✓ | |
| `view-cctv` | ✓ | ✓ | ✓ |
| `mikrotik-write` (lease static, ARP, blokir MAC, PoE) | ✓ | | |
| `manage-settings` / `manage-users` | ✓ | | |

## Kredensial & rahasia

- Password MikroTik, kamera/NVR, token Telegram disimpan di tabel `settings` dengan cast **`encrypted`** (pakai `APP_KEY`). Tidak pernah dikirim balik ke frontend. API hanya mengembalikan `has_password: true`.
- `.env`, sertifikat, dan backup **tidak** di-commit (`.gitignore`). Sediakan `.env.example` tanpa nilai rahasia.
- URL RTSP berisi kredensial **hanya** ada di config go2rtc yang dihasilkan backend, tidak pernah ke browser atau log.
- Log tidak boleh mencetak password, token, atau header Authorization (`Http::` client pakai redaksi).

## Akses ke MikroTik

- User API khusus `netmap-api`, dibatasi `address=<IP mini PC>/32`.
- Tahap 1–3: group `read,api,rest-api`. Hak `write` hanya saat fitur tahap 4 diaktifkan.
- Koneksi REST **wajib HTTPS** dengan verifikasi CA (`verify => netmap-ca.crt`). `verify => false` dilarang di luar development.
- Aksi tulis:
  1. Fitur flag `MIKROTIK_WRITE_ENABLED=true` di `.env` + middleware `EnsureWriteActionsEnabled`.
  2. Izin `mikrotik-write`.
  3. Konfirmasi `AlertDialog` di UI.
  4. Dicatat di `audit_logs` (user, aksi, target, payload sebelum/sesudah, hasil).
  5. Objek yang dibuat di MikroTik diberi `comment` berawalan `netmap:` + id audit.
- Tidak ada endpoint yang meneruskan perintah RouterOS bebas dari input pengguna. Hanya aksi yang sudah didefinisikan di `MikrotikClient`.

## Webhook dari MikroTik

- Endpoint `/webhook/mikrotik/*` diproteksi middleware `VerifyWebhookSource`:
  - IP sumber harus ada di allowlist (IP router di tabel `routers`).
  - Query `token` harus sama dengan `routers.webhook_token` (perbandingan `hash_equals`).
- Rate limit 120 request/menit per router. Payload divalidasi ketat (IP/MAC valid), lalu hanya dispatch job.

## Validasi input

- Semua input lewat Form Request. IP divalidasi `ip` + `ipv4` + harus berada di subnet jalur. MAC dinormalisasi lalu divalidasi regex.
- Query Postgres memakai binding. `whereRaw` hanya dengan parameter `?`, tidak pernah interpolasi string.
- Upload (impor CSV perangkat) dibatasi 2 MB, tipe `text/csv`, diproses di job, hasil validasi per baris.

## Frontend

- Tidak menyimpan data sensitif di `localStorage`. Preferensi UI (layout CCTV, tab terakhir) boleh.
- Header keamanan via Caddy: `Content-Security-Policy` (self + ws Reverb + media dari `/stream`), `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`.
- Jangan `dangerouslySetInnerHTML` untuk data dari API/MikroTik (host-name DHCP bisa berisi apa saja).

## Audit & dependency

- `audit_logs` hanya bisa ditambah, tidak bisa diedit/dihapus dari aplikasi.
- `composer audit` dan `npm audit --omit=dev` dijalankan di CI. Update keamanan diprioritaskan.
