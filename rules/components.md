# Components

## Dasar

- Pakai komponen **shadcn/ui** (`npx shadcn@latest add …`). Hasilnya ada di `frontend/components/ui/` dan **boleh** diubah gayanya, tapi jangan ubah API-nya tanpa alasan.
- shadcn di project ini berbasis **Base UI**, bukan Radix:
  - Komposisi elemen lewat prop **`render`**, bukan `asChild`: `<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="…" />}>`.
  - `Select` butuh prop `items={[{ value, label }]}` supaya `<SelectValue />` menampilkan label.
- Ukuran `Button`/`Input`/`SelectTrigger` sudah dinaikkan ke tinggi 40px (default), 36px (`sm`), 48px (`lg`) sesuai target sentuh. Jangan dikembalikan ke ukuran bawaan shadcn.
- Komponen domain di `frontend/components/<domain>/` (misal `components/ip-map/ip-grid.tsx`).
- Satu komponen per file, nama file `kebab-case.tsx`, nama komponen `PascalCase`.
- Props diketik eksplisit (`type IpGridProps = {...}`), tanpa `any`.
- Komponen presentasional tidak memanggil API. Data masuk lewat props atau hook di level halaman/fitur.

## Komponen shadcn yang dipakai

`button`, `input`, `label`, `select`, `switch`, `checkbox`, `textarea`, `form`, `card`, `badge`, `table`, `tabs`, `toggle-group`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `popover`, `command` (cari global), `tooltip`, `skeleton`, `separator`, `scroll-area`, `sonner`.

## Komponen domain (wajib dipakai ulang)

| Komponen | Lokasi | Dipakai di |
|---|---|---|
| `AppShell`, `AppSidebar` | `components/layout/` | semua halaman |
| `StatCard` | `components/dashboard/` | Ringkasan, Live CCTV |
| `StatusBadge` | `components/status/` | semua tabel & detail |
| `SegmentDot`, `SegmentTabs` | `components/segment/` | Peta IP, Route, Perangkat |
| `IpGrid`, `IpCell`, `IpDetailPanel`, `IpChecker` | `components/ip-map/` | Peta IP |
| `TopologyLane`, `TopologyNode`, `TraceTimeline` | `components/topology/` | Route per Jalur |
| `CameraGrid`, `CameraTile`, `CameraPlayer`, `NvrStatus` | `components/cctv/` | Live CCTV |
| `ConflictCard`, `ConflictDetail`, `ConflictTimeline` | `components/conflict/` | Ringkasan, Log Konflik |
| `DeviceTable`, `DeviceForm` | `components/device/` | Perangkat |
| `SettingsSection`, `SettingToggle` | `components/settings/` | Pengaturan |
| `Mono` | `components/common/` | pembungkus teks IP/MAC (font mono) |
| `EmptyState`, `ErrorState` | `components/common/` | semua daftar |

## Toast — alert

Pakai `sonner` lewat `frontend/lib/toast.ts` (jangan panggil `toast` langsung dari banyak tempat dengan gaya berbeda):

```ts
// frontend/lib/toast.ts
import { toast } from "sonner";

export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  error: (title: string, description?: string) => toast.error(title, { description, duration: 8000 }),
  warning: (title: string, description?: string) => toast.warning(title, { description }),
  info: (title: string, description?: string) => toast.info(title, { description }),
  promise: toast.promise,
};
```

Aturan:

- `<Toaster richColors position="top-right" closeButton />` dipasang **sekali** di root layout.
- **Sukses** setelah aksi berhasil ("Perangkat disimpan"). **Error** berisi pesan dari API (`message`), bukan stack trace.
- Event real-time penting (konflik baru, kamera offline, ISP failover) tampil sebagai toast **warning** dengan tombol "Lihat" → halaman terkait.
- Error validasi form tampil **di field**, bukan toast. Toast hanya untuk ringkasan ("Periksa 2 isian yang salah").
- Maksimal satu toast per aksi. Jangan menumpuk toast untuk polling.

## Toast — konfirmasi

Untuk aksi yang **tidak merusak dan bisa dibatalkan** (tandai konflik selesai, ping ulang, jadikan reservasi, ekspor), pakai toast konfirmasi dengan tombol aksi + batal:

```ts
// frontend/lib/toast.ts (lanjutan)
export function confirmToast(opts: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown> | void;
}) {
  toast(opts.title, {
    description: opts.description,
    duration: 10000,
    action: {
      label: opts.confirmLabel ?? "Ya, lanjutkan",
      onClick: () => {
        const result = opts.onConfirm();
        if (result instanceof Promise) {
          toast.promise(result, { loading: "Memproses…", success: "Berhasil", error: (e) => e.message ?? "Gagal" });
        }
      },
    },
    cancel: { label: "Batal", onClick: () => {} },
  });
}
```

## Dialog konfirmasi (AlertDialog)

Untuk aksi yang **mengubah MikroTik atau menghapus data**, wajib `AlertDialog`, bukan toast:

- Buat DHCP lease static, tambah ARP static, **blokir MAC**, restart PoE port, hapus perangkat/reservasi, ubah koneksi MikroTik.
- Isi dialog: apa yang akan dilakukan, target (IP/MAC/port dalam mono), dan dampaknya ("Perangkat dengan MAC ini tidak akan bisa terhubung").
- Tombol utama bernada `destructive` untuk blokir/hapus. Fokus awal di tombol **Batal**.
- Setelah berhasil → toast sukses. Gagal → toast error + dialog ditutup.

Komponen pembungkus: `components/common/confirm-dialog.tsx` (`<ConfirmDialog title description confirmLabel destructive onConfirm>`).

## Form

- react-hook-form + zod + komponen `Form` shadcn. Skema zod di `frontend/lib/schemas/`.
- Error 422 dari Laravel dipetakan ke field (`setError`) lewat helper `applyServerErrors(form, error)`.
- Tombol submit menampilkan status loading dan di-disable selama request.
- Field IP memakai `IpInput` (validasi format + cek live ke `/api/v1/ip-check` dengan debounce 300ms, menampilkan hasil seperti desain: aman / sudah dipakai + saran / reservasi / di dalam pool).

## Tabel

- Pola shadcn Data Table (TanStack Table): sorting, filter, pagination server-side bila data >200 baris.
- Kolom IP & MAC memakai `Mono`, status memakai `StatusBadge`.
- Wajib punya state: loading (`Skeleton` baris), kosong (`EmptyState`), error (`ErrorState` + tombol coba lagi).

## Loading & kosong

- Halaman pertama kali: skeleton sesuai bentuk layout, bukan spinner layar penuh.
- Refetch latar belakang (polling/real-time) **tidak** menampilkan skeleton lagi.
- Teks kosong menjelaskan langkah berikutnya: "Belum ada perangkat di jalur ini. Tambah perangkat atau jalankan Scan ARP."
