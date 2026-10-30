# 01 · Konsep

## Masalah

- IP perangkat (PC, printer, CCTV, NVR, switch, AP) dicatat manual atau tidak dicatat sama sekali.
- Pemasangan perangkat baru sering memakai IP yang ternyata **sudah dipakai**. Akibatnya kamera putus-sambung, printer hilang, dan sebagainya.
- IP static dipasang **di dalam pool DHCP**, jadi suatu saat DHCP membagikan IP yang sama.
- Tidak ada gambaran **lewat jalur mana** data tiap perangkat mengalir (port, switch, VLAN, ISP).
- Memantau CCTV harus membuka aplikasi/NVR terpisah.

## Tujuan

1. Satu sumber kebenaran untuk semua IP di semua jalur.
2. Mencegah bentrok **sebelum** terjadi (cek IP sebelum dipasang, saran IP kosong).
3. Mendeteksi bentrok **saat** terjadi, lalu memberi notifikasi beserta saran perbaikan.
4. Visualisasi route per jalur dan trace per perangkat.
5. Live view CCTV dalam dashboard yang sama.

## Prinsip

- **MikroTik tetap jadi sumber kebenaran jaringan.** NetMap membaca dari MikroTik, menambah data yang tidak ada di sana (nama, lokasi, reservasi), dan baru menulis ke MikroTik di tahap akhir, dengan izin eksplisit.
- **Lokal dulu.** Semua jalan di mini PC dalam LAN. Akses dari luar hanya lewat VPN (WireGuard di MikroTik).
- **Read-only dulu.** Fitur yang mengubah MikroTik (lease static, blokir MAC, restart PoE) datang paling akhir, dan setiap perubahan dicatat di audit log.
- **Bahasa sederhana di UI.** Pengguna bisa teknisi atau satpam, bukan hanya admin jaringan.

## Rencana jalur (VLAN)

> Nilai di bawah adalah **contoh dari desain**. Sesuaikan dengan konfigurasi MikroTik yang sebenarnya.

| Jalur | VLAN | Subnet | Gateway | Port MikroTik | Keluar lewat | Catatan |
|---|---|---|---|---|---|---|
| Kantor | 10 | 192.168.10.0/24 | .1 | ether3 | ISP-A (failover ISP-B) | Pool DHCP .100–.200, static .2–.99 |
| CCTV | 20 | 192.168.20.0/24 | .1 | ether4 | ISP-B (remote view) | Semua static, terisolasi dari jalur lain |
| WiFi Tamu | 30 | 192.168.30.0/24 | .1 | ether5 | ISP-B, limit 20 Mbps | Pool DHCP .50–.250, internet saja |
| Manajemen | 99 | 10.10.99.0/24 | .1 | bridge-trunk | lokal saja | Switch, AP, mini PC NetMap (.5) |

### Pembagian IP di jalur CCTV (contoh)

| Range | Untuk |
|---|---|
| .1 | Gateway MikroTik |
| .2–.3 | NVR-01, NVR-02 |
| .11–.25 | Kamera Gedung A (SW-CCTV-01) |
| .26–.28 | Kamera Parkir (SW-CCTV-02) |
| .29–.39 | Kamera Gudang (SW-CCTV-02) |
| .40–.49 | **Reservasi** kamera Gedung B (belum dipasang) |
| .50–.54 | Kosong / cadangan |
| .55–.73 | Kamera Gedung C (SW-CCTV-03) |

## Istilah

| Istilah | Arti |
|---|---|
| **Jalur** | Satu segmen jaringan = satu VLAN + satu subnet |
| **Static** | IP yang diset manual di perangkat |
| **DHCP lease** | IP yang dibagikan otomatis oleh MikroTik |
| **Lease static** | IP DHCP yang dikunci ke MAC tertentu (cara paling aman) |
| **Reservasi** | Range IP yang dicatat di NetMap untuk keperluan tertentu (misal kamera Gedung B) |
| **Konflik** | Satu IP dipakai lebih dari satu MAC |
| **Rawan** | Belum bentrok, tapi berpotensi bentrok (misal static di dalam pool) |
| **Trace** | Urutan perangkat yang dilewati data dari satu perangkat sampai ke internet/NVR |
