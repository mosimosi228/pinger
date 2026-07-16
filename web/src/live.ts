import { t } from "./i18n";

export type StatusEvent = {
  type: string;
  id: number;
  user_id: string;
  status: boolean;
  latency?: number | null;
  checked_at: string;
  enabled: boolean;
  uptime_1h?: number | null;
};

function wsURL(path: string): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}

export function connectUserLive(token: string, onEvent: (e: StatusEvent) => void): () => void {
  return connect(`${wsURL("/api/v1/ws")}?token=${encodeURIComponent(token)}`, onEvent);
}

export function connectSlugLive(slug: string, onEvent: (e: StatusEvent) => void): () => void {
  return connect(wsURL(`/api/public/ws/s/${encodeURIComponent(slug)}`), onEvent);
}

function connect(url: string, onEvent: (e: StatusEvent) => void): () => void {
  let closed = false;
  let ws: WebSocket | null = null;
  let retry = 0;
  let timer: number | undefined;

  const open = () => {
    if (closed) return;
    ws = new WebSocket(url);
    ws.onopen = () => {
      retry = 0;
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as StatusEvent;
        if (data?.type === "monitor.status" && data.id != null) onEvent(data);
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      if (closed) return;
      const delay = Math.min(15000, 1000 * 2 ** retry);
      retry += 1;
      timer = window.setTimeout(open, delay);
    };
    ws.onerror = () => {
      ws?.close();
    };
  };

  open();

  return () => {
    closed = true;
    if (timer) window.clearTimeout(timer);
    ws?.close();
  };
}

function badgeHTML(enabled: boolean, status: boolean | null): string {
  if (!enabled) return `<span class="badge badge-off">${esc(t("badge_off"))}</span>`;
  if (status === true) return `<span class="badge badge-up">${esc(t("badge_up"))}</span>`;
  if (status === false) return `<span class="badge badge-down">${esc(t("badge_down"))}</span>`;
  return `<span class="badge badge-off">${esc(t("badge_pending"))}</span>`;
}

function formatUptime(v: number): string {
  if (v >= 99.95) return "100";
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Update table rows marked with data-monitor-id. */
export function applyStatusEvent(root: ParentNode, ev: StatusEvent): void {
  root.querySelectorAll<HTMLElement>(`[data-monitor-id="${ev.id}"]`).forEach((row) => {
    const statusEl = row.querySelector(".js-status");
    if (statusEl) {
      const status = ev.enabled ? ev.status : null;
      statusEl.innerHTML = badgeHTML(ev.enabled, status);
    }
    const latencyEl = row.querySelector(".js-latency");
    if (latencyEl) {
      latencyEl.textContent = ev.latency != null ? `${ev.latency} ms` : "—";
    }
    const checkedEl = row.querySelector(".js-checked");
    if (checkedEl) {
      checkedEl.textContent = ev.checked_at || "—";
    }
    const uptimeEl = row.querySelector(".js-uptime");
    if (uptimeEl) {
      if (ev.enabled && ev.status && ev.uptime_1h != null) {
        uptimeEl.textContent = `${formatUptime(ev.uptime_1h)}%`;
      } else {
        uptimeEl.textContent = "—";
      }
    }
  });

  const summary = root.querySelector(".js-embed-summary");
  if (summary) {
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-monitor-id]"));
    let anyDown = false;
    const any = rows.length > 0;
    rows.forEach((row) => {
      if (row.querySelector(".badge-down")) anyDown = true;
    });
    if (!any) summary.textContent = t("no_monitors_short");
    else if (anyDown) summary.textContent = t("some_down");
    else summary.textContent = t("all_operational");
  }
}
