# 06 · Live CCTV

## Masalah utama

Kamera IP dan NVR umumnya mengirim video lewat **RTSP**, sedangkan browser **tidak bisa** memutar RTSP langsung. Perlu converter di mini PC.

## Solusi: go2rtc

```
Kamera (RTSP :554) ──► go2rtc di mini PC ──► WebRTC / MSE ──► <video> di dashboard
```

- Ringan, satu binary / container. Mendukung WebRTC (latensi rendah), MSE, HLS, dan snapshot JPEG.
- Hanya membuka koneksi ke kamera **saat ada yang menonton** (on-demand).
- Bisa juga mengambil stream dari NVR kalau kamera tidak bisa diakses langsung.

### Contoh `go2rtc.yaml`

```yaml
api:
  listen: "127.0.0.1:1984"   # hanya diakses backend/reverse proxy, bukan langsung dari LAN
webrtc:
  listen: ":8555"
streams:
  cam_gda_01_sub:  rtsp://viewer:PASS@192.168.20.11:554/stream2
  cam_gda_01_main: rtsp://viewer:PASS@192.168.20.11:554/stream1
  # ... dibuat otomatis oleh backend dari tabel `kamera`
```

> Pola URL RTSP berbeda per merek (Hikvision `/Streaming/Channels/101` & `102`, Dahua `/cam/realmonitor?channel=1&subtype=0|1`, dan lain-lain). Simpan **pola per merek** di Pengaturan, lalu backend menghasilkan konfigurasi go2rtc lewat API-nya.

## Aturan pemakaian stream

- **Grid (2×2 ke atas) → sub-stream** (±640×360, bitrate kecil).
- **Satu kamera diperbesar → main-stream** (1080p).
- Batasi **maksimal stream bersamaan** (default 16) supaya CPU mini PC dan bandwidth VLAN CCTV aman.
- Tile di luar layar/halaman lain → stream ditutup.

## Status & kesehatan

- `fping` ke semua kamera tiap 30 detik → online/offline.
- go2rtc API `/api/streams` → stream yang sedang aktif + jumlah penonton.
- Status "TAK STABIL" = kamera online tapi stream sering putus atau terkait event `DUP_IP`.
- NVR: kapasitas HDD & status rekam diambil lewat API NVR (ISAPI Hikvision / HTTP API Dahua) bila tersedia. Kalau tidak tersedia, cukup status ping.

## Putar rekaman

Tahap awal: tombol **Putar rekaman NVR** membuka antarmuka web NVR. Integrasi playback langsung (RTSP playback dengan parameter waktu) masuk tahap lanjutan.

## Keamanan

- Pakai **akun viewer** di kamera/NVR, bukan admin.
- Firewall MikroTik: dari mini PC ke VLAN 20 hanya TCP 554 + ICMP (dan port API NVR jika dipakai).
- Peran **Viewer CCTV** di dashboard hanya bisa membuka layar Live CCTV.
- Akses dari luar kantor lewat **WireGuard**. Jangan port-forward 554/8555 ke internet.
