"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "@/hooks/use-users";
import { ApiError } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { RoleCode } from "@/types/api";

export const ROLE_OPTIONS: { value: RoleCode; label: string }[] = [
  { value: "technician", label: "Teknisi" },
  { value: "cctv_viewer", label: "Viewer CCTV" },
  { value: "admin", label: "Admin" },
];

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email Google wajib diisi.")
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Format email belum benar."),
  role: z.enum(["technician", "cctv_viewer", "admin"]),
});

type FormValues = z.infer<typeof schema>;

export function AddUserForm() {
  const createUser = useCreateUser();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "technician" },
  });
  const emailError = form.formState.errors.email?.message;

  async function submit(values: FormValues) {
    try {
      await createUser.mutateAsync({ email: values.email.toLowerCase(), role: values.role });
      form.reset({ email: "", role: values.role });
    } catch (error) {
      const serverEmailError = error instanceof ApiError ? error.errors.email?.[0] : undefined;

      if (serverEmailError) {
        form.setError("email", { message: serverEmailError });
      } else {
        notify.apiError(error);
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      aria-label="Tambah email ke daftar akses"
      className="bg-panel flex flex-wrap items-start gap-3 rounded-lg border p-4"
      noValidate
    >
      <div className="flex min-w-60 flex-[2_1_240px] flex-col gap-1.5">
        <Label htmlFor="user-email" className="text-subtle-foreground text-xs">
          Email Google
        </Label>
        <Input
          id="user-email"
          type="email"
          autoComplete="off"
          placeholder="nama@gmail.com"
          className="font-mono text-[13px]"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "user-email-error" : undefined}
          {...form.register("email")}
        />
        {emailError ? (
          <span id="user-email-error" className="text-warn-fg text-xs">
            {emailError}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-40 flex-[1_1_160px] flex-col gap-1.5">
        <Label htmlFor="user-role" className="text-subtle-foreground text-xs">
          Peran
        </Label>
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Select
              items={ROLE_OPTIONS}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button type="submit" className="mt-[22px]" disabled={createUser.isPending}>
        {createUser.isPending ? "Menambahkan…" : "+ Tambahkan"}
      </Button>
    </form>
  );
}
