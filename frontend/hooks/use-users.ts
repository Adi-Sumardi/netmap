"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiEnvelope } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { RoleCode, User } from "@/types/api";

const USERS_KEY = ["users"] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => api<ApiEnvelope<User[]>>("/api/v1/users").then((response) => response.data),
  });
}

function useUserMutation<TVariables>(
  request: (variables: TVariables) => Promise<{ message?: string }>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
      if (response.message) {
        notify.success(response.message);
      }
    },
  });
}

export type CreateUserInput = { email: string; role: RoleCode; name?: string };

export function useCreateUser() {
  return useUserMutation((input: CreateUserInput) =>
    api<ApiEnvelope<User>>("/api/v1/users", { method: "POST", body: input }),
  );
}

export function useUpdateUser() {
  return useUserMutation(({ id, ...changes }: { id: number; role?: RoleCode; enabled?: boolean }) =>
    api<ApiEnvelope<User>>(`/api/v1/users/${id}`, { method: "PATCH", body: changes }),
  );
}

export function useRevokeSessions() {
  return useUserMutation((id: number) =>
    api<{ message: string }>(`/api/v1/users/${id}/revoke-sessions`, { method: "POST" }),
  );
}

export function useDeleteUser() {
  return useUserMutation((id: number) =>
    api<{ message: string }>(`/api/v1/users/${id}`, { method: "DELETE" }),
  );
}
