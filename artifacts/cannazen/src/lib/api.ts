const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const BASE = RAW_API_URL
  ? RAW_API_URL.replace(/\/$/, "") + "/api"
  : (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, credentials: "include", headers });
  let body: any = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || res.statusText;
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

export const apiGet = <T = any>(path: string) => api<T>(path);
export const apiPost = <T = any>(path: string, data?: any) => api<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) });
export const apiPut = <T = any>(path: string, data?: any) => api<T>(path, { method: "PUT", body: JSON.stringify(data ?? {}) });
export const apiDelete = <T = any>(path: string) => api<T>(path, { method: "DELETE" });
