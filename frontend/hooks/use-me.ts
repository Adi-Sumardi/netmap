"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiEnvelope } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { Me, PermissionCode } from "@/types/api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<ApiEnvelope<Me>>("/api/v1/me").then((response) => response.data),
    staleTime: 60_000,
  });
}

export function useCan(permission: PermissionCode): boolean {
  const { data } = useMe();

  return data?.permissions.includes(permission) ?? false;
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api<{ message: string }>("/api/v1/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      window.location.replace("/login");
    },
    onError: (error) => notify.apiError(error),
  });
}
