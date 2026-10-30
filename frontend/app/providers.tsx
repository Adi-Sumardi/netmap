"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          window.location.pathname !== "/login"
        ) {
          window.location.replace("/login");
        }
      },
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && [401, 403, 404, 422].includes(error.status)) &&
          failureCount < 2,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
