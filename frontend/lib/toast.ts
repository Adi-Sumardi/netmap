import { toast } from "sonner";
import { ApiError } from "@/lib/api";

/**
 * Toast alerts. Use these instead of calling sonner directly (rules/components.md).
 */
export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  error: (title: string, description?: string) =>
    toast.error(title, { description, duration: 8000 }),
  warning: (title: string, description?: string) => toast.warning(title, { description }),
  info: (title: string, description?: string) => toast.info(title, { description }),
  apiError: (error: unknown, fallback = "Terjadi kesalahan. Coba lagi.") =>
    toast.error(error instanceof Error ? error.message : fallback, { duration: 8000 }),
};

/**
 * Confirmation toast for actions that are harmless and reversible.
 * Anything that changes MikroTik or deletes data uses <ConfirmDialog> instead.
 */
export function confirmToast(options: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown> | void;
}) {
  toast(options.title, {
    description: options.description,
    duration: 10000,
    action: {
      label: options.confirmLabel ?? "Ya, lanjutkan",
      onClick: () => {
        const result = options.onConfirm();

        if (result instanceof Promise) {
          toast.promise(result, {
            loading: "Memproses…",
            success: (data) => messageOf(data) ?? "Berhasil.",
            error: (error: unknown) =>
              error instanceof ApiError ? error.message : "Gagal. Coba lagi.",
          });
        }
      },
    },
    cancel: { label: "Batal", onClick: () => {} },
  });
}

function messageOf(data: unknown): string | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return undefined;
}
