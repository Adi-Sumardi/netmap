# NetMap — panduan untuk AI agent

Sebelum menulis kode, baca [`rules/README.md`](rules/README.md) lalu file aturan yang relevan. `rules/` mengalahkan `docs/` untuk urusan kode. Kalau aturan perlu berubah, ubah file aturannya di perubahan yang sama.

- Desain (8 layar): https://claude.ai/artifact/St4Z7yFNYPsRhBpEVnqZgu — detail di `docs/02-desain-ui.md`.
- Kode bahasa Inggris, teks UI bahasa Indonesia.
- `frontend/` memakai Next.js 16: baca `frontend/AGENTS.md` dan `frontend/node_modules/next/dist/docs/` sebelum memakai API Next.
- shadcn di sini berbasis Base UI (prop `render`, bukan `asChild`).
- Backend test memakai PostgreSQL `netmap_test` (bukan SQLite) karena skema memakai `inet`/`cidr`/`macaddr`.

Perintah cek sebelum selesai:

```bash
cd backend  && ./vendor/bin/pest && ./vendor/bin/phpstan analyse && ./vendor/bin/pint --test
cd frontend && npm run typecheck && npm run lint && npm run format:check
```
