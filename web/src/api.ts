const ACCESS_KEY = "pinger.access";
const REFRESH_KEY = "pinger.refresh";

export type Tokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type Me = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  api_key?: string;
};

export type Monitor = {
  id: number;
  user_id: string;
  name: string;
  type: string;
  target: string;
  interval: number;
  timeout: number;
  confirmations: number;
  enabled: boolean;
  created_at: string;
  next_check_at: string;
  last_status?: boolean | null;
  last_latency?: number | null;
  last_checked_at?: string;
  uptime_1h?: number | null;
  notifications?: Notification[];
};

export type Check = {
  id: number;
  monitor_id: number;
  status: boolean;
  status_code?: number | null;
  latency?: number | null;
  error?: string;
  checked_at: string;
};

export type Notification = {
  id: number;
  user_id: string;
  type: string;
  config: string;
  enabled: boolean;
};

export type StatusPage = {
  id: number;
  user_id: string;
  name: string;
  slug: string;
  public: boolean;
  monitors?: Monitor[];
};

export type PublicStatusPage = {
  name: string;
  slug: string;
  monitors: Monitor[];
};

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(tokens: Tokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || data.status || res.statusText;
  } catch {
    return res.statusText || "request failed";
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(path, { ...init, headers });

  if (auth && res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`);
      res = await fetch(path, { ...init, headers });
    }
  }

  if (!res.ok) {
    throw new Error(await readError(res));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const tokens = await api<Tokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refresh }),
    });
    saveTokens(tokens);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export function register(email: string, username: string, password: string) {
  return api<Tokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
}

export function login(loginName: string, password: string) {
  return api<Tokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginName, password }),
  });
}

export function me() {
  return api<Me>("/api/v1/me", {}, true);
}

export function updateMe(body: {
  email?: string;
  username?: string;
  password?: string;
  current_password?: string;
  regenerate_api_key?: boolean;
}) {
  return api<Me>("/api/v1/me", { method: "PATCH", body: JSON.stringify(body) }, true);
}

export const monitors = {
  list: () => api<Monitor[]>("/api/v1/monitors", {}, true),
  get: (id: number) => api<Monitor>(`/api/v1/monitors/${id}`, {}, true),
  create: (body: unknown) =>
    api<Monitor>("/api/v1/monitors", { method: "POST", body: JSON.stringify(body) }, true),
  update: (id: number, body: unknown) =>
    api<Monitor>(`/api/v1/monitors/${id}`, { method: "PATCH", body: JSON.stringify(body) }, true),
  remove: (id: number) =>
    api<unknown>(`/api/v1/monitors/${id}`, { method: "DELETE" }, true),
  checks: (id: number) => api<Check[]>(`/api/v1/monitors/${id}/checks`, {}, true),
  attachNotification: (id: number, notificationId: number) =>
    api<unknown>(`/api/v1/monitors/${id}/notifications`, {
      method: "POST",
      body: JSON.stringify({ id: notificationId }),
    }, true),
  detachNotification: (id: number, notificationId: number) =>
    api<unknown>(`/api/v1/monitors/${id}/notifications/${notificationId}`, { method: "DELETE" }, true),
};

export const notifications = {
  list: () => api<Notification[]>("/api/v1/notifications", {}, true),
  create: (body: unknown) =>
    api<Notification>("/api/v1/notifications", { method: "POST", body: JSON.stringify(body) }, true),
  update: (id: number, body: unknown) =>
    api<Notification>(`/api/v1/notifications/${id}`, { method: "PATCH", body: JSON.stringify(body) }, true),
  remove: (id: number) =>
    api<unknown>(`/api/v1/notifications/${id}`, { method: "DELETE" }, true),
};

export const statusPages = {
  list: () => api<StatusPage[]>("/api/v1/status-pages", {}, true),
  get: (id: number) => api<StatusPage>(`/api/v1/status-pages/${id}`, {}, true),
  create: (body: unknown) =>
    api<StatusPage>("/api/v1/status-pages", { method: "POST", body: JSON.stringify(body) }, true),
  update: (id: number, body: unknown) =>
    api<StatusPage>(`/api/v1/status-pages/${id}`, { method: "PATCH", body: JSON.stringify(body) }, true),
  remove: (id: number) =>
    api<unknown>(`/api/v1/status-pages/${id}`, { method: "DELETE" }, true),
  attachMonitor: (id: number, monitorId: number) =>
    api<unknown>(`/api/v1/status-pages/${id}/monitors`, {
      method: "POST",
      body: JSON.stringify({ id: monitorId }),
    }, true),
  detachMonitor: (id: number, monitorId: number) =>
    api<unknown>(`/api/v1/status-pages/${id}/monitors/${monitorId}`, { method: "DELETE" }, true),
  public: (slug: string) => api<PublicStatusPage>(`/api/public/s/${encodeURIComponent(slug)}`),
};
