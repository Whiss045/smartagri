// One fetch wrapper for the whole app: JSON in/out, cookie included, errors normalised.
export class ApiError extends Error {
  status: number;
  code?: string; // stable backend code, mapped to Arabic in labels.ts
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// AuthProvider registers a callback so any 401 logs the user out everywhere
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "include", // sends the httpOnly session cookie
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Network error", "NETWORK");
  }

  if (res.status === 204) return undefined as T; // success with no body
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth/login"))
      onUnauthorized?.();
    throw new ApiError(res.status, data?.message ?? res.statusText, data?.code);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: (path: string) => request<void>("DELETE", path),
};

// Builds "?a=1&b=2" and skips undefined/false values
export function qs(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== false) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
