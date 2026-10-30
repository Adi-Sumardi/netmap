import { redirect } from "next/navigation";

// Only "Pengguna & akses" exists so far; the other sections come with their phases.
export default function SettingsPage() {
  redirect("/pengaturan/pengguna");
}
