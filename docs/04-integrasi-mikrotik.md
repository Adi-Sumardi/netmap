# 04 · Integrasi MikroTik

Target: **RouterOS v7** (REST API tersedia sejak v7.1). Contoh IP router: `10.10.99.1`, mini PC: `10.10.99.5`.

## 1. Siapkan user & akses API

```routeros
# group khusus, tahap awal cukup baca saja
/user group add name=netmap-ro policy=read,api,rest-api
/user add name=netmap-api group=netmap-ro password=GANTI_PASSWORD address=10.10.99.5/32

# sertifikat self-signed untuk HTTPS
/certificate add name=netmap-ca common-name=netmap-ca key-usage=key-cert-sign,crl-sign
/certificate sign netmap-ca
/certificate add name=router-https common-name=10.10.99.1
/certificate sign router-https ca=netmap-ca

# aktifkan REST API (www-ssl), hanya dari mini PC
/ip service set www-ssl disabled=no certificate=router-https address=10.10.99.5/32
```

Tes dari mini PC:

```bash
curl -k -u netmap-api:PASSWORD https://10.10.99.1/rest/system/resource
curl -k -u netmap-api:PASSWORD https://10.10.99.1/rest/ip/arp
```

> `-k` hanya untuk tes. Di aplikasi, ekspor sertifikat `netmap-ca` lalu pakai sebagai CA tepercaya.

## 2. Endpoint yang ditarik

| Endpoint REST | Isinya | Dipakai di | Interval |
|---|---|---|---|
| `GET /rest/system/resource` | versi, uptime, CPU | status router | 60 dtk |
| `GET /rest/interface` | status port (ether1/ether2 = ISP) | Uplink ISP, Route | 30 dtk |
| `GET /rest/interface/vlan` | daftar VLAN | jalur | 5 mnt |
| `GET /rest/ip/address` | subnet & gateway per VLAN | jalur, Peta IP | 5 mnt |
| `GET /rest/ip/pool` | range pool | deteksi static di pool | 5 mnt |
| `GET /rest/ip/dhcp-server/network` | gateway/DNS per pool | jalur | 5 mnt |
| `GET /rest/ip/dhcp-server/lease` | IP DHCP + MAC + host-name | Peta IP, Perangkat | 30 dtk |
| `GET /rest/ip/arp` | IP aktif + MAC | deteksi konflik, perangkat tak dikenal | 30 dtk |
| `GET /rest/interface/bridge/host` | MAC ada di port MikroTik mana | trace | 60 dtk |
| `GET /rest/ip/route` | tabel route | Route per Jalur | 60 dtk |
| `GET /rest/ip/firewall/mangle` | routing-mark per subnet | Route per Jalur ("keluar lewat") | 5 mnt |
| `GET /rest/tool/netwatch` (opsional) | status host yang dipantau | Uplink ISP | 30 dtk |

Tips: pakai `?.proplist=address,mac-address,interface` untuk mengurangi ukuran respons.

## 3. Event real-time (webhook)

Supaya perangkat baru langsung muncul tanpa menunggu poll, tambahkan lease-script di DHCP server:

```routeros
/ip dhcp-server set [find] lease-script=":do {/tool fetch url=\"http://10.10.99.5:8080/hook/lease?mac=\$leaseActMAC&ip=\$leaseActIP&bound=\$leaseBound&server=\$leaseServerName\" keep-result=no} on-error={}"
```

Opsional: netwatch untuk ISP, lalu kirim event saat down/up:

```routeros
/tool netwatch add host=8.8.8.8 interval=10s comment=ISP-A \
  down-script="/tool fetch url=\"http://10.10.99.5:8080/hook/netwatch?name=ISP-A&status=down\" keep-result=no" \
  up-script="/tool fetch url=\"http://10.10.99.5:8080/hook/netwatch?name=ISP-A&status=up\" keep-result=no"
```

Endpoint webhook di mini PC **wajib** menerima hanya dari IP `10.10.99.1`, plus token rahasia di query string.

## 4. Lokasi port di switch (SNMP)

`/interface/bridge/host` hanya tahu port MikroTik sendiri. Untuk "SW-CCTV-02 port 7":

- Switch **managed**: aktifkan SNMP v2c/v3 (read-only), baca `BRIDGE-MIB::dot1dTpFdbTable` / `Q-BRIDGE-MIB::dot1qTpFdbTable` (MAC → port).
- Abaikan port uplink (port yang melihat banyak MAC) supaya lokasi yang dicatat adalah port akses.
- Switch **unmanaged**: lokasi diisi manual lewat form Perangkat.

## 5. Aksi tulis (tahap 4)

Ganti group user ke yang punya `write`:

```routeros
/user group add name=netmap-rw policy=read,write,api,rest-api
/user set netmap-api group=netmap-rw
```

| Aksi di UI | Request REST |
|---|---|
| Buat DHCP lease static | `POST /rest/ip/dhcp-server/lease/make-static` body `{".id":"*1A"}`, lalu `PATCH /rest/ip/dhcp-server/lease/*1A` `{"address":"192.168.10.120","comment":"Printer-Lt2"}` |
| Tambah lease static baru | `PUT /rest/ip/dhcp-server/lease` `{"address":"…","mac-address":"…","server":"dhcp-cctv","comment":"…"}` |
| Tambah ARP static | `PUT /rest/ip/arp` `{"address":"…","mac-address":"…","interface":"vlan20"}` |
| Blokir MAC | `PUT /rest/interface/bridge/filter` `{"chain":"forward","src-mac-address":"…/FF:FF:FF:FF:FF:FF","action":"drop","comment":"netmap-block"}` |
| Restart PoE port (jika port PoE di MikroTik) | `PATCH /rest/interface/ethernet/<id>` `{"poe-out":"off"}` lalu `{"poe-out":"auto-on"}` |

Semua aksi tulis: konfirmasi di UI, catat di `audit_log`, dan beri komentar `netmap:` di objek MikroTik supaya mudah dilacak.

## 6. Pustaka (Laravel)

- REST: `Http::baseUrl('https://10.10.99.1/rest')->withBasicAuth(...)->withOptions(['verify' => storage_path('certs/netmap-ca.crt')])->timeout(5)->retry(2, 300)`. Dibungkus di `App\Services\Mikrotik\MikrotikClient` (lihat [`../rules/controllers.md`](../rules/controllers.md#mikrotikclient)).
- Alternatif API biner (port 8729): `evilfreelancer/routeros-api-php`. Pakai hanya kalau REST tidak tersedia.
- SNMP: ekstensi PHP `snmp`.

## 7. DNS lokal untuk login Google

Login Google butuh nama domain (bukan IP). Tambahkan di MikroTik:

```routeros
/ip dns static add name=netmap.<domain-kantor> address=10.10.99.5
```

Lalu Caddy menerbitkan sertifikat Let's Encrypt lewat DNS-01 challenge untuk domain tersebut.
