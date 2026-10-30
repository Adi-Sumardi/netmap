# Models (Eloquent)

## Daftar model

| Model | Tabel | Keterangan |
|---|---|---|
| `Router` | `routers` | MikroTik yang dihubungkan (siap multi-router) |
| `Segment` | `segments` | Jalur/VLAN: subnet, gateway, pool, warna |
| `Device` | `devices` | Perangkat terdaftar (static/lease static) |
| `IpReservation` | `ip_reservations` | Range IP yang dicadangkan |
| `ArpObservation` | `arp_observations` | Riwayat IP↔MAC dari ARP (first_seen/last_seen) |
| `DhcpLease` | `dhcp_leases` | Snapshot lease DHCP terakhir |
| `MacLocation` | `mac_locations` | MAC ada di switch/port mana |
| `RouterRoute` | `router_routes` | Snapshot `/ip route` |
| `NetworkSwitch` | `network_switches` | Switch (managed/unmanaged), relasi ke `Device` |
| `Camera` | `cameras` | Detail kamera (stream, grup lokasi, NVR) |
| `Nvr` | `nvrs` | Detail NVR (kapasitas, retensi) |
| `ConflictEvent` | `conflict_events` | Event konflik/rawan/info |
| `ConflictEventLog` | `conflict_event_logs` | Timeline per event |
| `AuditLog` | `audit_logs` | Jejak semua aksi tulis |
| `Setting` | `settings` | Konfigurasi key-value (sebagian terenkripsi) |
| `User` | `users` | Allowlist pengguna login Google + peran (spatie). Kolom: `email` (unik, lowercase), `name`, `google_id` (unik, null sampai login pertama), `avatar_url`, `status` (`UserStatus`: invited/active/disabled — nonaktif = `disabled`, tidak ada kolom terpisah), `remember_token` (hanya dipakai peran `cctv_viewer`), `last_login_at`, `last_login_ip`. **Tanpa kolom password** |

## Relasi utama

```
Router 1─* Segment 1─* Device 1─0..1 Camera *─1 Nvr(Device)
Segment 1─* IpReservation
Segment 1─* ArpObservation / DhcpLease / ConflictEvent
Device 1─0..1 MacLocation        NetworkSwitch 1─* MacLocation
ConflictEvent 1─* ConflictEventLog
User 1─* AuditLog
```

## Aturan

- Semua model `final`, `declare(strict_types=1)`, `$fillable` eksplisit (tidak memakai `$guarded = []`).
- Gunakan method `casts()` (Laravel 11+):

```php
protected function casts(): array
{
    return [
        'type' => DeviceType::class,
        'status' => DeviceStatus::class,
        'monitor_ping' => 'boolean',
        'last_seen_at' => 'immutable_datetime',
        'meta' => 'array',
    ];
}
```

- **Enum PHP backed** di `app/Enums/` untuk semua nilai tetap: `DeviceType` (camera, nvr, switch, access_point, server, pc, printer, router, other), `IpStatus` (gateway, static, dhcp, reserved, conflict, risk, offline, free, network), `ConflictType` (dup_ip, res_misuse, reg_mismatch, static_in_pool, out_of_subnet, mac_flap, new_device, cam_offline), `Severity` (conflict, risk, info), `ConflictStatus` (active, resolved), `Role` (admin, technician, cctv_viewer), `UserStatus` (invited, active, disabled). Enum punya method `label(): string` berbahasa Indonesia untuk UI.
- Kolom `inet`/`macaddr` dibaca sebagai string. Validasi & normalisasi di Form Request, bukan di accessor.
- Query yang dipakai ulang → **local scope**: `Device::inSegment($segment)`, `Device::orderByIp()`, `ArpObservation::recent(minutes: 10)`, `ConflictEvent::active()`.
- Query IP pakai operator Postgres lewat scope (`whereRaw('ip << ?::cidr', [$subnet])`), jangan filter di PHP.
- Logika bisnis **tidak** di model (taruh di Action/Service). Model boleh punya helper kecil yang murni (`$segment->containsIp($ip)`, `$segment->poolRange()`).
- Tidak memakai observer untuk efek samping ke MikroTik. Efek samping eksplisit di Action.
- Soft delete hanya untuk `Device` dan `IpReservation` (supaya riwayat konflik tetap bisa ditautkan).
- Factory untuk semua model, dipakai di test & seeder demo (data contoh sesuai desain: 4 jalur, 48 kamera, dst.).
- Jangan eager-load berlebihan. Resource memakai `whenLoaded()`.
