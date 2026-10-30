# 05 · Deteksi Konflik

## Kenapa tidak cukup dari satu snapshot

Tabel ARP MikroTik hanya menyimpan **satu MAC per IP**. Kalau dua perangkat memakai IP yang sama, entri ARP akan **berganti-ganti MAC**. Satu kali tarik data tidak cukup untuk melihat bentrok. Karena itu NetMap memakai tiga sumber:

1. **Riwayat ARP** (`arp_history`): IP yang sama terlihat dengan MAC berbeda dalam jendela waktu tertentu.
2. **Scan aktif** dari mini PC: `arping -D -I eth0.20 192.168.20.31`. Kalau ada lebih dari satu balasan, berarti duplikat.
3. **Perbandingan dengan data NetMap**: perangkat terdaftar, reservasi, pool DHCP, subnet jalur.

## Aturan

| Kode | Aturan | Tingkat | Sumber | Logika |
|---|---|---|---|---|
| `DUP_IP` | Satu IP dipakai >1 MAC | KONFLIK | arp_history, arping | ≥2 MAC berbeda untuk IP yang sama dalam 10 menit, **atau** arping -D dapat >1 balasan |
| `RES_MISUSE` | IP reservasi dipakai perangkat lain | KONFLIK | arp + reservasi | IP aktif berada di range reservasi dan MAC-nya bukan milik reservasi tersebut |
| `REG_MISMATCH` | IP perangkat terdaftar dipakai MAC lain | KONFLIK | arp + perangkat | IP = perangkat terdaftar, MAC berbeda |
| `STATIC_IN_POOL` | IP static di dalam pool DHCP | RAWAN | arp + lease + pool | IP aktif di dalam pool **tanpa** lease (dynamic maupun static) |
| `OUT_OF_SUBNET` | IP di luar subnet jalurnya | RAWAN | arp | IP di interface `vlanX` tidak termasuk subnet jalur X (indikasi rogue DHCP / router liar) |
| `MAC_FLAP` | MAC pindah port | RAWAN | bridge host / SNMP | MAC terlihat di port akses berbeda dalam 15 menit |
| `NEW_DEVICE` | Perangkat baru | INFO | lease, arp | MAC belum pernah terlihat. Jalur WiFi Tamu otomatis ditandai normal |
| `CAM_OFFLINE` | Kamera tidak merespons | RAWAN | fping | Gagal ping ≥5 menit berturut-turut |

Semua aturan bisa dinyalakan/dimatikan di **Pengaturan → Aturan deteksi konflik**.

## Siklus event

```
terdeteksi ──► AKTIF ──(kondisi hilang ≥15 mnt)──► SELESAI otomatis
                 │
                 └──(admin klik "Tandai selesai" / aksi perbaikan)──► SELESAI
```

- Satu event per kombinasi `(kode, jalur, ip)` yang masih aktif. Kejadian ulang menambah baris timeline, bukan event baru.
- Setiap event menyimpan: kronologi, sumber data, MAC yang terlibat, saran perbaikan, siapa yang menutup.
- Notifikasi Telegram dikirim saat event **dibuka** (tingkat sesuai pengaturan) dan saat **selesai**.

## Saran perbaikan otomatis

| Kode | Saran | Aksi tombol |
|---|---|---|
| `DUP_IP` | Pindahkan perangkat tak dikenal / blokir MAC, kunci perangkat sah dengan lease static | *Blokir MAC*, *Pindahkan ke {IP kosong}* |
| `RES_MISUSE` | Pindahkan perangkat ke IP di luar reservasi | *Pindahkan ke {IP kosong}* |
| `STATIC_IN_POOL` | Buat lease static untuk MAC ini, atau pindahkan ke luar pool | *Buat DHCP lease static* |
| `OUT_OF_SUBNET` | Cari perangkat (lihat port), matikan port / cabut router liar | *Lihat lokasi port* |
| `MAC_FLAP` | Cek kabel/loop; perbarui lokasi di inventaris | *Perbarui lokasi* |
| `CAM_OFFLINE` | Restart PoE port, cek kabel | *Restart PoE port*, *Ping ulang* |

## Pencegahan (sebelum bentrok)

- **Cek IP sebelum dipasang** (Peta IP): validasi terhadap ARP aktif, lease, perangkat terdaftar, reservasi, pool, gateway/network/broadcast.
- **Saran IP kosong berikutnya** per jalur dari range static yang ditentukan (misal CCTV: .50–.99).
- Form Tambah Perangkat menolak IP yang bentrok dan menyarankan lease static.
