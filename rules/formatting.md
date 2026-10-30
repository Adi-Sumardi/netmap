# Formatting

## Format data di tampilan

Semua formatter ada di `frontend/lib/format.ts`. Jangan memformat manual di komponen.

| Data | Format | Contoh |
|---|---|---|
| IPv4 | apa adanya, font mono | `192.168.20.31` |
| Subnet | CIDR | `192.168.20.0/24` |
| Oktet singkat (dalam konteks jalur) | titik + angka | `.31`, `.100–.200` |
| Range | en dash `–` tanpa spasi | `.40–.49` |
| MAC | **huruf besar**, pemisah `:` | `BC:32:5F:1A:0C:31` |
| VLAN | angka saja di tabel, `VLAN 20` di judul | `20` / `VLAN 20` |
| Port | nama RouterOS / "switch port N" | `ether4`, `SW-CCTV-02 port 7` |
| Tanggal-waktu | `id-ID`, zona `Asia/Jakarta` | `28 Okt 2026 09:37` |
| Jam saja (hari ini) | `HH:mm` | `09:37` |
| Waktu relatif (< 24 jam) | "12 detik lalu", "3 jam lalu" | |
| Angka | pemisah ribuan titik (`id-ID`) | `1.016` |
| Persen | tanpa desimal kecuali < 10 | `72%`, `4,5%` |
| Bandwidth | `Mbps` / `Gbps` | `20 Mbps` |
| Latensi | `ms` | `14 ms` |
| Ukuran disk | `GB` / `TB` (basis 1000) | `3,2 TB` |
| Kosong / tidak ada | em dash | `—` |

### Aturan

- Backend **menyimpan & mengirim** MAC dalam format `aa:bb:cc:dd:ee:ff` (format `macaddr` Postgres). Frontend yang mengubah ke huruf besar.
- Backend mengirim waktu dalam **ISO 8601 UTC** (`2026-10-28T02:37:00Z`). Konversi ke `Asia/Jakarta` hanya di frontend.
- Input MAC menerima `-`, `:`, `.`, atau tanpa pemisah, lalu dinormalisasi di Form Request (`Str::lower`, pemisah `:`).
- Input IP di-trim, tidak menerima leading zero (`192.168.020.1` ditolak).
- Sorting IP harus **numerik** (pakai tipe `inet` di DB, `ipToNumber()` di frontend), bukan string.

## Formatter kode

| Bagian | Tool | Perintah |
|---|---|---|
| PHP | **Laravel Pint** (preset `laravel`) | `./vendor/bin/pint` |
| PHP analisis | **Larastan** level 6+ | `./vendor/bin/phpstan analyse` |
| TS/TSX/CSS/JSON/MD | **Prettier** + `prettier-plugin-tailwindcss` | `npm run format` |
| TS lint | **ESLint** (`next/core-web-vitals` + `@typescript-eslint/strict`) | `npm run lint` |

- Indentasi: PHP 4 spasi, TS/TSX/JSON/YAML 2 spasi. Baris akhir file wajib ada. Line ending LF.
- `.editorconfig` di root monorepo menjadi acuan editor.
- Prettier: `printWidth: 100`, `singleQuote: false`, `trailingComma: "all"`, `semi: true`.
- Kode yang tidak lolos Pint/Prettier/ESLint/Larastan tidak boleh di-merge (dijalankan di pre-commit hook / CI).
