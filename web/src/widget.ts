/**
 * Embeddable Pinger status widget.
 *
 * Usage:
 *   <script src="https://your-host/widget.js" data-slug="my-status" async></script>
 *   <div data-pinger-status="my-status"></div>
 *   <script src="https://your-host/widget.js" async></script>
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

  function mount(el: HTMLElement, slug: string): void {
    if (el.dataset.pingerMounted === "1") return;
    el.dataset.pingerMounted = "1";

    const theme = el.getAttribute("data-theme") || script?.getAttribute("data-theme") || "dark";
    const height = el.getAttribute("data-height") || script?.getAttribute("data-height") || "360";
    const refresh = el.getAttribute("data-refresh") || script?.getAttribute("data-refresh") || "60";
    const lang = el.getAttribute("data-lang") || script?.getAttribute("data-lang") || "en";

    const iframe = document.createElement("iframe");
    iframe.src = `${origin}/embed/s/${encodeURIComponent(slug)}?theme=${encodeURIComponent(theme)}&refresh=${encodeURIComponent(refresh)}&lang=${encodeURIComponent(lang)}`;
    iframe.title = `Pinger status: ${slug}`;
    iframe.loading = "lazy";
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    iframe.style.cssText = [
      "width:100%",
      `height:${/^\d+$/.test(height) ? `${height}px` : height}`,
      "border:0",
      "border-radius:12px",
      "display:block",
      "background:transparent",
      "color-scheme:normal",
      "overflow:hidden",
    ].join(";");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    el.appendChild(iframe);
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
