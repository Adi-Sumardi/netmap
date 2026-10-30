// Mirrors the Laravel API Resources in backend/app/Http/Resources/V1.

export type RoleCode = "admin" | "technician" | "cctv_viewer";

export type PermissionCode =
  | "view-network"
  | "manage-devices"
  | "manage-reservations"
  | "resolve-conflicts"
  | "view-cctv"
  | "mikrotik-write"
  | "manage-settings"
  | "manage-users";

export type UserStatusCode = "invited" | "active" | "disabled";

export type Me = {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: RoleCode | null;
  role_label: string | null;
  roles: RoleCode[];
  permissions: PermissionCode[];
  home_path: string;
};

export type User = {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  status: UserStatusCode;
  status_label: string;
  role: RoleCode | null;
  role_label: string | null;
  role_description: string | null;
  has_signed_in: boolean;
  last_login_at: string | null;
  is_self: boolean;
  created_at: string | null;
};
