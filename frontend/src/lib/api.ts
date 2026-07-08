const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const UNAUTHORIZED_EVENT = "app_financiera:unauthorized";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("app_financiera_token");
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("app_financiera_token", token);
  } else {
    localStorage.removeItem("app_financiera_token");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = body?.error ?? `Error ${response.status}`;

    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(response.status, message);
  }

  return body as T;
}

/**
 * Descarga un archivo (no-JSON) autenticado y dispara el guardado en el
 * navegador. Usa fetch directo en vez de request<T>() porque la respuesta es
 * un CSV, no JSON.
 */
async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { headers, cache: "no-store" });

  if (!response.ok) {
    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, `Error ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  download: downloadFile,
};
