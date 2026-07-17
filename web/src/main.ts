import "./styles.css";
import {
  clearTokens,
  getAccessToken,
  login,
  me,
  monitors,
  notifications,
  register,
  saveTokens,
  statusPages,
  updateMe,
  type Check,
  type Me,
  type Monitor,
  type Notification,
  type PublicHourBucket,
  type PublicIncident,
  type PublicMonitor,
  type PublicStatusPage,
  type StatusPage,
} from "./api";
import { applyStatusEvent, connectSlugLive, connectUserLive } from "./live";
import { getLang, LANGS, setLang, t, withLang, type Lang } from "./i18n";

const app = document.querySelector<HTMLDivElement>("#app")!;
let disposeLive: (() => void) | undefined;

function stopLive(): void {
  disposeLive?.();
  disposeLive = undefined;
}

function path(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function go(to: string): void {
  history.pushState({}, "", to);
  void render();
}

window.addEventListener("popstate", () => {
  void render();
});

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function td(label: string, content: string, cls = ""): string {
  const classAttr = cls ? ` class="${cls}"` : "";
  return `<td${classAttr} data-label="${esc(label)}">${content}</td>`;
}

function actionsTd(...buttons: string[]): string {
  return td("", `<div class="row-actions-inner">${buttons.join("")}</div>`, "row-actions");
}

type StatusLike = {
  enabled: boolean;
  last_status?: boolean | null;
  uptime_1h?: number | null;
};

function statusBadge(m: StatusLike): string {
  if (!m.enabled) return `<span class="badge badge-off">${esc(t("badge_off"))}</span>`;
  if (m.last_status === true) return `<span class="badge badge-up">${esc(t("badge_up"))}</span>`;
  if (m.last_status === false) return `<span class="badge badge-down">${esc(t("badge_down"))}</span>`;
  return `<span class="badge badge-off">${esc(t("badge_pending"))}</span>`;
}

/** Show 1h uptime % only when the monitor is currently UP. */
function uptimeCell(m: StatusLike): string {
  if (m.enabled && m.last_status === true && m.uptime_1h != null) {
    return `<span class="js-uptime">${esc(formatUptime(m.uptime_1h))}%</span>`;
  }
  return `<span class="js-uptime">—</span>`;
}

function overallLabel(status: string): string {
  switch (status) {
    case "major_outage":
      return t("status_major");
    case "degraded":
      return t("status_degraded");
    default:
      return t("all_operational");
  }
}

function overallBannerClass(status: string): string {
  switch (status) {
    case "major_outage":
      return "major";
    case "degraded":
      return "degraded";
    default:
      return "ok";
  }
}

function hourBarHTML(hours?: PublicHourBucket[]): string {
  const slots =
    hours && hours.length === 24
      ? hours
      : Array.from({ length: 24 }, () => ({ hour: "", total: 0 } as PublicHourBucket));
  const segs = slots
    .map((b, i) => {
      const ago = 23 - i;
      let cls = "na";
      let tip = t("bar_na");
      if (b.total > 0 && b.uptime_pct != null) {
        const pct = b.uptime_pct;
        if (pct >= 99.5) cls = "ok";
        else if (pct >= 80) cls = "partial";
        else cls = "bad";
        tip = `${formatUptime(pct)}%`;
      }
      const label = `${tip} · ${t("bar_hours_ago").replace("{n}", String(ago))}`;
      return `<span class="hour-seg ${cls}" title="${esc(label)}"></span>`;
    })
    .join("");
  return `<div class="hour-bar" role="img" aria-label="${esc(t("uptime_24h"))}">${segs}</div>`;
}

function sortIncidents(incs: PublicIncident[]): PublicIncident[] {
  return [...incs].sort((a, b) => {
    const aOpen = !a.resolved_at;
    const bOpen = !b.resolved_at;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return b.started_at.localeCompare(a.started_at);
  });
}

function incidentItemHTML(inc: PublicIncident): string {
  const open = !inc.resolved_at;
  const body = (inc.message || inc.title || "").trim() || "—";
  const range = open
    ? `${esc(inc.started_at)} · ${esc(t("incident_ongoing"))}`
    : `${esc(inc.started_at)} → ${esc(inc.resolved_at)}`;
  return `
    <li class="incident-item${open ? " open" : ""}">
      <div class="incident-head">
        <span class="incident-name">${esc(inc.monitor_name)}</span>
        <span class="incident-state">${esc(open ? t("incident_ongoing") : t("incident_resolved"))}</span>
      </div>
      <p class="incident-msg">${esc(body)}</p>
      <p class="incident-time">${range}</p>
    </li>`;
}

function publicComponentsHTML(list: PublicMonitor[]): string {
  return list
    .map(
      (m) => `
      <li class="status-component" data-monitor-id="${m.id}">
        <div class="status-component-top">
          <div class="status-component-title">
            <span class="status-component-name">${esc(m.name)}</span>
            <span class="js-status">${statusBadge(m)}</span>
          </div>
          <div class="status-component-meta">
            <span><span class="meta-k">${esc(t("col_latency"))}</span> <span class="js-latency">${
              m.last_latency != null ? esc(m.last_latency) + " ms" : "—"
            }</span></span>
            <span><span class="meta-k">${esc(t("col_uptime"))}</span> ${uptimeCell(m)}</span>
          </div>
        </div>
        ${hourBarHTML(m.uptime_hours)}
      </li>`,
    )
    .join("");
}

function incidentsHTML(incs: PublicIncident[], limit?: number): string {
  const list = sortIncidents(incs);
  const sliced = limit != null ? list.slice(0, limit) : list;
  if (!sliced.length) return `<p class="list-empty">${esc(t("no_incidents"))}</p>`;
  return `<ul class="incident-list">${sliced.map(incidentItemHTML).join("")}</ul>`;
}

async function refreshPublicHistory(root: ParentNode, slug: string, lang?: Lang): Promise<void> {
  try {
    const page = await statusPages.public(slug);
    const apply = () => {
      const banner = root.querySelector(".js-status-banner");
      const bannerText = root.querySelector(".js-status-banner-text");
      if (banner) {
        banner.classList.remove("ok", "degraded", "major");
        banner.classList.add(overallBannerClass(page.overall_status));
      }
      if (bannerText) bannerText.textContent = overallLabel(page.overall_status);

      (page.monitors || []).forEach((m) => {
        const row = root.querySelector(`[data-monitor-id="${m.id}"]`);
        const bar = row?.querySelector(".hour-bar");
        if (bar) bar.outerHTML = hourBarHTML(m.uptime_hours);
      });

      const incidentsRoot = root.querySelector(".js-incidents");
      if (incidentsRoot) {
        const limitAttr = incidentsRoot.getAttribute("data-limit");
        const limit = limitAttr ? Number(limitAttr) : undefined;
        incidentsRoot.innerHTML = incidentsHTML(page.incidents || [], Number.isFinite(limit) ? limit : undefined);
      }
    };
    if (lang) withLang(lang, apply);
    else apply();
  } catch {
    /* ignore refresh errors */
  }
}

function formatUptime(v: number): string {
  if (v >= 99.95) return "100";
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function langSwitcher(): string {
  const opts = LANGS.map(
    (l) => `<option value="${l.code}" ${getLang() === l.code ? "selected" : ""}>${esc(l.label)}</option>`,
  ).join("");
  return `<select class="lang-select" id="lang-switch" aria-label="${esc(t("language"))}">${opts}</select>`;
}

function bindLang(root: HTMLElement): void {
  root.querySelector<HTMLSelectElement>("#lang-switch")?.addEventListener("change", (e) => {
    setLang((e.target as HTMLSelectElement).value as Lang);
    void render();
  });
}

function nav(active: string): string {
  const items: [string, string][] = [
    ["/", t("nav_dashboard")],
    ["/monitors", t("nav_monitors")],
    ["/notifications", t("nav_alerts")],
    ["/status-pages", t("nav_pages")],
    ["/profile", t("nav_profile")],
  ];
  const current = items.find(([href]) => href === active)?.[1] || t("nav_dashboard");
  const links = items
    .map(
      ([href, label]) =>
        `<a href="${href}" data-link class="nav-link${active === href ? " active" : ""}">${esc(label)}</a>`,
    )
    .join("");
  return `
    <nav class="nav" aria-label="${esc(t("nav_aria"))}">
      <div class="nav-bar">
        <span class="nav-current">${esc(current)}</span>
        <button class="nav-burger" type="button" id="nav-burger" aria-expanded="false" aria-controls="nav-panel" aria-label="${esc(t("menu"))}">
          <span class="nav-burger-lines" aria-hidden="true"></span>
        </button>
      </div>
      <div class="nav-panel" id="nav-panel">
        <div class="nav-tabs">
          ${links}
        </div>
        <button class="btn btn-ghost btn-nav" type="button" id="logout">${esc(t("logout"))}</button>
      </div>
    </nav>
  `;
}

function bindNav(root: HTMLElement): void {
  const navEl = root.querySelector<HTMLElement>(".nav");
  const burger = root.querySelector<HTMLButtonElement>("#nav-burger");
  const setOpen = (open: boolean) => {
    navEl?.classList.toggle("is-open", open);
    burger?.setAttribute("aria-expanded", open ? "true" : "false");
    burger?.setAttribute("aria-label", open ? t("menu_close") : t("menu"));
  };

  burger?.addEventListener("click", () => {
    setOpen(!navEl?.classList.contains("is-open"));
  });

  root.querySelectorAll<HTMLAnchorElement>("a[data-link]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setOpen(false);
      go(a.getAttribute("href") || "/");
    });
  });
  root.querySelector("#logout")?.addEventListener("click", () => {
    clearTokens();
    go("/login");
  });
  bindLang(root);
}

async function confirmDelete(action: () => Promise<unknown>): Promise<boolean> {
  if (!window.confirm(t("confirm_delete"))) return false;
  try {
    await action();
    return true;
  } catch (err) {
    window.alert(err instanceof Error ? err.message : t("delete_failed"));
    return false;
  }
}

function footer(): string {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <p class="site-footer-copy">${esc(t("footer_copy", { year }))}</p>
        <div class="site-footer-links">
          ${langSwitcher()}
          <a href="https://github.com/mosimosi228" target="_blank" rel="noopener noreferrer" class="site-footer-link">
            <svg class="gh-icon" viewBox="0 0 16 16" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>
            mosimosi228
          </a>
          <a href="https://github.com/mosimosi228/pinger" target="_blank" rel="noopener noreferrer" class="site-footer-link">
            ${esc(t("footer_repo"))}
          </a>
        </div>
      </div>
    </footer>
  `;
}

function shell(active: string, body: string, wide = false): string {
  return `
    <div class="shell ${wide ? "shell-wide" : ""}">
      <section class="hero">
        <p class="pulse">${esc(t("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${esc(t("tagline"))}</p>
      </section>
      ${nav(active)}
      ${body}
      ${footer()}
    </div>
  `;
}

function originBase(): string {
  return window.location.origin;
}

function embedSnippets(slug: string): string {
  const base = originBase();
  const script = `<script src="${base}/widget.js" data-slug="${slug}" data-theme="light" data-variant="normal" data-height="auto" data-lang="en" async><\/script>`;
  const scriptMini = `<script src="${base}/widget.js" data-slug="${slug}" data-theme="light" data-variant="mini" data-height="auto" data-lang="en" async><\/script>`;
  return `
    <section class="panel" style="margin-top:1rem">
      <h2>${esc(t("embed"))}</h2>
      <p class="muted">${esc(t("embed_hint"))}</p>
      <div class="embed-box">
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${esc(t("embed_normal"))}</p>
          <pre>${esc(script)}</pre>
        </div>
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${esc(t("embed_mini"))}</p>
          <pre>${esc(scriptMini)}</pre>
        </div>
      </div>
    </section>
  `;
}

/* ---------- auth views ---------- */

function loginView(): string {
  return `
    <div class="shell">
      <section class="hero">
        <p class="pulse">${esc(t("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${esc(t("tagline_login"))}</p>
      </section>
      <section class="panel">
        <h2>${esc(t("login_title"))}</h2>
        <form id="login-form">
          <div class="field"><label>${esc(t("login_field"))}</label><input name="login" required /></div>
          <div class="field"><label>${esc(t("password"))}</label><input name="password" type="password" required /></div>
          <p class="error" id="error"></p>
          <div class="row">
            <button class="btn btn-primary" type="submit">${esc(t("sign_in"))}</button>
            <a href="/register" data-link>${esc(t("create_account"))}</a>
          </div>
        </form>
      </section>
      ${footer()}
    </div>
  `;
}

function registerView(): string {
  return `
    <div class="shell">
      <section class="hero">
        <p class="pulse">${esc(t("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${esc(t("tagline_register"))}</p>
      </section>
      <section class="panel">
        <h2>${esc(t("register_title"))}</h2>
        <form id="register-form">
          <div class="field"><label>${esc(t("email"))}</label><input name="email" type="email" required /></div>
          <div class="field"><label>${esc(t("username"))}</label><input name="username" minlength="3" required /></div>
          <div class="field"><label>${esc(t("password"))}</label><input name="password" type="password" minlength="8" required /></div>
          <p class="error" id="error"></p>
          <div class="row">
            <button class="btn btn-primary" type="submit">${esc(t("register_submit"))}</button>
            <a href="/login" data-link>${esc(t("have_account"))}</a>
          </div>
        </form>
      </section>
      ${footer()}
    </div>
  `;
}

/* ---------- dashboard / monitors ---------- */

function dashboardView(user: Me, list: Monitor[]): string {
  const rows = list
    .map(
      (m) => `
      <tr data-monitor-id="${m.id}">
        ${td(t("col_name"), `<a href="/monitors/${m.id}" data-link>${esc(m.name)}</a>`)}
        ${td(t("col_type"), esc(m.type), "cell-tight")}
        ${td(t("col_target"), esc(m.target))}
        ${td(t("col_status"), statusBadge(m), "cell-tight js-status")}
        ${td(t("col_uptime"), uptimeCell(m), "cell-tight")}
        ${td(t("col_latency"), m.last_latency != null ? esc(m.last_latency) + " ms" : "—", "cell-tight js-latency")}
        ${td(t("col_checked"), esc(m.last_checked_at || "—"), "cell-tight js-checked")}
      </tr>`,
    )
    .join("");

  const empty = t("no_monitors", {
    link: `<a href="/monitors" data-link>${esc(t("create_first"))}</a>`,
  });

  return shell(
    "/",
    `
    <section class="panel">
      <div class="panel-head">
        <h2>${esc(t("hello", { name: user.username }))}</h2>
        <a class="btn btn-primary" href="/monitors" data-link style="text-decoration:none">${esc(t("monitors"))}</a>
      </div>
      ${
        list.length
          ? `<div class="table-wrap"><table class="table"><thead><tr><th>${esc(t("col_name"))}</th><th>${esc(t("col_type"))}</th><th>${esc(t("col_target"))}</th><th>${esc(t("col_status"))}</th><th>${esc(t("col_uptime"))}</th><th>${esc(t("col_latency"))}</th><th>${esc(t("col_checked"))}</th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<p class="list-empty">${empty}</p>`
      }
    </section>
  `,
    true,
  );
}

function monitorsView(list: Monitor[]): string {
  const rows = list
    .map(
      (m) => `
      <tr data-monitor-id="${m.id}">
        ${td(t("col_name"), `<a href="/monitors/${m.id}" data-link>${esc(m.name)}</a>`)}
        ${td(t("col_type"), esc(m.type), "cell-tight")}
        ${td(t("col_target"), esc(m.target))}
        ${td(t("col_interval"), `${esc(m.interval)}s`, "cell-tight")}
        ${td(t("col_status"), statusBadge(m), "cell-tight js-status")}
        ${td(t("col_uptime"), uptimeCell(m), "cell-tight")}
        ${actionsTd(
          `<button class="btn btn-ghost" data-toggle="${m.id}" data-enabled="${m.enabled ? "1" : "0"}" type="button">${esc(
            m.enabled ? t("stop") : t("start"),
          )}</button>`,
          `<button class="btn btn-ghost" data-del="${m.id}" type="button">${esc(t("delete"))}</button>`,
        )}
      </tr>`,
    )
    .join("");

  return shell(
    "/monitors",
    `
    <section class="panel" style="margin-bottom:1rem">
      <h2>${esc(t("new_monitor"))}</h2>
      <form id="monitor-form">
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("col_name"))}</label><input name="name" required placeholder="Google" /></div>
          <div class="field"><label>${esc(t("col_type"))}</label>
            <select name="type"><option>HTTP</option><option>TCP</option><option>ICMP</option></select>
          </div>
        </div>
        <div class="field"><label>${esc(t("target"))}</label><input name="target" required placeholder="${esc(t("placeholder_target"))}" /></div>
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("interval_sec"))}</label><input name="interval" type="number" value="60" min="5" required /></div>
          <div class="field"><label>${esc(t("timeout_sec"))}</label><input name="timeout" type="number" value="10" min="1" required /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("confirmations"))}</label><input name="confirmations" type="number" value="1" min="1" max="20" required /></div>
          <div class="field"><label>${esc(t("enabled"))}</label>
            <select name="enabled"><option value="true">${esc(t("yes"))}</option><option value="false">${esc(t("no"))}</option></select>
          </div>
        </div>
        <p class="muted">${esc(t("confirmations_hint"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${esc(t("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${esc(t("list"))}</h2>
      ${
        list.length
          ? `<div class="table-wrap"><table class="table"><thead><tr><th>${esc(t("col_name"))}</th><th>${esc(t("col_type"))}</th><th>${esc(t("col_target"))}</th><th>${esc(t("col_interval"))}</th><th>${esc(t("col_status"))}</th><th>${esc(t("col_uptime"))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<p class="list-empty">${esc(t("empty"))}</p>`
      }
    </section>
  `,
    true,
  );
}

function monitorDetailView(m: Monitor, checks: Check[], notifs: Notification[]): string {
  const checkRows = checks
    .map(
      (c) => `
      <tr>
        ${td(
          t("col_status"),
          c.status
            ? `<span class="badge badge-up">${esc(t("badge_up"))}</span>`
            : `<span class="badge badge-down">${esc(t("badge_down"))}</span>`,
        )}
        ${td(t("col_code"), String(c.status_code ?? "—"))}
        ${td(t("col_latency"), c.latency != null ? c.latency + " ms" : "—")}
        ${td(t("col_error"), esc(c.error || ""))}
        ${td(t("col_at"), esc(c.checked_at))}
      </tr>`,
    )
    .join("");

  const notifOpts = notifs
    .map(
      (n) =>
        `<option value="${n.id}">${esc(n.type)} #${n.id}${n.enabled ? "" : ` (${t("badge_off")})`}</option>`,
    )
    .join("");
  const attachedRows = (m.notifications || [])
    .map(
      (n) => `
      <tr>
        ${td(t("col_notification"), `${esc(n.type)} #${n.id}`)}
        ${td(t("col_config"), `<code>${esc(n.config)}</code>`)}
        ${td(
          t("col_enabled"),
          n.enabled
            ? `<span class="badge badge-up">${esc(t("badge_on"))}</span>`
            : `<span class="badge badge-off">${esc(t("badge_off"))}</span>`,
        )}
        ${actionsTd(
          `<button class="btn btn-ghost" type="button" data-detach-notif="${n.id}">${esc(t("detach"))}</button>`,
        )}
      </tr>`,
    )
    .join("");

  return shell(
    "/monitors",
    `
    <section class="panel" style="margin-bottom:1rem">
      <div class="panel-head">
        <h2>${esc(m.name)} ${statusBadge(m)}</h2>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-del="${m.id}">${esc(t("delete"))}</button>
          <a href="/monitors" data-link>${esc(t("back"))}</a>
        </div>
      </div>
      <div class="grid two" style="margin-top:1rem">
        <div class="stat"><div class="k">${esc(t("col_type"))}</div><div class="v">${esc(m.type)}</div></div>
        <div class="stat"><div class="k">${esc(t("col_target"))}</div><div class="v">${esc(m.target)}</div></div>
        <div class="stat"><div class="k">${esc(t("col_interval"))}</div><div class="v">${esc(m.interval)}s</div></div>
        <div class="stat"><div class="k">${esc(t("col_uptime"))}</div><div class="v js-uptime">${
          m.enabled && m.last_status === true && m.uptime_1h != null ? `${esc(formatUptime(m.uptime_1h))}%` : "—"
        }</div></div>
        <div class="stat"><div class="k">${esc(t("next_check"))}</div><div class="v">${esc(m.next_check_at)}</div></div>
      </div>
      <form id="monitor-edit" style="margin-top:1.25rem">
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("col_name"))}</label><input name="name" value="${esc(m.name)}" required /></div>
          <div class="field"><label>${esc(t("col_type"))}</label>
            <select name="type">
              ${["HTTP", "TCP", "ICMP"].map((x) => `<option ${x === m.type ? "selected" : ""}>${x}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>${esc(t("target"))}</label><input name="target" value="${esc(m.target)}" required /></div>
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("col_interval"))}</label><input name="interval" type="number" value="${m.interval}" min="5" /></div>
          <div class="field"><label>${esc(t("timeout_sec"))}</label><input name="timeout" type="number" value="${m.timeout}" min="1" /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("confirmations"))}</label><input name="confirmations" type="number" value="${m.confirmations ?? 1}" min="1" max="20" /></div>
          <div class="field"><label>${esc(t("enabled"))}</label>
            <select name="enabled">
              <option value="true" ${m.enabled ? "selected" : ""}>${esc(t("yes"))}</option>
              <option value="false" ${!m.enabled ? "selected" : ""}>${esc(t("no"))}</option>
            </select>
          </div>
        </div>
        <p class="muted">${esc(t("confirmations_hint"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${esc(t("save"))}</button>
      </form>
    </section>
    <section class="panel" style="margin-bottom:1rem">
      <h2>${esc(t("alerts"))}</h2>
      <form id="attach-notif" class="attach-row">
        <div class="field" style="margin-bottom:0">
          <label>${esc(t("alert"))}</label>
          <select name="notification_id">${notifOpts || `<option value="">${esc(t("no_alerts"))}</option>`}</select>
        </div>
        <button class="btn btn-primary" type="submit" ${notifs.length === 0 ? "disabled" : ""}>${esc(t("attach"))}</button>
      </form>
      ${
        attachedRows
          ? `<div class="table-wrap" style="margin-top:1rem"><table class="table"><thead><tr><th>${esc(t("col_notification"))}</th><th>${esc(t("col_config"))}</th><th>${esc(t("col_enabled"))}</th><th></th></tr></thead><tbody>${attachedRows}</tbody></table></div>`
          : `<p class="list-empty">${esc(t("not_attached"))}</p>`
      }
    </section>
    <section class="panel">
      <h2>${esc(t("check_history"))}</h2>
      <p class="muted">${esc(t("check_history_hint"))}</p>
      ${
        checks.length
          ? `<div class="table-wrap"><table class="table"><thead><tr><th>${esc(t("col_status"))}</th><th>${esc(t("col_code"))}</th><th>${esc(t("col_latency"))}</th><th>${esc(t("col_error"))}</th><th>${esc(t("col_at"))}</th></tr></thead><tbody>${checkRows}</tbody></table></div>`
          : `<p class="list-empty">${esc(t("no_checks"))}</p>`
      }
    </section>
  `,
    true,
  );
}

function formatNotifConfig(type: string, raw: string): string {
  try {
    const cfg = JSON.parse(raw) as Record<string, string>;
    if (type === "telegram") {
      const token = cfg.token ? `${cfg.token.slice(0, 8)}…` : "—";
      return `chat: ${esc(cfg.chat_id || "—")} · token: ${esc(token)}`;
    }
    if (type === "webhook") {
      return `url: ${esc(cfg.url || "—")}`;
    }
  } catch {
    /* ignore */
  }
  return esc(raw);
}

function notifConfigFields(type: string): string {
  if (type === "webhook") {
    return `
      <div class="field" data-cfg="webhook">
        <label>${esc(t("webhook_url"))}</label>
        <input name="webhook_url" type="url" placeholder="https://hooks.example.com/pinger" required />
      </div>
    `;
  }
  return `
    <div class="form-row cols-2" data-cfg="telegram">
      <div class="field">
        <label>${esc(t("bot_token"))}</label>
        <input name="telegram_token" type="text" placeholder="123456:AAH..." required autocomplete="off" />
      </div>
      <div class="field">
        <label>${esc(t("chat_id"))}</label>
        <input name="telegram_chat_id" type="text" placeholder="-1001234567890" required />
      </div>
    </div>
  `;
}

function notificationsView(list: Notification[]): string {
  const rows = list
    .map(
      (n) => `
      <tr>
        ${td(t("col_type"), `${esc(n.type)} #${n.id}`)}
        ${td(t("col_config"), formatNotifConfig(n.type, n.config))}
        ${td(
          t("col_enabled"),
          n.enabled
            ? `<span class="badge badge-up">${esc(t("badge_on"))}</span>`
            : `<span class="badge badge-off">${esc(t("badge_off"))}</span>`,
        )}
        ${actionsTd(
          `<button class="btn btn-ghost" data-toggle="${n.id}" data-enabled="${n.enabled ? "1" : "0"}" type="button">${esc(
            n.enabled ? t("disable") : t("enable"),
          )}</button>`,
          `<button class="btn btn-ghost" data-del="${n.id}" type="button">${esc(t("delete"))}</button>`,
        )}
      </tr>`,
    )
    .join("");

  return shell(
    "/notifications",
    `
    <section class="panel" style="margin-bottom:1rem">
      <h2>${esc(t("new_alert"))}</h2>
      <form id="notif-form">
        <div class="field"><label>${esc(t("type"))}</label>
          <select name="type" id="notif-type">
            <option value="telegram">Telegram</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
        <div id="notif-fields">${notifConfigFields("telegram")}</div>
        <div class="field"><label>${esc(t("enabled"))}</label>
          <select name="enabled">
            <option value="true">${esc(t("yes"))}</option>
            <option value="false">${esc(t("no"))}</option>
          </select>
        </div>
        <p class="muted" id="notif-hint">${esc(t("hint_telegram"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${esc(t("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${esc(t("list"))}</h2>
      ${
        list.length
          ? `<div class="table-wrap"><table class="table"><thead><tr><th>${esc(t("col_type"))}</th><th>${esc(t("col_config"))}</th><th>${esc(t("col_enabled"))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<p class="list-empty">${esc(t("empty"))}</p>`
      }
    </section>
  `,
    true,
  );
}

function buildNotifConfig(type: string, fd: FormData): string {
  if (type === "webhook") {
    return JSON.stringify({ url: String(fd.get("webhook_url") || "").trim() });
  }
  return JSON.stringify({
    token: String(fd.get("telegram_token") || "").trim(),
    chat_id: String(fd.get("telegram_chat_id") || "").trim(),
  });
}

function bindNotifTypeSwitch(root: HTMLElement): void {
  const select = root.querySelector<HTMLSelectElement>("#notif-type");
  const fields = root.querySelector("#notif-fields");
  const hint = root.querySelector("#notif-hint");
  if (!select || !fields) return;

  const sync = () => {
    const type = select.value;
    fields.innerHTML = notifConfigFields(type);
    if (hint) {
      hint.textContent = type === "webhook" ? t("hint_webhook") : t("hint_telegram");
    }
  };
  select.addEventListener("change", sync);
}

function statusPagesView(list: StatusPage[]): string {
  const rows = list
    .map(
      (sp) => `
      <tr>
        ${td(t("col_name"), `<a href="/status-pages/${sp.id}" data-link>${esc(sp.name)}</a>`)}
        ${td(t("col_slug"), esc(sp.slug))}
        ${td(t("col_visibility"), sp.public ? esc(t("public_label")) : esc(t("private")))}
        ${td(t("col_link"), sp.public ? `<a href="/s/${esc(sp.slug)}" data-link>/s/${esc(sp.slug)}</a>` : "—")}
        ${actionsTd(`<button class="btn btn-ghost" data-del="${sp.id}" type="button">${esc(t("delete"))}</button>`)}
      </tr>`,
    )
    .join("");

  return shell(
    "/status-pages",
    `
    <section class="panel" style="margin-bottom:1rem">
      <h2>${esc(t("new_status_page"))}</h2>
      <form id="sp-form">
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("col_name"))}</label><input name="name" required /></div>
          <div class="field"><label>${esc(t("col_slug"))}</label><input name="slug" required pattern="[a-z0-9\\-]+" placeholder="my-status" /></div>
        </div>
        <div class="field"><label>${esc(t("public"))}</label>
          <select name="public"><option value="true">${esc(t("yes"))}</option><option value="false">${esc(t("no"))}</option></select>
        </div>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${esc(t("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${esc(t("list"))}</h2>
      ${
        list.length
          ? `<div class="table-wrap"><table class="table"><thead><tr><th>${esc(t("col_name"))}</th><th>${esc(t("col_slug"))}</th><th>${esc(t("col_visibility"))}</th><th>${esc(t("col_link"))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<p class="list-empty">${esc(t("empty"))}</p>`
      }
    </section>
  `,
    true,
  );
}

function statusPageDetailView(sp: StatusPage, allMonitors: Monitor[]): string {
  const linked = new Set((sp.monitors || []).map((m) => m.id));
  const opts = allMonitors
    .filter((m) => !linked.has(m.id))
    .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
    .join("");
  const rows = (sp.monitors || [])
    .map(
      (m) => `
      <tr data-monitor-id="${m.id}">
        ${td(t("col_monitor"), esc(m.name))}
        ${td(t("col_status"), statusBadge(m), "js-status")}
        ${actionsTd(
          `<button class="btn btn-ghost" type="button" data-detach="${m.id}">${esc(t("detach"))}</button>`,
        )}
      </tr>`,
    )
    .join("");

  return shell(
    "/status-pages",
    `
    <section class="panel" style="margin-bottom:1rem">
      <div class="panel-head">
        <h2>${esc(sp.name)}</h2>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-del="${sp.id}">${esc(t("delete"))}</button>
          <a href="/status-pages" data-link>${esc(t("back"))}</a>
        </div>
      </div>
      <p class="muted">slug: <code>${esc(sp.slug)}</code> · ${
        sp.public
          ? `<a href="/s/${esc(sp.slug)}" data-link>${esc(t("public_page"))}</a>`
          : esc(t("private"))
      }</p>
      <form id="sp-edit">
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("col_name"))}</label><input name="name" value="${esc(sp.name)}" required /></div>
          <div class="field"><label>${esc(t("col_slug"))}</label><input name="slug" value="${esc(sp.slug)}" required /></div>
        </div>
        <div class="field"><label>${esc(t("public"))}</label>
          <select name="public">
            <option value="true" ${sp.public ? "selected" : ""}>${esc(t("yes"))}</option>
            <option value="false" ${!sp.public ? "selected" : ""}>${esc(t("no"))}</option>
          </select>
        </div>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${esc(t("save"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${esc(t("monitors_on_page"))}</h2>
      <form id="attach-monitor" class="attach-row">
        <div class="field" style="margin-bottom:0">
          <label>${esc(t("col_monitor"))}</label>
          <select name="monitor_id">${opts || `<option value="">${esc(t("no_available"))}</option>`}</select>
        </div>
        <button class="btn btn-primary" type="submit" ${!opts ? "disabled" : ""}>${esc(t("attach"))}</button>
      </form>
      ${
        rows
          ? `<div class="table-wrap" style="margin-top:1rem"><table class="table"><thead><tr><th>${esc(t("col_monitor"))}</th><th>${esc(t("col_status"))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<p class="list-empty">${esc(t("not_attached"))}</p>`
      }
    </section>
    ${sp.public ? embedSnippets(sp.slug) : ""}
  `,
    true,
  );
}

function profileView(user: Me): string {
  return shell(
    "/profile",
    `
    <section class="panel">
      <h2>${esc(t("profile_title"))}</h2>
      <div class="grid two" style="margin-bottom:1.25rem">
        <div class="stat"><div class="k">${esc(t("role"))}</div><div class="v">${esc(user.role)}</div></div>
        <div class="stat"><div class="k">${esc(t("status_label"))}</div><div class="v">${esc(user.status)}</div></div>
      </div>
      <form id="profile-form">
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("email"))}</label><input name="email" type="email" value="${esc(user.email)}" required /></div>
          <div class="field"><label>${esc(t("username"))}</label><input name="username" minlength="3" value="${esc(user.username)}" required /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${esc(t("current_password"))}</label><input name="current_password" type="password" autocomplete="current-password" /></div>
          <div class="field"><label>${esc(t("new_password"))}</label><input name="password" type="password" minlength="8" autocomplete="new-password" /></div>
        </div>
        <div class="field">
          <label>${esc(t("api_key"))}</label>
          <div class="row">
            <input name="api_key" value="${esc(user.api_key || "")}" readonly style="flex:1" />
            <button class="btn btn-ghost" type="button" id="copy-api">${esc(t("copy"))}</button>
          </div>
        </div>
        <p class="error" id="error"></p>
        <p class="muted" id="profile-ok" style="min-height:1.2rem"></p>
        <div class="row">
          <button class="btn btn-primary" type="submit">${esc(t("save"))}</button>
          <button class="btn btn-ghost" type="button" id="regen-api">${esc(t("regenerate_api_key"))}</button>
        </div>
      </form>
    </section>
  `,
    true,
  );
}

function publicStatusView(page: PublicStatusPage): string {
  const list = page.monitors || [];
  const overall = page.overall_status || "operational";

  return `
    <div class="shell shell-wide">
      <section class="hero">
        <p class="pulse">${esc(t("public_label"))}</p>
        <h1 class="brand">${esc(page.name)}</h1>
        <p class="tagline">${esc(t("status_page_tag"))} <code>${esc(page.slug)}</code></p>
      </section>
      <section class="status-banner ${overallBannerClass(overall)} js-status-banner">
        <span class="status-banner-dot" aria-hidden="true"></span>
        <span class="js-status-banner-text">${esc(overallLabel(overall))}</span>
      </section>
      <section class="panel">
        <h2 class="section-title">${esc(t("components"))}</h2>
        ${
          list.length
            ? `<ul class="status-components">${publicComponentsHTML(list)}</ul>`
            : `<p class="list-empty">${esc(t("no_monitors_short"))}</p>`
        }
      </section>
      <section class="panel">
        <h2 class="section-title">${esc(t("past_incidents"))}</h2>
        <div class="js-incidents">${incidentsHTML(page.incidents || [])}</div>
      </section>
      ${footer()}
    </div>
  `;
}

function embedStatusView(page: PublicStatusPage, theme: string, variant: string): string {
  const list = page.monitors || [];
  const overall = page.overall_status || "operational";
  const summary = list.length === 0 ? t("no_monitors_short") : overallLabel(overall);
  const mini = variant === "mini";
  const themeClass = theme === "light" ? "theme-light" : "theme-dark";
  const variantClass = mini ? "variant-mini" : "variant-normal";

  const items = list
    .map(
      (m) => `
        <li class="embed-item" data-monitor-id="${m.id}">
          <div class="embed-item-main">
            <span class="embed-name">${esc(m.name)}</span>
            <span class="js-status">${statusBadge(m)}</span>
          </div>
          <div class="embed-item-meta">
            <span><span class="embed-k">${esc(t("col_uptime"))}</span> ${uptimeCell(m)}</span>
            <span><span class="embed-k">${esc(t("col_latency"))}</span> <span class="js-latency">${
              m.last_latency != null ? esc(m.last_latency) + " ms" : "—"
            }</span></span>
          </div>
          ${hourBarHTML(m.uptime_hours)}
        </li>`,
    )
    .join("");

  return `
    <div class="embed-shell ${themeClass} ${variantClass}">
      <div class="embed-card">
        <header class="embed-head">
          <div class="embed-titles">
            <h1>${esc(page.name)}</h1>
          </div>
          ${
            mini
              ? ""
              : `<a class="embed-powered" href="${esc(originBase())}/s/${esc(page.slug)}" target="_blank" rel="noopener">${esc(t("powered_by"))}</a>`
          }
        </header>
        <div class="status-banner embed-banner ${overallBannerClass(overall)} js-status-banner">
          <span class="status-banner-dot" aria-hidden="true"></span>
          <span class="js-status-banner-text js-embed-summary">${esc(summary)}</span>
        </div>
        ${
          list.length
            ? `<ul class="embed-list">${items}</ul>`
            : `<p class="embed-empty">${esc(t("no_monitors_short"))}</p>`
        }
        ${
          mini
            ? ""
            : `<div class="embed-incidents">
                <h2 class="embed-section-title">${esc(t("past_incidents"))}</h2>
                <div class="js-incidents" data-limit="2">${incidentsHTML(page.incidents || [], 2)}</div>
              </div>`
        }
      </div>
    </div>
  `;
}

function startEmbedHostBridge(fill: boolean): void {
  const shell = document.querySelector<HTMLElement>(".embed-shell");
  if (!shell) return;

  if (fill) {
    shell.classList.add("fill-height");
    return;
  }

  if (window.parent === window) return;

  const post = () => {
    const height = Math.ceil(shell.getBoundingClientRect().height);
    if (height > 0) {
      window.parent.postMessage({ type: "pinger-embed-resize", height }, "*");
    }
  };

  post();
  requestAnimationFrame(post);
  window.addEventListener("load", post);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => post());
    ro.observe(shell);
  }
}

/* ---------- router ---------- */

async function render(): Promise<void> {
  stopLive();

  const route = path();
  const authed = Boolean(getAccessToken());
  const params = new URLSearchParams(window.location.search);

  const embedMatch = route.match(/^\/embed\/s\/([^/]+)$/);
  if (embedMatch) {
    const embedLang = (params.get("lang") as Lang) || "en";
    const theme = params.get("theme") || "dark";
    const variant = params.get("variant") === "mini" ? "mini" : "normal";
    const fill = params.get("fill") === "1" || params.get("height") === "100%";
    document.documentElement.classList.add("embed-mode");
    document.body.classList.add("embed-mode");
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
      document.body.classList.add("theme-light");
    }
    if (fill) {
      document.documentElement.classList.add("fill-height");
      document.body.classList.add("fill-height");
    }
    try {
      const page = await statusPages.public(embedMatch[1]);
      document.documentElement.lang = embedLang === "zh" ? "zh-CN" : embedLang;
      app.innerHTML = withLang(embedLang, () => embedStatusView(page, theme, variant));
      startEmbedHostBridge(fill);
      let prevById = new Map<number, boolean>();
      (page.monitors || []).forEach((m) => {
        if (m.last_status != null) prevById.set(m.id, m.last_status);
      });
      disposeLive = connectSlugLive(page.slug, (ev) => {
        withLang(embedLang, () => applyStatusEvent(app, ev));
        const prev = prevById.get(ev.id);
        if (prev !== undefined && prev !== ev.status) {
          void refreshPublicHistory(app, page.slug, embedLang);
        }
        prevById.set(ev.id, ev.status);
      });
    } catch (err) {
      app.innerHTML = withLang(embedLang, () =>
        `<div class="embed-shell ${theme === "light" ? "theme-light" : ""}"><div class="embed-card"><p class="error">${esc(err instanceof Error ? err.message : t("not_found"))}</p></div></div>`,
      );
      startEmbedHostBridge(fill);
    }
    return;
  }

  document.documentElement.classList.remove("embed-mode", "theme-light", "fill-height");
  document.body.classList.remove("embed-mode", "theme-light", "fill-height");

  const publicMatch = route.match(/^\/s\/([^/]+)$/);
  if (publicMatch) {
    try {
      const page = await statusPages.public(publicMatch[1]);
      app.innerHTML = publicStatusView(page);
      bindLang(app);
      let prevById = new Map<number, boolean>();
      (page.monitors || []).forEach((m) => {
        if (m.last_status != null) prevById.set(m.id, m.last_status);
      });
      disposeLive = connectSlugLive(page.slug, (ev) => {
        applyStatusEvent(app, ev);
        const prev = prevById.get(ev.id);
        if (prev !== undefined && prev !== ev.status) {
          void refreshPublicHistory(app, page.slug);
        }
        prevById.set(ev.id, ev.status);
      });
    } catch (err) {
      app.innerHTML = `<div class="shell"><section class="panel"><h2>${esc(t("not_found"))}</h2><p class="error">${esc(err instanceof Error ? err.message : "error")}</p></section>${footer()}</div>`;
      bindLang(app);
    }
    return;
  }

  if (route === "/login") {
    if (authed) return go("/");
    app.innerHTML = loginView();
    bindLang(app);
    app.querySelectorAll("a[data-link]").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        go((a as HTMLAnchorElement).getAttribute("href") || "/");
      }),
    );
    app.querySelector("#login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target as HTMLFormElement);
      const error = app.querySelector("#error")!;
      try {
        saveTokens(await login(String(fd.get("login")), String(fd.get("password"))));
        go("/");
      } catch (err) {
        error.textContent = err instanceof Error ? err.message : "error";
      }
    });
    return;
  }

  if (route === "/register") {
    if (authed) return go("/");
    app.innerHTML = registerView();
    bindLang(app);
    app.querySelectorAll("a[data-link]").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        go((a as HTMLAnchorElement).getAttribute("href") || "/");
      }),
    );
    app.querySelector("#register-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target as HTMLFormElement);
      const error = app.querySelector("#error")!;
      try {
        saveTokens(
          await register(String(fd.get("email")), String(fd.get("username")), String(fd.get("password"))),
        );
        go("/");
      } catch (err) {
        error.textContent = err instanceof Error ? err.message : "error";
      }
    });
    return;
  }

  if (!authed) return go("/login");

  try {
    const user = await me();

    if (route === "/") {
      const list = await monitors.list();
      app.innerHTML = dashboardView(user, list);
      bindNav(app);
      const token = getAccessToken();
      if (token) {
        disposeLive = connectUserLive(token, (ev) => applyStatusEvent(app, ev));
      }
      return;
    }

    if (route === "/monitors") {
      const list = await monitors.list();
      app.innerHTML = monitorsView(list);
      bindNav(app);
      const token = getAccessToken();
      if (token) {
        disposeLive = connectUserLive(token, (ev) => applyStatusEvent(app, ev));
      }
      app.querySelector("#monitor-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const error = app.querySelector("#error")!;
        try {
          await monitors.create({
            name: String(fd.get("name")),
            type: String(fd.get("type")),
            target: String(fd.get("target")),
            interval: Number(fd.get("interval")),
            timeout: Number(fd.get("timeout")),
            confirmations: Number(fd.get("confirmations")) || 1,
            enabled: String(fd.get("enabled")) === "true",
          });
          go("/monitors");
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });
      app.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = Number(btn.dataset.toggle);
          const enabled = btn.dataset.enabled !== "1";
          try {
            await monitors.update(id, { enabled });
            go("/monitors");
          } catch (err) {
            alert(err instanceof Error ? err.message : "error");
          }
        });
      });
      app.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (await confirmDelete(() => monitors.remove(Number(btn.dataset.del)))) go("/monitors");
        });
      });
      return;
    }

    const monMatch = route.match(/^\/monitors\/(\d+)$/);
    if (monMatch) {
      const id = Number(monMatch[1]);
      const [detail, checks, notifs] = await Promise.all([
        monitors.get(id),
        monitors.checks(id),
        notifications.list(),
      ]);
      app.innerHTML = monitorDetailView(detail, checks, notifs);
      bindNav(app);
      app.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (await confirmDelete(() => monitors.remove(Number(btn.dataset.del)))) go("/monitors");
        });
      });
      app.querySelector("#monitor-edit")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const error = app.querySelector("#error")!;
        try {
          await monitors.update(id, {
            name: String(fd.get("name")),
            type: String(fd.get("type")),
            target: String(fd.get("target")),
            interval: Number(fd.get("interval")),
            timeout: Number(fd.get("timeout")),
            confirmations: Number(fd.get("confirmations")) || 1,
            enabled: String(fd.get("enabled")) === "true",
          });
          go(`/monitors/${id}`);
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });
      app.querySelector("#attach-notif")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const nid = Number(fd.get("notification_id"));
        if (!nid) return;
        await monitors.attachNotification(id, nid);
        go(`/monitors/${id}`);
      });
      app.querySelectorAll<HTMLButtonElement>("[data-detach-notif]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await monitors.detachNotification(id, Number(btn.dataset.detachNotif));
          go(`/monitors/${id}`);
        });
      });
      return;
    }

    if (route === "/notifications") {
      const list = await notifications.list();
      app.innerHTML = notificationsView(list);
      bindNav(app);
      bindNotifTypeSwitch(app);
      app.querySelector("#notif-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const error = app.querySelector("#error")!;
        const type = String(fd.get("type"));
        try {
          await notifications.create({
            type,
            config: buildNotifConfig(type, fd),
            enabled: String(fd.get("enabled")) === "true",
          });
          go("/notifications");
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });
      app.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = Number(btn.dataset.toggle);
          const enabled = btn.dataset.enabled !== "1";
          try {
            await notifications.update(id, { enabled });
            go("/notifications");
          } catch (err) {
            alert(err instanceof Error ? err.message : "error");
          }
        });
      });
      app.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (await confirmDelete(() => notifications.remove(Number(btn.dataset.del)))) go("/notifications");
        });
      });
      return;
    }

    if (route === "/status-pages") {
      const list = await statusPages.list();
      app.innerHTML = statusPagesView(list);
      bindNav(app);
      app.querySelector("#sp-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const error = app.querySelector("#error")!;
        try {
          await statusPages.create({
            name: String(fd.get("name")),
            slug: String(fd.get("slug")),
            public: String(fd.get("public")) === "true",
          });
          go("/status-pages");
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });
      app.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (await confirmDelete(() => statusPages.remove(Number(btn.dataset.del)))) go("/status-pages");
        });
      });
      return;
    }

    if (route === "/profile") {
      app.innerHTML = profileView(user);
      bindNav(app);
      const ok = app.querySelector("#profile-ok")!;
      const error = app.querySelector("#error")!;
      const apiInput = app.querySelector<HTMLInputElement>("input[name=api_key]")!;

      app.querySelector("#copy-api")?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(apiInput.value);
          ok.textContent = t("copied");
        } catch {
          ok.textContent = "";
        }
      });

      app.querySelector("#regen-api")?.addEventListener("click", async () => {
        error.textContent = "";
        ok.textContent = "";
        try {
          const updated = await updateMe({ regenerate_api_key: true });
          apiInput.value = updated.api_key || "";
          ok.textContent = t("profile_saved");
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });

      app.querySelector("#profile-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        error.textContent = "";
        ok.textContent = "";
        const fd = new FormData(e.target as HTMLFormElement);
        const body: Parameters<typeof updateMe>[0] = {
          email: String(fd.get("email") || "").trim(),
          username: String(fd.get("username") || "").trim(),
        };
        const password = String(fd.get("password") || "");
        const current = String(fd.get("current_password") || "");
        if (password) {
          body.password = password;
          body.current_password = current;
        }
        try {
          const updated = await updateMe(body);
          ok.textContent = t("profile_saved");
          (e.target as HTMLFormElement).querySelector<HTMLInputElement>("input[name=password]")!.value = "";
          (e.target as HTMLFormElement).querySelector<HTMLInputElement>("input[name=current_password]")!.value = "";
          apiInput.value = updated.api_key || "";
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });
      return;
    }

    const spMatch = route.match(/^\/status-pages\/(\d+)$/);
    if (spMatch) {
      const id = Number(spMatch[1]);
      const [sp, allMon] = await Promise.all([statusPages.get(id), monitors.list()]);
      app.innerHTML = statusPageDetailView(sp, allMon);
      bindNav(app);
      app.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (await confirmDelete(() => statusPages.remove(Number(btn.dataset.del)))) go("/status-pages");
        });
      });
      app.querySelector("#sp-edit")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const error = app.querySelector("#error")!;
        try {
          await statusPages.update(id, {
            name: String(fd.get("name")),
            slug: String(fd.get("slug")),
            public: String(fd.get("public")) === "true",
          });
          go(`/status-pages/${id}`);
        } catch (err) {
          error.textContent = err instanceof Error ? err.message : "error";
        }
      });
      app.querySelector("#attach-monitor")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const mid = Number(fd.get("monitor_id"));
        if (!mid) return;
        await statusPages.attachMonitor(id, mid);
        go(`/status-pages/${id}`);
      });
      app.querySelectorAll<HTMLButtonElement>("[data-detach]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await statusPages.detachMonitor(id, Number(btn.dataset.detach));
          go(`/status-pages/${id}`);
        });
      });
      return;
    }

    go("/");
  } catch {
    clearTokens();
    go("/login");
  }
}

void render();
