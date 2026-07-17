/**
 * Embeddable Pinger status widget.
 *
 * Usage:
 *   <script src="https://your-host/widget.js"
 *           data-slug="my-status"
 *           data-theme="light"
 *           data-height="auto"
 *           async></script>
 *
 * data-height:
 *   auto   — resize iframe to content (default)
 *   100%   — fill parent height (parent must have height)
 *   480    — fixed pixels
 */
(function () {
  const script = document.currentScript as HTMLScriptElement | null;
  const origin = (() => {
    if (script?.src) {
      try {
        return new URL(script.src).origin;
      } catch {
        /* fall through */
      }
    }
    return window.location.origin;
  })();

  type ResizeMsg = { type: string; height?: number };

  function mount(el: HTMLElement, slug: string): void {
    if (el.dataset.pingerMounted === "1") return;
    el.dataset.pingerMounted = "1";

    const theme = el.getAttribute("data-theme") || script?.getAttribute("data-theme") || "dark";
    const heightRaw = (el.getAttribute("data-height") || script?.getAttribute("data-height") || "auto").trim();
    const refresh = el.getAttribute("data-refresh") || script?.getAttribute("data-refresh") || "60";
    const lang = el.getAttribute("data-lang") || script?.getAttribute("data-lang") || "en";

    const fill = heightRaw === "100%" || heightRaw.toLowerCase() === "fill";
    const auto = !fill && (heightRaw === "" || heightRaw.toLowerCase() === "auto");

    if (fill) {
      el.style.cssText = "width:100%;height:100%;min-height:0;display:block;";
    } else {
      el.style.cssText = "width:100%;display:block;";
    }

    const iframe = document.createElement("iframe");
    const qs = new URLSearchParams({
      theme,
      refresh,
      lang,
    });
    if (fill) qs.set("fill", "1");
    iframe.src = `${origin}/embed/s/${encodeURIComponent(slug)}?${qs.toString()}`;
    iframe.title = `Pinger status: ${slug}`;
    iframe.loading = "lazy";
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

    const heightCSS = fill
      ? "100%"
      : auto
        ? "0"
        : /^\d+$/.test(heightRaw)
          ? `${heightRaw}px`
          : heightRaw;

    iframe.style.cssText = [
      "width:100%",
      `height:${heightCSS}`,
      "border:0",
      "border-radius:12px",
      "display:block",
      "background:transparent",
      "color-scheme:normal",
      "overflow:hidden",
    ].join(";");
    if (fill) {
      iframe.style.minHeight = "0";
    }
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    el.appendChild(iframe);

    if (auto) {
      const onMessage = (ev: MessageEvent) => {
        if (ev.origin !== origin) return;
        const data = ev.data as ResizeMsg | null;
        if (!data || data.type !== "pinger-embed-resize") return;
        if (ev.source !== iframe.contentWindow) return;
        const h = Number(data.height);
        if (!Number.isFinite(h) || h <= 0) return;
        iframe.style.height = `${Math.ceil(h)}px`;
      };
      window.addEventListener("message", onMessage);
    }
  }

  const fromScript = script?.getAttribute("data-slug")?.trim();
  if (fromScript && script?.parentElement) {
    const holder = document.createElement("div");
    holder.className = "pinger-widget";
    script.parentElement.insertBefore(holder, script.nextSibling);
    mount(holder, fromScript);
  }

  document.querySelectorAll<HTMLElement>("[data-pinger-status]").forEach((el) => {
    const slug = el.getAttribute("data-pinger-status")?.trim();
    if (slug) mount(el, slug);
  });
})();
