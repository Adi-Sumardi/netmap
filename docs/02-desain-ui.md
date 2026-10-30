# 02 · Desain UI

Canvas desain: https://claude.ai/artifact/St4Z7yFNYPsRhBpEVnqZgu

Semua layar memakai **sidebar yang sama**: Ringkasan · Peta IP · Route per Jalur · Live CCTV · Perangkat · Log Konflik (badge jumlah konflik aktif) · Pengaturan. Di HP, sidebar pindah ke atas konten.

---

## 0 · Login (Google)

- Kartu di tengah layar: logo NetMap, judul "Masuk ke dashboard", satu kalimat penjelasan.
- Satu tombol **Masuk dengan Google** (putih, logo G). Tanpa field email/password, tanpa link daftar.
- Saat diklik: tombol berubah "Mengalihkan ke Google…".
- Alert di atas tombol sesuai `?error=`: belum terdaftar, dinonaktifkan (keduanya menampilkan email Google yang mencoba), email belum terverifikasi, login Google gagal.
- Catatan kecil: hanya akun terdaftar yang bisa masuk, minta admin menambahkan email di Pengaturan → Pengguna & akses.
- Footer: domain dashboard + "Akses dari luar kantor hanya lewat VPN".

## 1 · Ringkasan

- Header: judul, waktu sinkron terakhir, kotak cari (IP/MAC/nama), tombol **Scan ARP** dan **+ Tambah Perangkat**.
- 4 kartu statistik: IP terpakai, jalur aktif, kamera online, konflik IP (kartu oranye).
- **Peringatan bentrok IP**: tiap item punya label (KONFLIK/RAWAN), penjelasan bahasa sederhana, dan tombol aksi (misal *Pindahkan ke .50*, *Blokir MAC*, *Buat DHCP lease static*).
- Tabel jalur: VLAN, subnet, gateway, port, keluar lewat ISP mana, bar pemakaian.
- Uplink internet (ISP-A/ISP-B, distance, ping) dan aktivitas terbaru.

## 2 · Peta IP per Jalur

- Tab jalur (Kantor/CCTV/Tamu/Manajemen).
- Strip info: subnet, gateway, VLAN·port, pool DHCP, terpakai, **IP kosong berikutnya**.
- **Grid 16×16** (.0–.255). Warna per status:

| Status | Warna | Arti |
|---|---|---|
| Gateway | hijau | IP MikroTik |
| Static | biru | IP manual |
| DHCP lease | biru gelap | IP dari DHCP |
| Reservasi | ungu | dicadangkan di NetMap |
| Konflik | oranye | lebih dari 1 MAC |
| Static di pool DHCP | kuning | rawan bentrok |
| Offline | coklat + teks kuning | terdaftar tapi tidak merespons |
| Kosong | abu gelap | aman dipakai |
| Network/Broadcast | hitam | .0 dan .255, tidak bisa dipakai |

- Klik kotak → panel detail: perangkat, MAC, tipe, port, terakhir terlihat, pesan konflik, tombol aksi sesuai status.
- **Cek IP sebelum dipasang**: ketik IP → aman / sudah dipakai (dengan saran IP kosong) / reservasi / di dalam pool / bukan subnet ini.
- Tabel perangkat static di jalur tersebut + ekspor CSV.

## 3 · Route per Jalur

- Tombol fokus: Semua/Kantor/CCTV/Tamu/Manajemen. Jalur lain jadi redup.
- Topologi: Internet → ISP-A/ISP-B → MikroTik-Core → kartu per jalur (port → switch → cabang/perangkat). Tiap kartu menulis **keluar lewat ISP mana** dan aturan khusus (isolasi, limit).
- **Trace jalur perangkat**: daftar hop bernomor (contoh: kamera → SW-CCTV-02 port 7 → SW-CCTV-Core → MikroTik ether4 → NVR-01 → ISP-B).
- Tabel `/ip route` (hanya-baca; ubah route tetap di Winbox).

## 4 · Live CCTV

- Pilihan tata letak 1 / 2×2 / 3×3 / 4×4 + halaman.
- Filter lokasi (chip dengan jumlah kamera).
- Tile: nama, IP, badge LIVE / TAK STABIL / OFFLINE. Grid memakai **sub-stream**.
- Klik tile → tampilan besar (main-stream): Snapshot, Putar rekaman NVR, Layar penuh, link ke Peta IP & Trace.
- Panel kanan: hitungan online/tak stabil/offline, status NVR (HDD, perkiraan hari rekaman), kamera bermasalah dengan aksi (*Restart PoE port*, *Ping ulang*).

## 5 · Perangkat

- Cari (nama/IP/MAC/lokasi) + filter jalur.
- Tabel: nama, tipe, IP, jalur, MAC, lokasi/port, status, terakhir terlihat.
- Form **Tambah perangkat**: nama, tipe, jalur, IP (dengan validasi & saran), MAC, lokasi/port. Opsi terapkan ke MikroTik: DHCP lease static, ARP static, pantau ping.

## 6 · Log Konflik

- Tab Aktif / Selesai / Semua.
- Jenis: IP duplikat, static di pool DHCP, IP reservasi dipakai, IP di luar subnet (rogue DHCP), MAC pindah port, perangkat baru.
- Klik kejadian → detail: sumber data, kronologi, saran perbaikan, aksi, *Tandai selesai*.

## 7 · Pengaturan

- Koneksi MikroTik: alamat, port, user API, password, SSL, tes koneksi.
- Sinkronisasi: interval + sumber data yang ditarik.
- Aturan deteksi konflik (on/off per aturan, dengan tingkat KONFLIK/RAWAN/INFO).
- Notifikasi Telegram + pemicunya.
- Stream CCTV: URL go2rtc, pola URL RTSP, kredensial viewer kamera, sub/main stream, maksimal stream bersamaan.
- **Pengguna & akses (allowlist login Google):**
  - Form tambah: email Google + peran (Teknisi / Viewer CCTV / Admin) → status **Diundang**. Validasi format & email ganda.
  - Tabel: avatar + nama (dari Google, "(belum pernah login)" kalau masih diundang) + email, peran + penjelasan izin, status (Diundang / Aktif / Nonaktif), login terakhir.
  - Aksi: **Paksa logout** (akun aktif), **Nonaktifkan** / **Aktifkan lagi**. Akun sendiri tidak bisa diubah.
  - Catatan: arti "Diundang", nonaktif = sesi langsung putus, minimal 1 admin aktif, link ke percobaan login yang ditolak.
- Backup harian.

---

## Design token

| Token | Nilai | Pakai untuk |
|---|---|---|
| `bg` | `#0E1116` | latar halaman |
| `sidebar` | `#12161D` | sidebar, kartu dalam |
| `surface` | `#161B22` | kartu |
| `border` | `#232B36` / `#2A3340` | garis kartu / input |
| `text` | `#E6EAF0` | teks utama |
| `muted` | `#9AA6B5` | teks sekunder |
| `accent` | `#4CC2FF` | tombol utama, link |
| Kantor | `#4CC2FF` | warna jalur |
| CCTV | `#FF9A4D` | warna jalur |
| WiFi Tamu | `#B49BFF` | warna jalur |
| Manajemen | `#5FD39A` | warna jalur |
| Konflik | `#FF9A4D` (teks `#1A0F05`) | badge |
| Rawan | `#FFC46B` (teks `#1E1503`) | badge |

- Font: **IBM Plex Sans** (UI) + **JetBrains Mono** (IP, MAC, port, angka).
- Radius kartu 12px, tombol/input 8px. Target sentuh minimal 40–44px.
- Tema gelap (ruang monitoring). Mode terang bisa ditambah nanti.
