# Design

Acuan visual: canvas desain https://claude.ai/artifact/St4Z7yFNYPsRhBpEVnqZgu (7 layar). Detail tiap layar: [`../docs/02-desain-ui.md`](../docs/02-desain-ui.md).

## Tema

- **Gelap sebagai default** (ruang monitoring). Mode terang menyusul dengan token yang sama.
- Semua warna lewat **CSS variable** di `frontend/app/globals.css`, dipetakan ke tema shadcn. Tidak boleh ada hex langsung di komponen.

```css
:root {
  --background: #0E1116;
  --sidebar: #12161D;
  --card: #161B22;
  --border: #232B36;
  --input: #2A3340;
  --foreground: #E6EAF0;
  --muted-foreground: #9AA6B5;
  --primary: #4CC2FF;
  --primary-foreground: #04121C;
  --ring: #4CC2FF;
  --radius: 0.75rem;

  /* warna jalur */
  --segment-office: #4CC2FF;
  --segment-cctv: #FF9A4D;
  --segment-guest: #B49BFF;
  --segment-mgmt: #5FD39A;

  /* status IP & event */
  --status-gateway: #5FD39A;   --status-gateway-fg: #062014;
  --status-static: #2563EB;    --status-static-fg: #FFFFFF;
  --status-dhcp: #1E4E6B;      --status-dhcp-fg: #E6F4FF;
  --status-reserved: #6D4FD1;  --status-reserved-fg: #FFFFFF;
  --status-conflict: #FF9A4D;  --status-conflict-fg: #1A0F05;
  --status-risk: #FFC46B;      --status-risk-fg: #1E1503;
  --status-offline: #3A2A1A;   --status-offline-fg: #FFC46B;
  --status-free: #1A2029;      --status-free-fg: #8794A5;
  --status-online: #5FD39A;
  --status-live: #FF8A8A;      --status-live-bg: #3A0D0D;
}
```

Warna jalur disimpan juga di kolom `segments.color` agar bisa diubah admin. Variabel di atas hanya default.

## Tipografi

- **IBM Plex Sans** untuk UI, **JetBrains Mono** untuk IP, MAC, port, VLAN, angka statistik, dan kode RouterOS. Muat lewat `next/font/google`.
- Skala: judul halaman 24px/700, judul kartu 15–16px/600, isi 14px, sekunder 12–13px, label kecil 11px (uppercase + letter-spacing hanya untuk label statistik).
- IP & MAC **selalu** mono. Lihat [formatting.md](formatting.md).

## Layout

- Shell: sidebar kiri (220px) + konten. Di bawah 768px sidebar menjadi menu atas/sheet (shadcn `Sheet`).
- Konten: padding 24–28px, jarak antar section 16–20px, `max-width` hanya untuk halaman form (Pengaturan ±1000px).
- Pola dua kolom (konten utama + panel samping) memakai flex-wrap: utama `flex: 999 1 560px`, panel `flex: 1 1 300px`. Di HP panel turun ke bawah.
- Tabel lebar dibungkus `overflow-x-auto`. Jangan memaksa halaman scroll horizontal.
- Kartu: `bg-card`, border 1px, radius 12px. Input & tombol radius 8px.

## Status — satu sumber

Status IP/perangkat/event selalu ditampilkan lewat komponen `StatusBadge` / `IpCell` (lihat [components.md](components.md)) dengan peta tunggal `frontend/lib/status.ts`. Label UI:

| Kode | Label | Token |
|---|---|---|
| `gateway` | Gateway | `--status-gateway` |
| `static` | Static | `--status-static` |
| `dhcp` | DHCP lease | `--status-dhcp` |
| `reserved` | Reservasi | `--status-reserved` |
| `conflict` | Konflik | `--status-conflict` |
| `risk` | Static di pool DHCP / Rawan | `--status-risk` |
| `offline` | Offline | `--status-offline` |
| `free` | Kosong | `--status-free` |
| `network` | Network / Broadcast | `--background` + border |

Tingkat event: **KONFLIK** (oranye), **RAWAN** (kuning), **INFO** (biru gelap).

## Aksesibilitas

- Kontras teks minimal 4.5:1 (termasuk teks abu kecil). Token di atas sudah lolos. Jangan menggelapkan `muted-foreground`.
- Status tidak boleh dibedakan **hanya** dengan warna: selalu ada label/teks atau `aria-label` (kotak grid IP punya `aria-label="192.168.20.31 — Konflik"`).
- Elemen yang bisa diklik = `<button>` / `<a>` (bukan div). Target sentuh ≥ 40px.
- Ikon tanpa teks wajib `aria-label`. Ikon dekoratif `aria-hidden`.
- Fokus terlihat (`ring`), navigasi keyboard berfungsi di grid IP dan tile CCTV.

## Bahasa & copy UI

- Bahasa Indonesia sederhana, menyapa dengan netral (tanpa "Anda/kamu" berlebihan).
- Pesan menjelaskan **apa yang terjadi + apa yang bisa dilakukan**: "192.168.20.31 dipakai 2 perangkat. Pindahkan salah satu atau blokir MAC-nya."
- Istilah teknis tetap dipakai apa adanya: VLAN, DHCP, MAC, ARP, PoE, RTSP.
- Tanpa emoji. Tanpa gradient dekoratif.
