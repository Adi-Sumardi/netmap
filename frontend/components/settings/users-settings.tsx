"use client";

import { Ellipsis, Lock } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/hooks/use-me";
import { useDeleteUser, useRevokeSessions, useUpdateUser, useUsers } from "@/hooks/use-users";
import { formatLastSeen, initialOf } from "@/lib/format";
import { confirmToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { RoleCode, User, UserStatusCode } from "@/types/api";
import { AddUserForm, ROLE_OPTIONS } from "./add-user-form";

const STATUS_STYLE: Record<UserStatusCode, string> = {
  invited: "bg-status-dhcp text-status-dhcp-fg",
  active: "bg-status-online-bg text-status-online-fg",
  disabled: "bg-status-offline text-status-offline-fg",
};

const AVATAR_COLORS = [
  "bg-segment-office",
  "bg-segment-cctv",
  "bg-segment-guest",
  "bg-segment-mgmt",
  "bg-status-risk",
];

type PendingConfirm =
  | { kind: "disable"; user: User }
  | { kind: "delete"; user: User }
  | { kind: "role"; user: User; role: RoleCode };

export function UsersSettings() {
  const canManage = useCan("manage-users");
  const users = useUsers();
  const updateUser = useUpdateUser();
  const revokeSessions = useRevokeSessions();
  const deleteUser = useDeleteUser();
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  if (!canManage) {
    return (
      <section className="bg-card flex items-center gap-3 rounded-xl border p-6 text-sm">
        <Lock className="text-muted-foreground size-4" aria-hidden="true" />
        Hanya admin yang bisa mengatur pengguna &amp; akses.
      </section>
    );
  }

  return (
    <section aria-labelledby="users-heading" className="bg-card overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-1 px-5 pt-5">
        <h2 id="users-heading" className="text-base font-semibold">
          Pengguna &amp; akses
        </h2>
        <p className="text-muted-foreground text-[13px]">
          Login hanya dengan Google. Hanya email di daftar ini yang bisa masuk, email lain otomatis
          ditolak.
        </p>
      </div>

      <div className="p-5">
        <AddUserForm />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="text-muted-foreground text-left text-xs">
              <th className="px-5 py-2.5 font-medium">Pengguna</th>
              <th className="px-2.5 py-2.5 font-medium">Peran</th>
              <th className="px-2.5 py-2.5 font-medium">Status</th>
              <th className="px-2.5 py-2.5 font-medium">Login terakhir</th>
              <th className="px-5 py-2.5 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.isPending ? <SkeletonRows /> : null}
            {users.isError ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center">
                  <span className="text-muted-foreground">{users.error.message} </span>
                  <Button variant="link" onClick={() => void users.refetch()}>
                    Coba lagi
                  </Button>
                </td>
              </tr>
            ) : null}
            {users.data?.map((user, index) => (
              <tr
                key={user.id}
                className={cn("border-t", user.status === "disabled" && "opacity-70")}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
                      ) : null}
                      <AvatarFallback
                        className={cn(
                          "text-background font-bold",
                          AVATAR_COLORS[index % AVATAR_COLORS.length],
                        )}
                      >
                        {initialOf(user.name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-semibold">
                        {user.name ?? (
                          <span className="text-muted-foreground font-normal">
                            (belum pernah login)
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground truncate font-mono text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-2.5 py-3">
                  <span className="block">{user.role_label}</span>
                  <span className="text-muted-foreground block text-[11px]">
                    {user.role_description}
                  </span>
                </td>
                <td className="px-2.5 py-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
                      STATUS_STYLE[user.status],
                    )}
                  >
                    {user.status_label}
                  </span>
                </td>
                <td className="text-muted-foreground px-2.5 py-3 whitespace-nowrap">
                  {user.has_signed_in ? formatLastSeen(user.last_login_at) : "Belum pernah"}
                </td>
                <td className="px-5 py-3">
                  {user.is_self ? (
                    <span className="text-muted-foreground block text-right text-xs">
                      Akun kamu
                    </span>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {user.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            confirmToast({
                              title: `Paksa logout ${user.email}?`,
                              description: "Semua sesinya diputus. Dia tetap bisa login lagi.",
                              confirmLabel: "Paksa logout",
                              onConfirm: () => revokeSessions.mutateAsync(user.id),
                            })
                          }
                        >
                          Paksa logout
                        </Button>
                      ) : null}
                      {user.status === "disabled" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-info-border text-primary"
                          onClick={() =>
                            confirmToast({
                              title: `Aktifkan lagi ${user.email}?`,
                              confirmLabel: "Aktifkan",
                              onConfirm: () =>
                                updateUser.mutateAsync({ id: user.id, enabled: true }),
                            })
                          }
                        >
                          Aktifkan lagi
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-warn-border text-warn-fg"
                          onClick={() => setPending({ kind: "disable", user })}
                        >
                          Nonaktifkan
                        </Button>
                      )}
                      <UserRowMenu
                        user={user}
                        onChangeRole={(role) => setPending({ kind: "role", user, role })}
                        onDelete={() => setPending({ kind: "delete", user })}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 border-t px-5 py-3.5 text-xs">
        <span>
          <span className="text-foreground font-semibold">Diundang</span> = email sudah didaftarkan,
          belum pernah login
        </span>
        <span>Menonaktifkan akun langsung memutus semua sesinya</span>
        <span>Minimal harus ada 1 admin aktif</span>
      </div>

      <PendingConfirmDialog
        pending={pending}
        onClose={() => setPending(null)}
        onDisable={(user) => updateUser.mutateAsync({ id: user.id, enabled: false })}
        onDelete={(user) => deleteUser.mutateAsync(user.id)}
        onChangeRole={(user, role) => updateUser.mutateAsync({ id: user.id, role })}
      />
    </section>
  );
}

function UserRowMenu({
  user,
  onChangeRole,
  onDelete,
}: {
  user: User;
  onChangeRole: (role: RoleCode) => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Aksi lain untuk ${user.email}`} />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ubah peran</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={user.role ?? undefined}
            onValueChange={(value) => {
              if (value !== user.role) {
                onChangeRole(value as RoleCode);
              }
            }}
          >
            {ROLE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {!user.has_signed_in ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Hapus undangan
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingConfirmDialog({
  pending,
  onClose,
  onDisable,
  onDelete,
  onChangeRole,
}: {
  pending: PendingConfirm | null;
  onClose: () => void;
  onDisable: (user: User) => Promise<unknown>;
  onDelete: (user: User) => Promise<unknown>;
  onChangeRole: (user: User, role: RoleCode) => Promise<unknown>;
}) {
  if (pending === null) {
    return (
      <ConfirmDialog
        open={false}
        onOpenChange={onClose}
        title=""
        description=""
        confirmLabel=""
        onConfirm={async () => {}}
      />
    );
  }

  const email = <span className="text-foreground font-mono">{pending.user.email}</span>;
  const roleLabel =
    pending.kind === "role"
      ? ROLE_OPTIONS.find((option) => option.value === pending.role)?.label
      : "";

  const content = {
    disable: {
      title: "Nonaktifkan akun ini?",
      description: (
        <>
          {email} tidak bisa masuk lagi dan semua sesinya langsung diputus. Bisa diaktifkan lagi
          kapan saja.
        </>
      ),
      confirmLabel: "Nonaktifkan",
      destructive: true,
      run: () => onDisable(pending.user),
    },
    delete: {
      title: "Hapus undangan?",
      description: <>{email} dihapus dari daftar akses dan tidak bisa masuk dengan Google.</>,
      confirmLabel: "Hapus undangan",
      destructive: true,
      run: () => onDelete(pending.user),
    },
    role: {
      title: `Ubah peran jadi ${roleLabel}?`,
      description: <>Izin {email} langsung berubah sesuai peran baru.</>,
      confirmLabel: "Ubah peran",
      destructive: false,
      run: () =>
        pending.kind === "role" ? onChangeRole(pending.user, pending.role) : Promise.resolve(),
    },
  }[pending.kind];

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={content.title}
      description={content.description}
      confirmLabel={content.confirmLabel}
      destructive={content.destructive}
      onConfirm={content.run}
    />
  );
}

function SkeletonRows() {
  return Array.from({ length: 3 }, (_, index) => (
    <tr key={index} className="border-t">
      <td className="px-5 py-3" colSpan={5}>
        <Skeleton className="h-8 w-full" />
      </td>
    </tr>
  ));
}
