# Views (Next.js)

Laravel **tidak** merender UI. Semua tampilan ada di `frontend/` (Next.js App Router). Blade hanya boleh untuk template email/notifikasi.

## Rute halaman

| Layar desain | Path | File |
|---|---|---|
| Login | `/login` (query `?error=`) | `app/(auth)/login/page.tsx` |
| 1 · Ringkasan | `/` | `app/(app)/page.tsx` |
| 2 · Peta IP | `/peta-ip` (query `?jalur=cctv&ip=31`) | `app/(app)/peta-ip/page.tsx` |
| 3 · Route per Jalur | `/route` (query `?jalur=cctv&device=123`) | `app/(app)/route/page.tsx` |
| 4 · Live CCTV | `/cctv` (query `?lokasi=gudang&layout=9&kamera=31`) | `app/(app)/cctv/page.tsx` |
| 5 · Perangkat | `/perangkat`, `/perangkat/baru`, `/perangkat/[id]` | `app/(app)/perangkat/...` |
| 6 · Log Konflik | `/konflik` (query `?status=active&id=12`) | `app/(app)/konflik/page.tsx` |
| 7 · Pengaturan | `/pengaturan/[bagian]` (mikrotik, sinkronisasi, aturan, notifikasi, cctv, pengguna, backup) | `app/(app)/pengaturan/...` |

- Path URL bahasa Indonesia (sama dengan menu). Nama file/folder komponen tetap bahasa Inggris.
- State yang bisa dibagikan (jalur terpilih, IP terpilih, filter, layout CCTV) disimpan di **query string** supaya link bisa dikirim ke rekan.
- `app/(app)/layout.tsx` = `AppShell` (sidebar + header) + guard login.

## Server vs client component

- Default **server component** untuk shell & bagian statis.
- Bagian yang interaktif/real-time (grid IP, tile CCTV, tabel dengan filter, form) = **client component** (`"use client"`), letakkan sedalam mungkin di pohon.
- Data aplikasi diambil di client lewat **TanStack Query** ke `/api/v1/*` (cookie Sanctum ikut otomatis karena satu origin). Tidak ada fetch ke MikroTik/kamera dari browser.

## Data fetching

- Client API tunggal: `frontend/lib/api.ts` (fetch wrapper: `credentials: "include"`, header `Accept: application/json`, `X-XSRF-TOKEN`, parsing error ke `ApiError`).
- Hook per resource di `frontend/hooks/` (`useSegments`, `useIpMap(segmentId)`, `useDevices(filters)`, `useConflicts(status)`, `useCameras(filters)`).
- Query key konsisten: `["ip-map", segmentId]`, `["devices", filters]`, dst.
- Data yang berubah cepat (status kamera, konflik aktif) diperbarui lewat **event Reverb** → `queryClient.setQueryData` / `invalidateQueries`, bukan polling agresif. Polling cadangan maksimal tiap 30 detik.
- Mutasi: `useMutation` + toast (lihat [components.md](components.md)) + invalidasi query terkait.

## Real-time

- `frontend/lib/echo.ts` membuat satu instance `laravel-echo` (broadcaster `reverb`).
- Channel private: `netmap` (umum), `segment.{id}`, `cctv`. Nama event: [api.md](api.md#event-real-time).
- Listener didaftarkan di hook (`useRealtime()`) yang dipasang sekali di `AppShell`.

## Halaman khusus

- **Peta IP**: grid 16×16 dirender dari data `/api/v1/segments/{id}/ip-map` (256 item). Klik kotak → update query `?ip=` → panel detail. Navigasi panah keyboard antar kotak.
- **Live CCTV**: `CameraPlayer` memakai `<video>` + WebRTC dari go2rtc lewat path `/stream/...` (proxy Caddy). Tile hanya memutar stream saat terlihat (`IntersectionObserver`), sub-stream di grid, main-stream saat diperbesar. Stream ditutup saat unmount.
- **Route per Jalur**: topologi dirender dengan flex/grid HTML (bukan canvas) supaya bisa diakses keyboard. Library graf baru dipakai bila topologi > 1 router.

## Error & loading

- Tiap segmen rute punya `loading.tsx` (skeleton) dan `error.tsx` (pesan Indonesia + coba lagi).
- 401 dari API → redirect `/login`. 403 → halaman "Tidak punya akses". 503 MikroTik tidak terhubung → banner di atas konten, data terakhir tetap tampil dengan label waktu sinkron.

## Halaman login

- Hanya logo NetMap, satu kalimat penjelasan, dan tombol **Masuk dengan Google** (`<a href="/auth/google/redirect">`, bukan fetch — harus navigasi penuh).
- Tidak ada field email/password atau link daftar.
- `?error=` ditampilkan sebagai alert di atas tombol:

| Kode | Pesan |
|---|---|
| `not_registered` | Akun Google ini belum terdaftar di NetMap. Hubungi admin untuk ditambahkan. |
| `disabled` | Akun ini sedang dinonaktifkan. Hubungi admin. |
| `unverified` | Email Google belum terverifikasi. |
| `oauth_failed` | Login Google gagal. Coba lagi. |

- Header aplikasi menampilkan avatar + nama dari Google dan menu **Keluar**.

## Akses per peran

- Menu dan tombol disembunyikan sesuai izin dari `/api/v1/me` (`permissions: string[]`), tapi **otorisasi sebenarnya tetap di backend**.
- Peran `cctv_viewer` hanya melihat menu Live CCTV, dan setelah login langsung diarahkan ke `/cctv`.
