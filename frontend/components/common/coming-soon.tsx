import { PageHeader } from "@/components/common/page-header";

/**
 * Placeholder for screens that exist in the design but are built in a later phase (docs/07-roadmap.md).
 */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} description={description} />
      <section className="bg-card flex flex-col gap-2 rounded-xl border p-6">
        <span className="text-subtle-foreground text-sm font-semibold">{phase}</span>
        <p className="text-muted-foreground text-sm">
          Layar ini sudah ada di desain dan akan dibangun di tahap tersebut. Lihat
          docs/07-roadmap.md.
        </p>
      </section>
    </div>
  );
}
