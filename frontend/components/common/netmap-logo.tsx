import { cn } from "@/lib/utils";

export function NetmapLogo({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const icon = size === "lg" ? 40 : 28;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-primary"
        aria-hidden="true"
      >
        <circle cx="14" cy="6" r="3" />
        <circle cx="6" cy="21" r="3" />
        <circle cx="22" cy="21" r="3" />
        <path d="M14 9v5M14 14l-6 5M14 14l6 5" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className={cn("font-bold", size === "lg" ? "text-xl" : "text-base")}>NetMap</span>
        <span className="text-muted-foreground text-xs">IP &amp; CCTV Manager</span>
      </div>
    </div>
  );
}
