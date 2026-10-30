# Code Style

## Umum

- Identifier, nama file, tabel, dan komentar kode memakai **bahasa Inggris**. Teks UI, pesan validasi, dan pesan error untuk pengguna memakai **bahasa Indonesia**.
- Komentar hanya untuk **alasan** ("kenapa"), bukan mengulang kode. Contoh bagus: `// ARP table holds one MAC per IP, so duplicates only show up across polls.`
- Tidak ada kode mati, `dd()`, `console.log` tertinggal, atau TODO tanpa issue.
- Fungsi pendek dan satu tugas. Kalau butuh kata "dan" untuk menjelaskannya, pecah.

## PHP / Laravel

- PHP 8.3+, `declare(strict_types=1);` di setiap file.
- Kelas `final` secara default (kecuali memang untuk diturunkan). Property & parameter **bertipe**, return type wajib.
- Pakai constructor property promotion dan `readonly` untuk DTO/value object.
- Penamaan:

| Jenis | Pola | Contoh |
|---|---|---|
| Controller | `<Resource>Controller` | `DeviceController` |
| Action | kata kerja + objek | `CreateDevice`, `SuggestNextFreeIp` |
| Job | kata kerja + `Job` | `SyncMikrotikJob` |
| Event | lampau | `ConflictDetected`, `CameraWentOffline` |
| Form Request | `<Aksi><Resource>Request` | `StoreDeviceRequest` |
| Resource | `<Model>Resource` | `ConflictEventResource` |
| Enum | tunggal | `DeviceType`, `Severity` |
| Exception | `...Exception` | `IpAlreadyUsedException` |

- Action punya satu method publik `handle(...)`.
- Gunakan DTO (`app/Data/`) untuk data dari MikroTik & Form Request (`$request->toData()`), bukan array asosiatif berantai.
- Helper Laravel boleh (`collect`, `str`), facade boleh di Service, tapi Action/Service menerima dependency lewat constructor (mudah di-test).
- Konfigurasi lewat `config/netmap.php` + `.env`. Tidak memanggil `env()` di luar folder `config/`.

## TypeScript / Next.js

- `strict: true`, `noUncheckedIndexedAccess: true`. Dilarang `any` (pakai `unknown` lalu persempit).
- Tipe response API di `frontend/types/api.ts` (selaras dengan Resource Laravel). Boleh digenerate dari OpenAPI nanti.
- Penamaan:

| Jenis | Pola | Contoh |
|---|---|---|
| File komponen | `kebab-case.tsx` | `ip-grid.tsx` |
| Komponen | `PascalCase` | `IpGrid` |
| Hook | `useCamelCase` | `useIpMap` |
| Util | `camelCase` | `formatMac` |
| Konstanta | `SCREAMING_SNAKE` | `MAX_STREAMS` |
| Tipe | `PascalCase` | `ConflictEvent` |

- Komponen sebagai function declaration (`export function IpGrid(...)`), named export (kecuali `page.tsx`/`layout.tsx` yang wajib default).
- Styling hanya Tailwind + token CSS variable (lihat [design.md](design.md)). Gabung class dengan `cn()`. Tanpa inline style kecuali nilai dinamis (warna jalur dari DB).
- Hindari `useEffect` untuk mengambil data (pakai TanStack Query). `useEffect` untuk sinkronisasi dengan sistem luar (Echo, IntersectionObserver, video).
- Impor absolut `@/components/...`, `@/lib/...`.

## Test

- Backend: **Pest**. Feature test per endpoint (status code, struktur JSON, otorisasi per peran). Unit test untuk `RuleEngine`, `SuggestNextFreeIp`, `CheckIpAvailability`, normalisasi MAC/IP. MikroTik di-fake dengan fixture JSON.
- Frontend: **Vitest** + Testing Library untuk komponen domain (IpGrid, IpChecker, StatusBadge), **Playwright** untuk alur utama (login, cek IP, tambah perangkat, tandai konflik selesai).
- Bug yang diperbaiki wajib disertai test yang gagal sebelum perbaikan.

## Git

- Branch: `main` (stabil), fitur di `feat/<nama>`, perbaikan `fix/<nama>`.
- Commit **Conventional Commits** bahasa Inggris: `feat(ip-map): add next free ip suggestion`, `fix(collector): handle routeros timeout`.
- Scope yang dipakai: `backend`, `frontend`, `infra`, `ip-map`, `topology`, `cctv`, `devices`, `conflicts`, `settings`, `collector`, `auth`, `docs`, `rules`.
- Satu PR = satu topik. Migration, kode, dan test di PR yang sama.
