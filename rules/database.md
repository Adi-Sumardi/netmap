# Database (PostgreSQL)

## Umum

- PostgreSQL **16+**, satu database `netmap`, zona waktu server **UTC**. Semua kolom waktu `timestamptz` (`$table->timestampTz()` / `timestampsTz()`).
- Penamaan: tabel **jamak snake_case bahasa Inggris** (`devices`, `ip_reservations`), kolom snake_case, FK `<tunggal>_id`, pivot urut abjad (`camera_group_camera`).
- Primary key `id` bigint auto (`$table->id()`). Tidak memakai UUID kecuali untuk token publik.
- Semua perubahan skema lewat **migration**. Dilarang mengubah DB manual di server.

## Tipe khusus jaringan (wajib)

| Data | Tipe Postgres | Migration Laravel |
|---|---|---|
| Alamat IP | `inet` | `$table->ipAddress('ip')` (pgsql → `inet`) |
| MAC | `macaddr` | `$table->macAddress('mac')` (pgsql → `macaddr`) |
| Subnet | `cidr` | `DB::statement('ALTER TABLE segments ADD COLUMN subnet cidr NOT NULL')` |
| Data fleksibel | `jsonb` | `$table->jsonb('meta')` |

Laravel belum punya helper `cidr`. Tambahkan lewat `DB::statement` di migration yang sama.

## Index

```sql
-- pencarian "IP mana saja di subnet ini"
CREATE INDEX devices_ip_gist ON devices USING gist (ip inet_ops);
CREATE INDEX arp_observations_ip_gist ON arp_observations USING gist (ip inet_ops);

-- satu perangkat aktif per IP per jalur
CREATE UNIQUE INDEX devices_segment_ip_unique ON devices (segment_id, ip) WHERE deleted_at IS NULL;

-- satu event aktif per (jenis, jalur, ip)
CREATE UNIQUE INDEX conflict_events_active_unique
  ON conflict_events (type, segment_id, ip) WHERE status = 'active';

-- riwayat ARP
CREATE UNIQUE INDEX arp_observations_unique ON arp_observations (segment_id, ip, mac);
CREATE INDEX arp_observations_last_seen ON arp_observations (last_seen_at);
```

- Reservasi tidak boleh tumpang tindih → constraint exclusion:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE ip_reservations
  ADD CONSTRAINT ip_reservations_no_overlap
  EXCLUDE USING gist (segment_id WITH =, inet_range WITH &&) WHERE (deleted_at IS NULL);
```

  (`inet_range` dihitung dari `ip_start`/`ip_end`, disimpan sebagai `int8range` angka IP, atau validasi di aplikasi bila tidak memakai constraint.)

## Query penting (contoh)

```sql
-- IP di subnet jalur
SELECT * FROM devices WHERE ip << '192.168.20.0/24'::cidr;

-- IP dengan >1 MAC dalam 10 menit (kandidat DUP_IP)
SELECT segment_id, ip, array_agg(mac) AS macs
FROM arp_observations
WHERE last_seen_at > now() - interval '10 minutes'
GROUP BY segment_id, ip HAVING count(DISTINCT mac) > 1;

-- IP kosong berikutnya di range
SELECT ('192.168.20.0'::inet + g) AS ip
FROM generate_series(50, 99) g
WHERE NOT EXISTS (SELECT 1 FROM devices d WHERE d.ip = '192.168.20.0'::inet + g AND d.deleted_at IS NULL)
  AND NOT EXISTS (SELECT 1 FROM arp_observations a WHERE a.ip = '192.168.20.0'::inet + g AND a.last_seen_at > now() - interval '1 day')
ORDER BY g LIMIT 1;
```

Query seperti ini ditaruh di scope model atau kelas query di `app/Queries/`, bukan di controller.

## Data snapshot & retensi

- `dhcp_leases`, `router_routes`: **upsert** per sinkron (`upsert()` dengan kunci unik), tandai yang hilang `is_present = false`.
- `arp_observations`: upsert `(segment_id, ip, mac)` → perbarui `last_seen_at`. Hapus baris > 90 hari (job harian).
- `conflict_event_logs`, `audit_logs`: simpan minimal 1 tahun.
- Snapshot mentah tidak disimpan per poll (hanya perubahan), supaya DB kecil.

## Tabel users (login Google)

- Migration bawaan Laravel diubah: **tanpa** kolom `password`, tambah `google_id` (string, unique, nullable), `avatar_url`, `status` (invited/active/disabled), `last_login_at`, `last_login_ip` (`inet`). `remember_token` tetap ada khusus untuk sesi panjang peran `cctv_viewer`.
- Email disimpan lowercase + unique index: `CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));`
- Tabel `password_reset_tokens` bawaan Laravel tidak dipakai (hapus dari migration).
- Session driver **`database`** supaya sesi user bisa dihapus saat dinonaktifkan.

## Migration & seeder

- Satu migration = satu perubahan yang jelas, nama deskriptif (`create_segments_table`, `add_monitor_ping_to_devices_table`).
- Migration wajib bisa `down()` kecuali yang memang tidak bisa dibalik (beri komentar).
- `DatabaseSeeder` hanya data wajib (peran, setting default, email admin pertama dari `NETMAP_INITIAL_ADMIN_EMAIL`).
- `DemoSeeder` terpisah untuk data contoh sesuai desain. **Jangan** dijalankan di produksi.
- Tidak ada data jaringan asli (IP/MAC kantor) di seeder yang di-commit.

## Koneksi & backup

- Kredensial DB hanya di `.env` (tidak di-commit). User aplikasi bukan superuser.
- Backup harian `pg_dump -Fc` ke volume backup + rotasi 14 hari (lihat [system-features.md](system-features.md)).
