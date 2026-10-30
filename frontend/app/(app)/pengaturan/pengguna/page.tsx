import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { UsersSettings } from "@/components/settings/users-settings";

export const metadata: Metadata = { title: "Pengguna & akses" };

export default function UsersSettingsPage() {
  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <PageHeader
        title="Pengaturan"
        description="Koneksi MikroTik, aturan konflik, notifikasi, dan CCTV menyusul di tahap berikutnya."
      />
      <UsersSettings />
    </div>
  );
}
