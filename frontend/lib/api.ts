export type ApiEnvelope<T> = { data: T; message?: string };

type ApiErrorBody = {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1];

  return value === undefined ? null : decodeURIComponent(value);
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCookie("XSRF-TOKEN") === null) {
    await fetch("/sanctum/csrf-cookie", { credentials: "include" });
  }
}

/**
 * The one client for the Laravel API. Same origin (Caddy or the Next dev proxy),
 * so the Sanctum session cookie is sent automatically.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";

  if (method !== "GET") {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const xsrf = readCookie("XSRF-TOKEN");

  if (xsrf !== null) {
    headers["X-XSRF-TOKEN"] = xsrf;
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;

  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "include",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch {
    throw new ApiError(0, "network_error", "Tidak bisa terhubung ke server NetMap.");
  }

  if (response.status === 419) {
    throw new ApiError(
      419,
      "csrf_mismatch",
      "Sesi keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.",
    );
  }

  const body = (await response.json().catch(() => null)) as (ApiErrorBody & T) | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.code ?? "error",
      body?.message ?? "Terjadi kesalahan. Coba lagi.",
      body?.errors ?? {},
    );
  }

  return body as T;
}
