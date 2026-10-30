# Rules — NetMap

Aturan pengerjaan NetMap untuk semua yang menulis kode di project ini (developer maupun AI agent). Baca **overview** dulu, lalu file yang relevan dengan bagian yang sedang dikerjakan.

| File | Isi |
|---|---|
| [overview.md](overview.md) | Stack, struktur monorepo, prinsip, urutan prioritas aturan |
| [design.md](design.md) | Token warna, tipografi, layout, status, aksesibilitas, bahasa UI |
| [components.md](components.md) | shadcn/ui, komponen domain, toast alert & toast konfirmasi, form, tabel |
| [formatting.md](formatting.md) | Format tampilan data (IP, MAC, tanggal, angka) + tool formatter |
| [controllers.md](controllers.md) | Controller Laravel tipis, Form Request, Action/Service, Resource |
| [models.md](models.md) | Model Eloquent, relasi, cast, enum, scope |
| [database.md](database.md) | PostgreSQL: penamaan, tipe `inet`/`cidr`/`macaddr`, index, migrasi |
| [views.md](views.md) | Halaman Next.js (App Router), data fetching, real-time, state |
| [security.md](security.md) | Auth, peran, kredensial, webhook, aksi tulis MikroTik, audit |
| [code-style.md](code-style.md) | Gaya kode PHP & TypeScript, penamaan, git & commit |
| [api.md](api.md) | Kontrak REST `/api/v1`, error, pagination, webhook, event real-time |
| [system-features.md](system-features.md) | Daftar fitur + kriteria selesai per tahap |

Dokumen konsep & arsitektur ada di [`../docs/`](../docs/). Kalau `rules/` dan `docs/` bertentangan, **`rules/` yang berlaku** untuk kode, dan `docs/` harus diperbarui.
