# System Features

Daftar fitur NetMap dengan **kriteria selesai**. Tahap mengikuti [`../docs/07-roadmap.md`](../docs/07-roadmap.md). Fitur dianggap selesai hanya jika semua kriteria terpenuhi + ada test.

## Tahap 1 — Read-only (IPAM inti)

### F1. Koneksi & sinkronisasi MikroTik
- Admin mengisi alamat, port, user, password, lalu **Tes koneksi** menampilkan versi RouterOS atau error yang jelas.
- Job `SyncMikrotikJob` berjalan sesuai interval (default 30 detik), menarik: address, pool, dhcp network, lease, arp, interface, bridge host, route, mangle.
- Kalau MikroTik tidak bisa dihubungi: data terakhir tetap tampil, banner "MikroTik tidak terhubung sejak …", dan tidak membuat event konflik palsu.
- Waktu sinkron terakhir tampil di header Ringkasan.

### F2. Jalur (segments)
- Jalur dibuat otomatis dari `/ip address` + `/interface vlan`, lalu admin bisa memberi nama, warna, range static, dan "keluar lewat".
- Pemakaian per jalur dihitung dari perangkat + lease + ARP aktif.

### F3. Peta IP
- Grid 256 kotak per jalur dengan status sesuai [design.md](design.md#status--satu-sumber).
- Klik kotak → detail (perangkat, MAC, tipe, port, terakhir terlihat, catatan konflik).
- **IP kosong berikutnya** dari range static jalur.
- **Cek IP**: hasil < 300 ms untuk: kosong, dipakai (+saran), reservasi, di dalam pool, gateway/network/broadcast, di luar jalur.

### F4. Perangkat & reservasi
- CRUD perangkat (nama, tipe, jalur, IP, MAC, lokasi/switch/port, pantau ping, catatan).
- Menolak IP yang sudah dipakai perangkat lain di jalur yang sama (409) dan menyarankan IP kosong.
- CRUD reservasi range, tidak boleh tumpang tindih.
- Cari & filter, ekspor/impor CSV.

### F5. Route & topologi
- Topologi: ISP (dari interface + route) → router → jalur (port, VLAN) → switch → ringkasan perangkat.
- Kolom "keluar lewat" dari route + mangle routing-mark.
- Trace per perangkat: perangkat → port switch (bridge host/SNMP/manual) → router → tujuan (NVR/ISP).
- Tabel route read-only.

### F6. Ringkasan
- 4 statistik, daftar peringatan aktif (maks 5 + "lihat semua"), tabel jalur, uplink ISP, 10 aktivitas terbaru.

### F7. Login dengan Google (allowlist) & peran
- Tombol **Masuk dengan Google** satu-satunya cara login. Alur lengkap: [security.md](security.md#autentikasi--login-dengan-google-allowlist).
- Email yang **belum didaftarkan admin** ditolak dengan pesan jelas, tidak dibuat akun baru, dan percobaan tercatat di audit log.
- Admin mengelola allowlist di Pengaturan → Pengguna & akses: tambah email + peran, ubah peran, nonaktifkan (sesi langsung putus), paksa logout. Status tampil: Diundang (belum pernah login) / Aktif / Nonaktif, plus login terakhir.
- Minimal 1 admin aktif selalu ada. Admin tidak bisa menonaktifkan dirinya sendiri.
- Peran admin/technician/cctv_viewer sesuai matriks [security.md](security.md#otorisasi).
- Akses via domain HTTPS (`https://netmap.<domain-kantor>`) karena syarat redirect URI Google.
- Jalur darurat `php artisan netmap:emergency-login` saat internet mati.

## Tahap 2 — Deteksi konflik & notifikasi

### F8. Riwayat ARP & scanner
- `arp_observations` diperbarui tiap sinkron.
- `ScanSegmentJob`: `arping -D` per jalur (manual via tombol **Scan ARP**, dan terjadwal tiap 10 menit).
- `PingDevicesJob`: `fping` perangkat dengan `monitor_ping = true` tiap 30 detik.

### F9. Rule engine
- Aturan: `dup_ip`, `res_misuse`, `reg_mismatch`, `static_in_pool`, `out_of_subnet`, `mac_flap` (opsional SNMP), `new_device`, `cam_offline`. Logika: [`../docs/05-deteksi-konflik.md`](../docs/05-deteksi-konflik.md).
- Tiap aturan bisa on/off di Pengaturan.
- Satu event aktif per (jenis, jalur, IP). Kejadian ulang menambah timeline.
- Event selesai otomatis bila kondisi hilang ≥ 15 menit, atau manual oleh pengguna berizin.

### F10. Log Konflik
- Tab Aktif/Selesai/Semua, detail dengan sumber, kronologi, saran perbaikan, tombol aksi.
- Badge jumlah konflik aktif di sidebar, diperbarui real-time.

### F11. Notifikasi
- Telegram: konflik baru, kamera offline > 5 menit, ISP failover, ringkasan harian (opsional).
- Tombol **Kirim notifikasi tes**.
- Toast warning di dashboard untuk event yang sama.
- Anti-spam: notifikasi untuk event yang sama maksimal 1× per 30 menit.

### F12. Webhook
- Lease-script → perangkat baru muncul < 5 detik.
- Netwatch → status uplink berubah < 15 detik.

## Tahap 3 — Live CCTV

### F13. Kamera & NVR
- Kamera = perangkat bertipe `camera` + data stream (pola RTSP per merek, channel, grup lokasi, NVR).
- Backend menghasilkan config go2rtc lewat API-nya. Kredensial tidak keluar ke browser.

### F14. Live view
- Grid 1/4/9/16 + halaman, filter lokasi, badge LIVE/TAK STABIL/OFFLINE.
- Grid = sub-stream, diperbesar = main-stream. Maks stream bersamaan sesuai setting.
- Tile hanya memutar saat terlihat, stream ditutup saat ditinggalkan.
- Snapshot, buka rekaman NVR (link ke web NVR), layar penuh.
- Panel: hitungan status, status NVR (HDD, perkiraan hari rekaman bila API NVR tersedia), kamera bermasalah.

### F15. Peran Viewer CCTV
- Hanya melihat Live CCTV, langsung diarahkan ke `/cctv` setelah login.

## Tahap 4 — Aksi tulis ke MikroTik

### F16. Aksi
- Buat DHCP lease static, tambah ARP static, blokir/buka blokir MAC, restart PoE port, sinkron & scan manual.
- Semua butuh flag `MIKROTIK_WRITE_ENABLED`, izin `mikrotik-write`, `AlertDialog`, dan tercatat di audit log dengan `comment netmap:` di MikroTik.
- Gagal di MikroTik → tidak ada perubahan di DB NetMap, toast error berisi pesan RouterOS yang dirapikan.

### F17. Audit log
- Daftar aksi dengan filter user/aksi/tanggal. Tidak bisa diubah/dihapus.

### F18. Backup
- Harian 02:00: `pg_dump` + `/export` MikroTik (lewat REST/SSH) ke volume backup, rotasi 14 hari.
- Tombol **Backup sekarang** & **Unduh backup** (admin).

## Lintas fitur (berlaku di semua tahap)

- Semua teks UI bahasa Indonesia, sesuai [design.md](design.md).
- Semua aksi memberi umpan balik: toast sukses/error, atau toast konfirmasi/AlertDialog sesuai [components.md](components.md).
- Responsif sampai lebar 360px tanpa scroll horizontal halaman.
- Halaman pertama tampil < 2 detik di LAN. Grid IP 256 kotak dan grid 16 kamera tetap lancar.
- Semua endpoint tercakup feature test termasuk otorisasi per peran.
