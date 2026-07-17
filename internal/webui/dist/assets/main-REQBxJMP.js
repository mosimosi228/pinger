(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const l of i)if(l.type==="childList")for(const d of l.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function o(i){const l={};return i.integrity&&(l.integrity=i.integrity),i.referrerPolicy&&(l.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?l.credentials="include":i.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function s(i){if(i.ep)return;i.ep=!0;const l=o(i);fetch(i.href,l)}})();const B="pinger.access",W="pinger.refresh";function D(){return localStorage.getItem(B)}function he(){return localStorage.getItem(W)}function V(t){localStorage.setItem(B,t.access_token),localStorage.setItem(W,t.refresh_token)}function K(){localStorage.removeItem(B),localStorage.removeItem(W)}async function ge(t){try{const n=await t.json();return n.error||n.status||t.statusText}catch{return t.statusText||"request failed"}}async function f(t,n={},o=!1){const s=new Headers(n.headers||{});if(!s.has("Content-Type")&&n.body&&s.set("Content-Type","application/json"),o){const d=D();d&&s.set("Authorization",`Bearer ${d}`)}let i=await fetch(t,{...n,headers:s});if(o&&i.status===401&&await be()&&(s.set("Authorization",`Bearer ${D()}`),i=await fetch(t,{...n,headers:s})),!i.ok)throw new Error(await ge(i));if(i.status===204)return;const l=await i.text();if(l)return JSON.parse(l)}async function be(){const t=he();if(!t)return!1;try{const n=await f("/auth/refresh",{method:"POST",body:JSON.stringify({refresh_token:t})});return V(n),!0}catch{return K(),!1}}function fe(t,n,o){return f("/auth/register",{method:"POST",body:JSON.stringify({email:t,username:n,password:o})})}function _e(t,n){return f("/auth/login",{method:"POST",body:JSON.stringify({login:t,password:n})})}function ve(){return f("/api/v1/me",{},!0)}function ne(t){return f("/api/v1/me",{method:"PATCH",body:JSON.stringify(t)},!0)}const w={list:()=>f("/api/v1/monitors",{},!0),get:t=>f(`/api/v1/monitors/${t}`,{},!0),create:t=>f("/api/v1/monitors",{method:"POST",body:JSON.stringify(t)},!0),update:(t,n)=>f(`/api/v1/monitors/${t}`,{method:"PATCH",body:JSON.stringify(n)},!0),remove:t=>f(`/api/v1/monitors/${t}`,{method:"DELETE"},!0),checks:t=>f(`/api/v1/monitors/${t}/checks`,{},!0),attachNotification:(t,n)=>f(`/api/v1/monitors/${t}/notifications`,{method:"POST",body:JSON.stringify({id:n})},!0),detachNotification:(t,n)=>f(`/api/v1/monitors/${t}/notifications/${n}`,{method:"DELETE"},!0)},q={list:()=>f("/api/v1/notifications",{},!0),create:t=>f("/api/v1/notifications",{method:"POST",body:JSON.stringify(t)},!0),update:(t,n)=>f(`/api/v1/notifications/${t}`,{method:"PATCH",body:JSON.stringify(n)},!0),remove:t=>f(`/api/v1/notifications/${t}`,{method:"DELETE"},!0)},E={list:()=>f("/api/v1/status-pages",{},!0),get:t=>f(`/api/v1/status-pages/${t}`,{},!0),create:t=>f("/api/v1/status-pages",{method:"POST",body:JSON.stringify(t)},!0),update:(t,n)=>f(`/api/v1/status-pages/${t}`,{method:"PATCH",body:JSON.stringify(n)},!0),remove:t=>f(`/api/v1/status-pages/${t}`,{method:"DELETE"},!0),attachMonitor:(t,n)=>f(`/api/v1/status-pages/${t}/monitors`,{method:"POST",body:JSON.stringify({id:n})},!0),detachMonitor:(t,n)=>f(`/api/v1/status-pages/${t}/monitors/${n}`,{method:"DELETE"},!0),public:t=>f(`/api/public/s/${encodeURIComponent(t)}`)},ye=[{code:"en",label:"English"},{code:"ru",label:"Русский"},{code:"es",label:"Español"},{code:"de",label:"Deutsch"},{code:"zh",label:"中文"}],se="pinger_lang",A={nav_aria:"Main menu",nav_dashboard:"Dashboard",nav_monitors:"Monitors",nav_alerts:"Alerts",nav_pages:"Pages",nav_profile:"Profile",logout:"Log out",live:"live",tagline:"Uptime checks, alerts, and public status pages.",tagline_login:"Uptime monitoring. Sign in to manage checks and alerts.",tagline_register:"Create your Pinger account.",login_title:"Sign in",login_field:"Email or username",password:"Password",sign_in:"Sign in",create_account:"Create account",register_title:"Sign up",email:"Email",username:"Username",register_submit:"Create account",have_account:"Already have an account",hello:"Hello, {name}",monitors:"Monitors",no_monitors:"No monitors yet. {link}.",create_first:"Create the first one",col_name:"Name",col_type:"Type",col_target:"Target",col_status:"Status",col_uptime:"Uptime 1h",col_latency:"Latency",col_checked:"Checked",col_interval:"Interval",col_code:"Code",col_error:"Error",col_at:"At",col_notification:"Notification",col_config:"Config",col_enabled:"Enabled",col_slug:"Slug",col_visibility:"Visibility",col_link:"Link",col_monitor:"Monitor",col_service:"Service",delete:"Delete",new_monitor:"New monitor",target:"Target",interval_sec:"Interval (sec)",timeout_sec:"Timeout (sec)",confirmations:"Confirmations",confirmations_hint:"Alert after N consecutive UP or DOWN checks (1 = immediate).",enabled:"Enabled",yes:"yes",no:"no",create:"Create",list:"List",empty:"Empty",back:"← back",next_check:"Next check",save:"Save",alerts:"Alerts",alert:"Alert",no_alerts:"no alerts",attach:"Attach",detach:"Detach",not_attached:"None attached",check_history:"Check history",check_history_hint:"Only the last hour of checks is kept.",no_checks:"No checks yet — wait for the next scheduler tick",new_alert:"New alert",type:"Type",webhook_url:"Webhook URL",bot_token:"Bot token",chat_id:"Chat ID",hint_telegram:"A message is sent to Telegram when a monitor status changes (up ↔ down).",hint_webhook:"Pinger will POST JSON to the URL when a monitor status changes.",new_status_page:"New status page",public:"Public",private:"private",public_label:"public",public_page:"public page",monitors_on_page:"Monitors on page",no_available:"none available",status_page_tag:"Status page",no_monitors_short:"No monitors",not_found:"Not found",footer_copy:"© {year} Pinger · open source",footer_repo:"Repository",language:"Language",embed:"Embed",embed_iframe:"iframe",embed_script:"Script widget",embed_hint:"Paste on another site to show this status page.",badge_up:"up",badge_down:"down",badge_on:"on",badge_off:"off",badge_pending:"pending",enable:"Enable",disable:"Disable",placeholder_target:"https://example.com or host:443",all_operational:"All systems operational",some_down:"Some systems are down",powered_by:"Powered by Pinger",confirm_delete:"Delete this item?",delete_failed:"Delete failed",profile_title:"Profile",profile_saved:"Saved",current_password:"Current password",new_password:"New password",api_key:"API key",regenerate_api_key:"Regenerate API key",role:"Role",status_label:"Status",copy:"Copy",copied:"Copied"},$e={...A,nav_aria:"Основное меню",nav_dashboard:"Дашборд",nav_monitors:"Мониторы",nav_alerts:"Алерты",nav_pages:"Страницы",nav_profile:"Профиль",logout:"Выйти",tagline:"Проверки доступности, алерты и публичные status pages.",tagline_login:"Мониторинг доступности. Войдите, чтобы управлять проверками и алертами.",tagline_register:"Создайте аккаунт Pinger.",login_title:"Вход",login_field:"Email или username",password:"Пароль",sign_in:"Войти",create_account:"Создать аккаунт",register_title:"Регистрация",username:"Username",register_submit:"Зарегистрироваться",have_account:"Уже есть аккаунт",hello:"Привет, {name}",monitors:"Мониторы",no_monitors:"Пока нет мониторов. {link}.",create_first:"Создайте первый",col_name:"Имя",col_type:"Тип",col_target:"Цель",col_status:"Статус",col_uptime:"Аптайм 1ч",col_latency:"Задержка",col_checked:"Проверено",col_interval:"Интервал",col_code:"Код",col_error:"Ошибка",col_at:"Время",col_notification:"Алерт",col_config:"Конфиг",col_enabled:"Вкл",col_slug:"Slug",col_visibility:"Доступ",col_link:"Ссылка",col_monitor:"Монитор",col_service:"Сервис",delete:"Удалить",new_monitor:"Новый монитор",target:"Цель",interval_sec:"Интервал (сек)",timeout_sec:"Таймаут (сек)",confirmations:"Подтверждения",confirmations_hint:"Алерт после N подряд UP или DOWN (1 = сразу).",enabled:"Включён",yes:"да",no:"нет",create:"Создать",list:"Список",empty:"Пусто",back:"← назад",next_check:"След. проверка",save:"Сохранить",alerts:"Алерты",alert:"Алерт",no_alerts:"нет алертов",attach:"Привязать",detach:"Отвязать",not_attached:"Не привязано",check_history:"История проверок",check_history_hint:"Хранятся только проверки за последний час.",no_checks:"Пока нет checks — подождите следующий тик scheduler",new_alert:"Новый алерт",type:"Тип",hint_telegram:"Сообщение уйдёт в Telegram при смене статуса монитора (up ↔ down).",hint_webhook:"Pinger сделает POST JSON на URL при смене статуса монитора.",new_status_page:"Новая status page",public:"Публичная",private:"private",public_label:"public",public_page:"публичная страница",monitors_on_page:"Мониторы на странице",no_available:"нет доступных",status_page_tag:"Status page",no_monitors_short:"Нет мониторов",not_found:"Не найдено",footer_copy:"© {year} Pinger · open source",footer_repo:"Репозиторий",language:"Язык",embed:"Встраивание",embed_iframe:"iframe",embed_script:"Скрипт-виджет",embed_hint:"Вставьте на другой сайт, чтобы показать эту status page.",badge_on:"вкл",badge_off:"выкл",enable:"Включить",disable:"Выключить",placeholder_target:"https://example.com или host:443",all_operational:"Все системы в норме",some_down:"Есть недоступные системы",powered_by:"Сделано на Pinger",confirm_delete:"Удалить этот элемент?",delete_failed:"Не удалось удалить",profile_title:"Профиль",profile_saved:"Сохранено",current_password:"Текущий пароль",new_password:"Новый пароль",api_key:"API-ключ",regenerate_api_key:"Обновить API-ключ",role:"Роль",status_label:"Статус",copy:"Копировать",copied:"Скопировано"},we={...A,nav_aria:"Menú principal",nav_dashboard:"Panel",nav_monitors:"Monitores",nav_alerts:"Alertas",nav_pages:"Páginas",nav_profile:"Perfil",logout:"Salir",tagline:"Comprobaciones de disponibilidad, alertas y páginas de estado públicas.",tagline_login:"Monitorización de disponibilidad. Inicia sesión para gestionar comprobaciones y alertas.",tagline_register:"Crea tu cuenta de Pinger.",login_title:"Iniciar sesión",login_field:"Email o usuario",password:"Contraseña",sign_in:"Entrar",create_account:"Crear cuenta",register_title:"Registro",username:"Usuario",register_submit:"Registrarse",have_account:"Ya tengo cuenta",hello:"Hola, {name}",monitors:"Monitores",no_monitors:"Aún no hay monitores. {link}.",create_first:"Crea el primero",col_name:"Nombre",col_type:"Tipo",col_target:"Destino",col_status:"Estado",col_uptime:"Uptime 1h",col_latency:"Latencia",col_checked:"Comprobado",col_interval:"Intervalo",col_code:"Código",col_error:"Error",col_at:"Fecha",col_notification:"Alerta",col_config:"Config",col_enabled:"Activo",col_visibility:"Visibilidad",col_link:"Enlace",col_monitor:"Monitor",col_service:"Servicio",delete:"Eliminar",new_monitor:"Nuevo monitor",target:"Destino",interval_sec:"Intervalo (seg)",timeout_sec:"Timeout (seg)",confirmations:"Confirmaciones",confirmations_hint:"Alerta tras N comprobaciones UP o DOWN seguidas (1 = inmediata).",enabled:"Activo",yes:"sí",no:"no",create:"Crear",list:"Lista",empty:"Vacío",back:"← atrás",next_check:"Próxima comprobación",save:"Guardar",alerts:"Alertas",alert:"Alerta",no_alerts:"sin alertas",attach:"Vincular",detach:"Desvincular",not_attached:"Sin vincular",check_history:"Historial de comprobaciones",check_history_hint:"Solo se guardan las comprobaciones de la última hora.",no_checks:"Aún no hay checks — espera el siguiente tick del scheduler",new_alert:"Nueva alerta",type:"Tipo",hint_telegram:"Se envía un mensaje a Telegram cuando cambia el estado del monitor (up ↔ down).",hint_webhook:"Pinger hará POST JSON a la URL cuando cambie el estado del monitor.",new_status_page:"Nueva status page",public:"Pública",public_page:"página pública",monitors_on_page:"Monitores en la página",no_available:"ninguno disponible",no_monitors_short:"Sin monitores",not_found:"No encontrado",footer_repo:"Repositorio",language:"Idioma",embed:"Integrar",embed_script:"Widget script",embed_hint:"Pégalo en otro sitio para mostrar esta status page.",badge_on:"activo",enable:"Activar",disable:"Desactivar",placeholder_target:"https://example.com o host:443",all_operational:"Todos los sistemas operativos",some_down:"Algunos sistemas están caídos",powered_by:"Hecho con Pinger"},ke={...A,nav_aria:"Hauptmenü",nav_dashboard:"Dashboard",nav_monitors:"Monitore",nav_alerts:"Alerts",nav_pages:"Seiten",nav_profile:"Profil",logout:"Abmelden",tagline:"Verfügbarkeitschecks, Alerts und öffentliche Statusseiten.",tagline_login:"Uptime-Monitoring. Melde dich an, um Checks und Alerts zu verwalten.",tagline_register:"Erstelle dein Pinger-Konto.",login_title:"Anmelden",login_field:"E-Mail oder Benutzername",password:"Passwort",sign_in:"Anmelden",create_account:"Konto erstellen",register_title:"Registrierung",username:"Benutzername",register_submit:"Registrieren",have_account:"Bereits ein Konto",hello:"Hallo, {name}",monitors:"Monitore",no_monitors:"Noch keine Monitore. {link}.",create_first:"Ersten erstellen",col_name:"Name",col_type:"Typ",col_target:"Ziel",col_status:"Status",col_uptime:"Uptime 1h",col_latency:"Latenz",col_checked:"Geprüft",col_interval:"Intervall",col_code:"Code",col_error:"Fehler",col_at:"Zeit",col_notification:"Alert",col_config:"Config",col_enabled:"Aktiv",col_visibility:"Sichtbarkeit",col_link:"Link",col_monitor:"Monitor",col_service:"Service",delete:"Löschen",new_monitor:"Neuer Monitor",target:"Ziel",interval_sec:"Intervall (Sek)",timeout_sec:"Timeout (Sek)",confirmations:"Bestätigungen",confirmations_hint:"Alert nach N aufeinanderfolgenden UP/DOWN-Checks (1 = sofort).",enabled:"Aktiv",yes:"ja",no:"nein",create:"Erstellen",list:"Liste",empty:"Leer",back:"← zurück",next_check:"Nächster Check",save:"Speichern",alerts:"Alerts",alert:"Alert",no_alerts:"keine Alerts",attach:"Verknüpfen",detach:"Trennen",not_attached:"Nicht verknüpft",check_history:"Check-Verlauf",check_history_hint:"Es werden nur Checks der letzten Stunde gespeichert.",no_checks:"Noch keine Checks — warte auf den nächsten Scheduler-Tick",new_alert:"Neuer Alert",type:"Typ",hint_telegram:"Bei Statuswechsel (up ↔ down) wird eine Telegram-Nachricht gesendet.",hint_webhook:"Pinger sendet bei Statuswechsel ein POST JSON an die URL.",new_status_page:"Neue Statusseite",public:"Öffentlich",public_page:"öffentliche Seite",monitors_on_page:"Monitore auf der Seite",no_available:"keine verfügbar",no_monitors_short:"Keine Monitore",not_found:"Nicht gefunden",footer_repo:"Repository",language:"Sprache",embed:"Einbetten",embed_script:"Script-Widget",embed_hint:"Auf einer anderen Website einfügen, um diese Statusseite zu zeigen.",badge_on:"an",enable:"Aktivieren",disable:"Deaktivieren",placeholder_target:"https://example.com oder host:443",all_operational:"Alle Systeme betriebsbereit",some_down:"Einige Systeme sind ausgefallen",powered_by:"Powered by Pinger"},Se={...A,nav_aria:"主菜单",nav_dashboard:"仪表盘",nav_monitors:"监控",nav_alerts:"告警",nav_pages:"状态页",nav_profile:"个人资料",logout:"退出",tagline:"可用性检测、告警与公开状态页。",tagline_login:"可用性监控。登录以管理检测与告警。",tagline_register:"创建你的 Pinger 账户。",login_title:"登录",login_field:"邮箱或用户名",password:"密码",sign_in:"登录",create_account:"创建账户",register_title:"注册",username:"用户名",register_submit:"注册",have_account:"已有账户",hello:"你好，{name}",monitors:"监控",no_monitors:"还没有监控。{link}。",create_first:"创建第一个",col_name:"名称",col_type:"类型",col_target:"目标",col_status:"状态",col_uptime:"1小时可用性",col_latency:"延迟",col_checked:"检查时间",col_interval:"间隔",col_code:"状态码",col_error:"错误",col_at:"时间",col_notification:"告警",col_config:"配置",col_enabled:"启用",col_visibility:"可见性",col_link:"链接",col_monitor:"监控",col_service:"服务",delete:"删除",new_monitor:"新建监控",target:"目标",interval_sec:"间隔（秒）",timeout_sec:"超时（秒）",confirmations:"连续确认",confirmations_hint:"连续 N 次 UP/DOWN 后发送告警（1 = 立即）。",enabled:"启用",yes:"是",no:"否",create:"创建",list:"列表",empty:"空",back:"← 返回",next_check:"下次检查",save:"保存",alerts:"告警",alert:"告警",no_alerts:"暂无告警",attach:"绑定",detach:"解绑",not_attached:"未绑定",check_history:"检查历史",check_history_hint:"仅保留最近一小时的检查记录。",no_checks:"暂无检查记录 — 请等待下次调度",new_alert:"新建告警",type:"类型",hint_telegram:"监控状态变化（up ↔ down）时会发送 Telegram 消息。",hint_webhook:"监控状态变化时，Pinger 会向该 URL 发送 POST JSON。",new_status_page:"新建状态页",public:"公开",public_page:"公开页面",monitors_on_page:"页面上的监控",no_available:"暂无可用",no_monitors_short:"没有监控",not_found:"未找到",footer_repo:"仓库",language:"语言",embed:"嵌入",embed_script:"脚本小部件",embed_hint:"粘贴到其他网站以显示此状态页。",badge_on:"开",enable:"启用",disable:"禁用",placeholder_target:"https://example.com 或 host:443",all_operational:"全部正常",some_down:"部分服务异常",powered_by:"由 Pinger 提供"},U={en:A,ru:$e,es:we,de:ke,zh:Se};function Ee(){try{const t=localStorage.getItem(se);if(t&&U[t])return t}catch{}return"en"}let C=Ee();function Le(){return C}function le(t){if(U[t]){C=t;try{localStorage.setItem(se,t)}catch{}document.documentElement.lang=t==="zh"?"zh-CN":t}}function a(t,n){return Ne(C,t,n)}function Ne(t,n,o){let i=(U[t]||A)[n]??A[n]??n;if(o)for(const[l,d]of Object.entries(o))i=i.replaceAll(`{${l}}`,String(d));return i}function J(t,n){const o=C;C=U[t]?t:"en";try{return n()}finally{C=o}}le(C);function ce(t){return`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}${t}`}function oe(t,n){return de(`${ce("/api/v1/ws")}?token=${encodeURIComponent(t)}`,n)}function ie(t,n){return de(ce(`/api/public/ws/s/${encodeURIComponent(t)}`),n)}function de(t,n){let o=!1,s=null,i=0,l;const d=()=>{o||(s=new WebSocket(t),s.onopen=()=>{i=0},s.onmessage=$=>{try{const v=JSON.parse(String($.data));(v==null?void 0:v.type)==="monitor.status"&&v.id!=null&&n(v)}catch{}},s.onclose=()=>{if(o)return;const $=Math.min(15e3,1e3*2**i);i+=1,l=window.setTimeout(d,$)},s.onerror=()=>{s==null||s.close()})};return d(),()=>{o=!0,l&&window.clearTimeout(l),s==null||s.close()}}function Ce(t,n){return t?n===!0?`<span class="badge badge-up">${I(a("badge_up"))}</span>`:n===!1?`<span class="badge badge-down">${I(a("badge_down"))}</span>`:`<span class="badge badge-off">${I(a("badge_pending"))}</span>`:`<span class="badge badge-off">${I(a("badge_off"))}</span>`}function Ae(t){return t>=99.95?"100":t>=10?t.toFixed(1):t.toFixed(2)}function I(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function R(t,n){t.querySelectorAll(`[data-monitor-id="${n.id}"]`).forEach(s=>{const i=s.querySelector(".js-status");if(i){const v=n.enabled?n.status:null;i.innerHTML=Ce(n.enabled,v)}const l=s.querySelector(".js-latency");l&&(l.textContent=n.latency!=null?`${n.latency} ms`:"—");const d=s.querySelector(".js-checked");d&&(d.textContent=n.checked_at||"—");const $=s.querySelector(".js-uptime");$&&(n.enabled&&n.status&&n.uptime_1h!=null?$.textContent=`${Ae(n.uptime_1h)}%`:$.textContent="—")});const o=t.querySelector(".js-embed-summary");if(o){const s=Array.from(t.querySelectorAll("[data-monitor-id]"));let i=!1;const l=s.length>0;s.forEach(d=>{d.querySelector(".badge-down")&&(i=!0)}),l?i?o.textContent=a("some_down"):o.textContent=a("all_operational"):o.textContent=a("no_monitors_short")}}const r=document.querySelector("#app");let L;function Pe(){L==null||L(),L=void 0}function Te(){return window.location.pathname.replace(/\/+$/,"")||"/"}function b(t){history.pushState({},"",t),F()}window.addEventListener("popstate",()=>{F()});function e(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function T(t){return t.enabled?t.last_status===!0?`<span class="badge badge-up">${e(a("badge_up"))}</span>`:t.last_status===!1?`<span class="badge badge-down">${e(a("badge_down"))}</span>`:`<span class="badge badge-off">${e(a("badge_pending"))}</span>`:`<span class="badge badge-off">${e(a("badge_off"))}</span>`}function z(t){return t.enabled&&t.last_status===!0&&t.uptime_1h!=null?`<span class="js-uptime">${e(ue(t.uptime_1h))}%</span>`:'<span class="js-uptime">—</span>'}function ue(t){return t>=99.95?"100":t>=10?t.toFixed(1):t.toFixed(2)}function qe(){const t=ye.map(n=>`<option value="${n.code}" ${Le()===n.code?"selected":""}>${e(n.label)}</option>`).join("");return`<select class="lang-select" id="lang-switch" aria-label="${e(a("language"))}">${t}</select>`}function M(t){var n;(n=t.querySelector("#lang-switch"))==null||n.addEventListener("change",o=>{le(o.target.value),F()})}function xe(t){const n=(o,s)=>`<a href="${o}" data-link class="nav-link${t===o?" active":""}">${s}</a>`;return`
    <nav class="nav" aria-label="${e(a("nav_aria"))}">
      <div class="nav-tabs">
        ${n("/",a("nav_dashboard"))}
        ${n("/monitors",a("nav_monitors"))}
        ${n("/notifications",a("nav_alerts"))}
        ${n("/status-pages",a("nav_pages"))}
        ${n("/profile",a("nav_profile"))}
      </div>
      <button class="btn btn-ghost btn-nav" type="button" id="logout">${e(a("logout"))}</button>
    </nav>
  `}function N(t){var n;t.querySelectorAll("a[data-link]").forEach(o=>{o.addEventListener("click",s=>{s.preventDefault(),b(o.getAttribute("href")||"/")})}),(n=t.querySelector("#logout"))==null||n.addEventListener("click",()=>{K(),b("/login")}),M(t)}async function x(t){if(!window.confirm(a("confirm_delete")))return!1;try{return await t(),!0}catch(n){return window.alert(n instanceof Error?n.message:a("delete_failed")),!1}}function O(){const t=new Date().getFullYear();return`
    <footer class="site-footer">
      <div class="site-footer-inner">
        <p class="site-footer-copy">${e(a("footer_copy",{year:t}))}</p>
        <div class="site-footer-links">
          ${qe()}
          <a href="https://github.com/mosimosi228" target="_blank" rel="noopener noreferrer" class="site-footer-link">
            <svg class="gh-icon" viewBox="0 0 16 16" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>
            mosimosi228
          </a>
          <a href="https://github.com/mosimosi228/pinger" target="_blank" rel="noopener noreferrer" class="site-footer-link">
            ${e(a("footer_repo"))}
          </a>
        </div>
      </div>
    </footer>
  `}function P(t,n,o=!1){return`
    <div class="shell ${o?"shell-wide":""}">
      <section class="hero">
        <p class="pulse">${e(a("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${e(a("tagline"))}</p>
      </section>
      ${xe(t)}
      ${n}
      ${O()}
    </div>
  `}function pe(){return window.location.origin}function Me(t){const n=pe(),o=`<div style="height:420px">
  <iframe src="${n}/embed/s/${t}?theme=light&lang=en&fill=1" style="width:100%;height:100%;border:0;background:transparent" loading="lazy" title="Pinger status" allowtransparency="true"></iframe>
</div>`,s=`<script src="${n}/widget.js" data-slug="${t}" data-theme="light" data-height="auto" data-lang="en" async><\/script>`,i=`<div style="height:100%">
  <script src="${n}/widget.js" data-slug="${t}" data-theme="light" data-height="100%" data-lang="en" async><\/script>
</div>`;return`
    <section class="panel" style="margin-top:1rem">
      <h2>${e(a("embed"))}</h2>
      <p class="muted">${e(a("embed_hint"))}</p>
      <div class="embed-box">
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${e(a("embed_iframe"))}</p>
          <pre>${e(o)}</pre>
        </div>
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${e(a("embed_script"))} (auto)</p>
          <pre>${e(s)}</pre>
        </div>
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${e(a("embed_script"))} (100%)</p>
          <pre>${e(i)}</pre>
        </div>
      </div>
    </section>
  `}function De(){return`
    <div class="shell">
      <section class="hero">
        <p class="pulse">${e(a("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${e(a("tagline_login"))}</p>
      </section>
      <section class="panel">
        <h2>${e(a("login_title"))}</h2>
        <form id="login-form">
          <div class="field"><label>${e(a("login_field"))}</label><input name="login" required /></div>
          <div class="field"><label>${e(a("password"))}</label><input name="password" type="password" required /></div>
          <p class="error" id="error"></p>
          <div class="row">
            <button class="btn btn-primary" type="submit">${e(a("sign_in"))}</button>
            <a href="/register" data-link>${e(a("create_account"))}</a>
          </div>
        </form>
      </section>
      ${O()}
    </div>
  `}function Oe(){return`
    <div class="shell">
      <section class="hero">
        <p class="pulse">${e(a("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${e(a("tagline_register"))}</p>
      </section>
      <section class="panel">
        <h2>${e(a("register_title"))}</h2>
        <form id="register-form">
          <div class="field"><label>${e(a("email"))}</label><input name="email" type="email" required /></div>
          <div class="field"><label>${e(a("username"))}</label><input name="username" minlength="3" required /></div>
          <div class="field"><label>${e(a("password"))}</label><input name="password" type="password" minlength="8" required /></div>
          <p class="error" id="error"></p>
          <div class="row">
            <button class="btn btn-primary" type="submit">${e(a("register_submit"))}</button>
            <a href="/login" data-link>${e(a("have_account"))}</a>
          </div>
        </form>
      </section>
      ${O()}
    </div>
  `}function je(t,n){const o=n.map(i=>`
      <tr data-monitor-id="${i.id}">
        <td><a href="/monitors/${i.id}" data-link>${e(i.name)}</a></td>
        <td class="cell-tight">${e(i.type)}</td>
        <td>${e(i.target)}</td>
        <td class="cell-tight js-status">${T(i)}</td>
        <td class="cell-tight">${z(i)}</td>
        <td class="cell-tight js-latency">${i.last_latency!=null?e(i.last_latency)+" ms":"—"}</td>
        <td class="cell-tight js-checked">${e(i.last_checked_at||"—")}</td>
      </tr>`).join(""),s=a("no_monitors",{link:`<a href="/monitors" data-link>${e(a("create_first"))}</a>`});return P("/",`
    <section class="panel">
      <div class="panel-head">
        <h2>${e(a("hello",{name:t.username}))}</h2>
        <a class="btn btn-primary" href="/monitors" data-link style="text-decoration:none">${e(a("monitors"))}</a>
      </div>
      ${n.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_name"))}</th><th>${e(a("col_type"))}</th><th>${e(a("col_target"))}</th><th>${e(a("col_status"))}</th><th>${e(a("col_uptime"))}</th><th>${e(a("col_latency"))}</th><th>${e(a("col_checked"))}</th></tr></thead><tbody>${o}</tbody></table></div>`:`<p class="list-empty">${s}</p>`}
    </section>
  `,!0)}function He(t){const n=t.map(o=>`
      <tr data-monitor-id="${o.id}">
        <td><a href="/monitors/${o.id}" data-link>${e(o.name)}</a></td>
        <td class="cell-tight">${e(o.type)}</td>
        <td>${e(o.target)}</td>
        <td class="cell-tight">${e(o.interval)}s</td>
        <td class="cell-tight js-status">${T(o)}</td>
        <td class="cell-tight">${z(o)}</td>
        <td><button class="btn btn-ghost" data-del="${o.id}" type="button">${e(a("delete"))}</button></td>
      </tr>`).join("");return P("/monitors",`
    <section class="panel" style="margin-bottom:1rem">
      <h2>${e(a("new_monitor"))}</h2>
      <form id="monitor-form">
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("col_name"))}</label><input name="name" required placeholder="Google" /></div>
          <div class="field"><label>${e(a("col_type"))}</label>
            <select name="type"><option>HTTP</option><option>TCP</option><option>ICMP</option></select>
          </div>
        </div>
        <div class="field"><label>${e(a("target"))}</label><input name="target" required placeholder="${e(a("placeholder_target"))}" /></div>
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("interval_sec"))}</label><input name="interval" type="number" value="60" min="5" required /></div>
          <div class="field"><label>${e(a("timeout_sec"))}</label><input name="timeout" type="number" value="10" min="1" required /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("confirmations"))}</label><input name="confirmations" type="number" value="1" min="1" max="20" required /></div>
          <div class="field"><label>${e(a("enabled"))}</label>
            <select name="enabled"><option value="true">${e(a("yes"))}</option><option value="false">${e(a("no"))}</option></select>
          </div>
        </div>
        <p class="muted">${e(a("confirmations_hint"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${e(a("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${e(a("list"))}</h2>
      ${t.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_name"))}</th><th>${e(a("col_type"))}</th><th>${e(a("col_target"))}</th><th>${e(a("col_interval"))}</th><th>${e(a("col_status"))}</th><th>${e(a("col_uptime"))}</th><th></th></tr></thead><tbody>${n}</tbody></table></div>`:`<p class="list-empty">${e(a("empty"))}</p>`}
    </section>
  `,!0)}function Ie(t,n,o){const s=n.map(d=>`
      <tr>
        <td>${d.status?`<span class="badge badge-up">${e(a("badge_up"))}</span>`:`<span class="badge badge-down">${e(a("badge_down"))}</span>`}</td>
        <td>${d.status_code??"—"}</td>
        <td>${d.latency!=null?d.latency+" ms":"—"}</td>
        <td>${e(d.error||"")}</td>
        <td>${e(d.checked_at)}</td>
      </tr>`).join(""),i=o.map(d=>`<option value="${d.id}">${e(d.type)} #${d.id}${d.enabled?"":` (${a("badge_off")})`}</option>`).join(""),l=(t.notifications||[]).map(d=>`
      <tr>
        <td>${e(d.type)} #${d.id}</td>
        <td><code>${e(d.config)}</code></td>
        <td>${d.enabled?`<span class="badge badge-up">${e(a("badge_on"))}</span>`:`<span class="badge badge-off">${e(a("badge_off"))}</span>`}</td>
        <td><button class="btn btn-ghost" type="button" data-detach-notif="${d.id}">${e(a("detach"))}</button></td>
      </tr>`).join("");return P("/monitors",`
    <section class="panel" style="margin-bottom:1rem">
      <div class="panel-head">
        <h2>${e(t.name)} ${T(t)}</h2>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-del="${t.id}">${e(a("delete"))}</button>
          <a href="/monitors" data-link>${e(a("back"))}</a>
        </div>
      </div>
      <div class="grid two" style="margin-top:1rem">
        <div class="stat"><div class="k">${e(a("col_type"))}</div><div class="v">${e(t.type)}</div></div>
        <div class="stat"><div class="k">${e(a("col_target"))}</div><div class="v">${e(t.target)}</div></div>
        <div class="stat"><div class="k">${e(a("col_interval"))}</div><div class="v">${e(t.interval)}s</div></div>
        <div class="stat"><div class="k">${e(a("col_uptime"))}</div><div class="v js-uptime">${t.enabled&&t.last_status===!0&&t.uptime_1h!=null?`${e(ue(t.uptime_1h))}%`:"—"}</div></div>
        <div class="stat"><div class="k">${e(a("next_check"))}</div><div class="v">${e(t.next_check_at)}</div></div>
      </div>
      <form id="monitor-edit" style="margin-top:1.25rem">
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("col_name"))}</label><input name="name" value="${e(t.name)}" required /></div>
          <div class="field"><label>${e(a("col_type"))}</label>
            <select name="type">
              ${["HTTP","TCP","ICMP"].map(d=>`<option ${d===t.type?"selected":""}>${d}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>${e(a("target"))}</label><input name="target" value="${e(t.target)}" required /></div>
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("col_interval"))}</label><input name="interval" type="number" value="${t.interval}" min="5" /></div>
          <div class="field"><label>${e(a("timeout_sec"))}</label><input name="timeout" type="number" value="${t.timeout}" min="1" /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("confirmations"))}</label><input name="confirmations" type="number" value="${t.confirmations??1}" min="1" max="20" /></div>
          <div class="field"><label>${e(a("enabled"))}</label>
            <select name="enabled">
              <option value="true" ${t.enabled?"selected":""}>${e(a("yes"))}</option>
              <option value="false" ${t.enabled?"":"selected"}>${e(a("no"))}</option>
            </select>
          </div>
        </div>
        <p class="muted">${e(a("confirmations_hint"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${e(a("save"))}</button>
      </form>
    </section>
    <section class="panel" style="margin-bottom:1rem">
      <h2>${e(a("alerts"))}</h2>
      <form id="attach-notif" class="attach-row">
        <div class="field" style="margin-bottom:0">
          <label>${e(a("alert"))}</label>
          <select name="notification_id">${i||`<option value="">${e(a("no_alerts"))}</option>`}</select>
        </div>
        <button class="btn btn-primary" type="submit" ${o.length===0?"disabled":""}>${e(a("attach"))}</button>
      </form>
      ${l?`<div class="table-wrap" style="margin-top:1rem"><table class="table"><thead><tr><th>${e(a("col_notification"))}</th><th>${e(a("col_config"))}</th><th>${e(a("col_enabled"))}</th><th></th></tr></thead><tbody>${l}</tbody></table></div>`:`<p class="list-empty">${e(a("not_attached"))}</p>`}
    </section>
    <section class="panel">
      <h2>${e(a("check_history"))}</h2>
      <p class="muted">${e(a("check_history_hint"))}</p>
      ${n.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_status"))}</th><th>${e(a("col_code"))}</th><th>${e(a("col_latency"))}</th><th>${e(a("col_error"))}</th><th>${e(a("col_at"))}</th></tr></thead><tbody>${s}</tbody></table></div>`:`<p class="list-empty">${e(a("no_checks"))}</p>`}
    </section>
  `,!0)}function Re(t,n){try{const o=JSON.parse(n);if(t==="telegram"){const s=o.token?`${o.token.slice(0,8)}…`:"—";return`chat: ${e(o.chat_id||"—")} · token: ${e(s)}`}if(t==="webhook")return`url: ${e(o.url||"—")}`}catch{}return e(n)}function me(t){return t==="webhook"?`
      <div class="field" data-cfg="webhook">
        <label>${e(a("webhook_url"))}</label>
        <input name="webhook_url" type="url" placeholder="https://hooks.example.com/pinger" required />
      </div>
    `:`
    <div class="form-row cols-2" data-cfg="telegram">
      <div class="field">
        <label>${e(a("bot_token"))}</label>
        <input name="telegram_token" type="text" placeholder="123456:AAH..." required autocomplete="off" />
      </div>
      <div class="field">
        <label>${e(a("chat_id"))}</label>
        <input name="telegram_chat_id" type="text" placeholder="-1001234567890" required />
      </div>
    </div>
  `}function Ue(t){const n=t.map(o=>`
      <tr>
        <td>${e(o.type)} #${o.id}</td>
        <td>${Re(o.type,o.config)}</td>
        <td>${o.enabled?`<span class="badge badge-up">${e(a("badge_on"))}</span>`:`<span class="badge badge-off">${e(a("badge_off"))}</span>`}</td>
        <td class="row-actions">
          <button class="btn btn-ghost" data-toggle="${o.id}" data-enabled="${o.enabled?"1":"0"}" type="button">${e(o.enabled?a("disable"):a("enable"))}</button>
          <button class="btn btn-ghost" data-del="${o.id}" type="button">${e(a("delete"))}</button>
        </td>
      </tr>`).join("");return P("/notifications",`
    <section class="panel" style="margin-bottom:1rem">
      <h2>${e(a("new_alert"))}</h2>
      <form id="notif-form">
        <div class="field"><label>${e(a("type"))}</label>
          <select name="type" id="notif-type">
            <option value="telegram">Telegram</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
        <div id="notif-fields">${me("telegram")}</div>
        <div class="field"><label>${e(a("enabled"))}</label>
          <select name="enabled">
            <option value="true">${e(a("yes"))}</option>
            <option value="false">${e(a("no"))}</option>
          </select>
        </div>
        <p class="muted" id="notif-hint">${e(a("hint_telegram"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${e(a("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${e(a("list"))}</h2>
      ${t.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_type"))}</th><th>${e(a("col_config"))}</th><th>${e(a("col_enabled"))}</th><th></th></tr></thead><tbody>${n}</tbody></table></div>`:`<p class="list-empty">${e(a("empty"))}</p>`}
    </section>
  `,!0)}function ze(t,n){return JSON.stringify(t==="webhook"?{url:String(n.get("webhook_url")||"").trim()}:{token:String(n.get("telegram_token")||"").trim(),chat_id:String(n.get("telegram_chat_id")||"").trim()})}function Fe(t){const n=t.querySelector("#notif-type"),o=t.querySelector("#notif-fields"),s=t.querySelector("#notif-hint");if(!n||!o)return;const i=()=>{const l=n.value;o.innerHTML=me(l),s&&(s.textContent=a(l==="webhook"?"hint_webhook":"hint_telegram"))};n.addEventListener("change",i)}function Je(t){const n=t.map(o=>`
      <tr>
        <td><a href="/status-pages/${o.id}" data-link>${e(o.name)}</a></td>
        <td>${e(o.slug)}</td>
        <td>${o.public?e(a("public_label")):e(a("private"))}</td>
        <td>${o.public?`<a href="/s/${e(o.slug)}" data-link>/s/${e(o.slug)}</a>`:"—"}</td>
        <td><button class="btn btn-ghost" data-del="${o.id}" type="button">${e(a("delete"))}</button></td>
      </tr>`).join("");return P("/status-pages",`
    <section class="panel" style="margin-bottom:1rem">
      <h2>${e(a("new_status_page"))}</h2>
      <form id="sp-form">
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("col_name"))}</label><input name="name" required /></div>
          <div class="field"><label>${e(a("col_slug"))}</label><input name="slug" required pattern="[a-z0-9\\-]+" placeholder="my-status" /></div>
        </div>
        <div class="field"><label>${e(a("public"))}</label>
          <select name="public"><option value="true">${e(a("yes"))}</option><option value="false">${e(a("no"))}</option></select>
        </div>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${e(a("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${e(a("list"))}</h2>
      ${t.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_name"))}</th><th>${e(a("col_slug"))}</th><th>${e(a("col_visibility"))}</th><th>${e(a("col_link"))}</th><th></th></tr></thead><tbody>${n}</tbody></table></div>`:`<p class="list-empty">${e(a("empty"))}</p>`}
    </section>
  `,!0)}function Ve(t,n){const o=new Set((t.monitors||[]).map(l=>l.id)),s=n.filter(l=>!o.has(l.id)).map(l=>`<option value="${l.id}">${e(l.name)}</option>`).join(""),i=(t.monitors||[]).map(l=>`
      <tr data-monitor-id="${l.id}">
        <td>${e(l.name)}</td>
        <td class="js-status">${T(l)}</td>
        <td><button class="btn btn-ghost" type="button" data-detach="${l.id}">${e(a("detach"))}</button></td>
      </tr>`).join("");return P("/status-pages",`
    <section class="panel" style="margin-bottom:1rem">
      <div class="panel-head">
        <h2>${e(t.name)}</h2>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-del="${t.id}">${e(a("delete"))}</button>
          <a href="/status-pages" data-link>${e(a("back"))}</a>
        </div>
      </div>
      <p class="muted">slug: <code>${e(t.slug)}</code> · ${t.public?`<a href="/s/${e(t.slug)}" data-link>${e(a("public_page"))}</a>`:e(a("private"))}</p>
      <form id="sp-edit">
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("col_name"))}</label><input name="name" value="${e(t.name)}" required /></div>
          <div class="field"><label>${e(a("col_slug"))}</label><input name="slug" value="${e(t.slug)}" required /></div>
        </div>
        <div class="field"><label>${e(a("public"))}</label>
          <select name="public">
            <option value="true" ${t.public?"selected":""}>${e(a("yes"))}</option>
            <option value="false" ${t.public?"":"selected"}>${e(a("no"))}</option>
          </select>
        </div>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${e(a("save"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${e(a("monitors_on_page"))}</h2>
      <form id="attach-monitor" class="attach-row">
        <div class="field" style="margin-bottom:0">
          <label>${e(a("col_monitor"))}</label>
          <select name="monitor_id">${s||`<option value="">${e(a("no_available"))}</option>`}</select>
        </div>
        <button class="btn btn-primary" type="submit" ${s?"":"disabled"}>${e(a("attach"))}</button>
      </form>
      ${i?`<div class="table-wrap" style="margin-top:1rem"><table class="table"><thead><tr><th>${e(a("col_monitor"))}</th><th>${e(a("col_status"))}</th><th></th></tr></thead><tbody>${i}</tbody></table></div>`:`<p class="list-empty">${e(a("not_attached"))}</p>`}
    </section>
    ${t.public?Me(t.slug):""}
  `,!0)}function Be(t){return P("/profile",`
    <section class="panel">
      <h2>${e(a("profile_title"))}</h2>
      <div class="grid two" style="margin-bottom:1.25rem">
        <div class="stat"><div class="k">${e(a("role"))}</div><div class="v">${e(t.role)}</div></div>
        <div class="stat"><div class="k">${e(a("status_label"))}</div><div class="v">${e(t.status)}</div></div>
      </div>
      <form id="profile-form">
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("email"))}</label><input name="email" type="email" value="${e(t.email)}" required /></div>
          <div class="field"><label>${e(a("username"))}</label><input name="username" minlength="3" value="${e(t.username)}" required /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${e(a("current_password"))}</label><input name="current_password" type="password" autocomplete="current-password" /></div>
          <div class="field"><label>${e(a("new_password"))}</label><input name="password" type="password" minlength="8" autocomplete="new-password" /></div>
        </div>
        <div class="field">
          <label>${e(a("api_key"))}</label>
          <div class="row">
            <input name="api_key" value="${e(t.api_key||"")}" readonly style="flex:1" />
            <button class="btn btn-ghost" type="button" id="copy-api">${e(a("copy"))}</button>
          </div>
        </div>
        <p class="error" id="error"></p>
        <p class="muted" id="profile-ok" style="min-height:1.2rem"></p>
        <div class="row">
          <button class="btn btn-primary" type="submit">${e(a("save"))}</button>
          <button class="btn btn-ghost" type="button" id="regen-api">${e(a("regenerate_api_key"))}</button>
        </div>
      </form>
    </section>
  `,!0)}function We(t,n,o){const s=o.map(i=>`
      <tr data-monitor-id="${i.id}">
        <td>${e(i.name)}</td>
        <td>${e(i.type)}</td>
        <td class="js-status">${T(i)}</td>
        <td>${z(i)}</td>
        <td class="js-latency">${i.last_latency!=null?e(i.last_latency)+" ms":"—"}</td>
        <td class="js-checked">${e(i.last_checked_at||"—")}</td>
      </tr>`).join("");return`
    <div class="shell shell-wide">
      <section class="hero">
        <p class="pulse">${e(a("public_label"))}</p>
        <h1 class="brand">${e(t)}</h1>
        <p class="tagline">${e(a("status_page_tag"))} <code>${e(n)}</code></p>
      </section>
      <section class="panel">
        ${o.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_service"))}</th><th>${e(a("col_type"))}</th><th>${e(a("col_status"))}</th><th>${e(a("col_uptime"))}</th><th>${e(a("col_latency"))}</th><th>${e(a("col_checked"))}</th></tr></thead><tbody>${s}</tbody></table></div>`:`<p class="list-empty">${e(a("no_monitors_short"))}</p>`}
      </section>
      ${O()}
    </div>
  `}function Ke(t,n,o,s){const i=o.some(v=>v.enabled&&v.last_status===!1),l=o.length===0?a("no_monitors_short"):a(i?"some_down":"all_operational"),d=o.map(v=>`
      <tr data-monitor-id="${v.id}">
        <td>${e(v.name)}</td>
        <td class="cell-tight js-status">${T(v)}</td>
        <td class="cell-tight">${z(v)}</td>
        <td class="cell-tight js-latency">${v.last_latency!=null?e(v.last_latency)+" ms":"—"}</td>
      </tr>`).join("");return`
    <div class="embed-shell ${s==="light"?"theme-light":"theme-dark"}">
      <div class="embed-card">
        <div class="embed-head">
          <h1>${e(t)}</h1>
          <p class="embed-summary js-embed-summary">${e(l)}</p>
        </div>
        ${o.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${e(a("col_service"))}</th><th>${e(a("col_status"))}</th><th>${e(a("col_uptime"))}</th><th>${e(a("col_latency"))}</th></tr></thead><tbody>${d}</tbody></table></div>`:`<p class="list-empty">${e(a("no_monitors_short"))}</p>`}
        <p class="embed-foot"><a href="${e(pe())}/s/${e(n)}" target="_blank" rel="noopener">${e(a("powered_by"))}</a></p>
      </div>
    </div>
  `}function re(t){const n=document.querySelector(".embed-shell");if(!n)return;if(t){n.classList.add("fill-height");return}if(window.parent===window)return;const o=()=>{const s=Math.ceil(n.getBoundingClientRect().height);s>0&&window.parent.postMessage({type:"pinger-embed-resize",height:s},"*")};o(),requestAnimationFrame(o),window.addEventListener("load",o),typeof ResizeObserver<"u"&&new ResizeObserver(()=>o()).observe(n)}async function F(){var l,d,$,v,G,Y,Z,Q,X,ee,te,ae;Pe();const t=Te(),n=!!D(),o=new URLSearchParams(window.location.search),s=t.match(/^\/embed\/s\/([^/]+)$/);if(s){const h=o.get("lang")||"en",y=o.get("theme")||"dark",k=o.get("fill")==="1"||o.get("height")==="100%";document.documentElement.classList.add("embed-mode"),document.body.classList.add("embed-mode"),y==="light"&&(document.documentElement.classList.add("theme-light"),document.body.classList.add("theme-light")),k&&(document.documentElement.classList.add("fill-height"),document.body.classList.add("fill-height"));try{const c=await E.public(s[1]);document.documentElement.lang=h==="zh"?"zh-CN":h,r.innerHTML=J(h,()=>Ke(c.name,c.slug,c.monitors||[],y)),re(k),L=ie(c.slug,m=>{J(h,()=>R(r,m))})}catch(c){r.innerHTML=J(h,()=>`<div class="embed-shell ${y==="light"?"theme-light":""}"><div class="embed-card"><p class="error">${e(c instanceof Error?c.message:a("not_found"))}</p></div></div>`),re(k)}return}document.documentElement.classList.remove("embed-mode","theme-light","fill-height"),document.body.classList.remove("embed-mode","theme-light","fill-height");const i=t.match(/^\/s\/([^/]+)$/);if(i){try{const h=await E.public(i[1]);r.innerHTML=We(h.name,h.slug,h.monitors||[]),M(r),L=ie(h.slug,y=>R(r,y))}catch(h){r.innerHTML=`<div class="shell"><section class="panel"><h2>${e(a("not_found"))}</h2><p class="error">${e(h instanceof Error?h.message:"error")}</p></section>${O()}</div>`,M(r)}return}if(t==="/login"){if(n)return b("/");r.innerHTML=De(),M(r),r.querySelectorAll("a[data-link]").forEach(h=>h.addEventListener("click",y=>{y.preventDefault(),b(h.getAttribute("href")||"/")})),(l=r.querySelector("#login-form"))==null||l.addEventListener("submit",async h=>{h.preventDefault();const y=new FormData(h.target),k=r.querySelector("#error");try{V(await _e(String(y.get("login")),String(y.get("password")))),b("/")}catch(c){k.textContent=c instanceof Error?c.message:"error"}});return}if(t==="/register"){if(n)return b("/");r.innerHTML=Oe(),M(r),r.querySelectorAll("a[data-link]").forEach(h=>h.addEventListener("click",y=>{y.preventDefault(),b(h.getAttribute("href")||"/")})),(d=r.querySelector("#register-form"))==null||d.addEventListener("submit",async h=>{h.preventDefault();const y=new FormData(h.target),k=r.querySelector("#error");try{V(await fe(String(y.get("email")),String(y.get("username")),String(y.get("password")))),b("/")}catch(c){k.textContent=c instanceof Error?c.message:"error"}});return}if(!n)return b("/login");try{const h=await ve();if(t==="/"){const c=await w.list();r.innerHTML=je(h,c),N(r);const m=D();m&&(L=oe(m,g=>R(r,g)));return}if(t==="/monitors"){const c=await w.list();r.innerHTML=He(c),N(r);const m=D();m&&(L=oe(m,g=>R(r,g))),($=r.querySelector("#monitor-form"))==null||$.addEventListener("submit",async g=>{g.preventDefault();const u=new FormData(g.target),p=r.querySelector("#error");try{await w.create({name:String(u.get("name")),type:String(u.get("type")),target:String(u.get("target")),interval:Number(u.get("interval")),timeout:Number(u.get("timeout")),confirmations:Number(u.get("confirmations"))||1,enabled:String(u.get("enabled"))==="true"}),b("/monitors")}catch(_){p.textContent=_ instanceof Error?_.message:"error"}}),r.querySelectorAll("[data-del]").forEach(g=>{g.addEventListener("click",async()=>{await x(()=>w.remove(Number(g.dataset.del)))&&b("/monitors")})});return}const y=t.match(/^\/monitors\/(\d+)$/);if(y){const c=Number(y[1]),[m,g,u]=await Promise.all([w.get(c),w.checks(c),q.list()]);r.innerHTML=Ie(m,g,u),N(r),r.querySelectorAll("[data-del]").forEach(p=>{p.addEventListener("click",async()=>{await x(()=>w.remove(Number(p.dataset.del)))&&b("/monitors")})}),(v=r.querySelector("#monitor-edit"))==null||v.addEventListener("submit",async p=>{p.preventDefault();const _=new FormData(p.target),S=r.querySelector("#error");try{await w.update(c,{name:String(_.get("name")),type:String(_.get("type")),target:String(_.get("target")),interval:Number(_.get("interval")),timeout:Number(_.get("timeout")),confirmations:Number(_.get("confirmations"))||1,enabled:String(_.get("enabled"))==="true"}),b(`/monitors/${c}`)}catch(j){S.textContent=j instanceof Error?j.message:"error"}}),(G=r.querySelector("#attach-notif"))==null||G.addEventListener("submit",async p=>{p.preventDefault();const _=new FormData(p.target),S=Number(_.get("notification_id"));S&&(await w.attachNotification(c,S),b(`/monitors/${c}`))}),r.querySelectorAll("[data-detach-notif]").forEach(p=>{p.addEventListener("click",async()=>{await w.detachNotification(c,Number(p.dataset.detachNotif)),b(`/monitors/${c}`)})});return}if(t==="/notifications"){const c=await q.list();r.innerHTML=Ue(c),N(r),Fe(r),(Y=r.querySelector("#notif-form"))==null||Y.addEventListener("submit",async m=>{m.preventDefault();const g=new FormData(m.target),u=r.querySelector("#error"),p=String(g.get("type"));try{await q.create({type:p,config:ze(p,g),enabled:String(g.get("enabled"))==="true"}),b("/notifications")}catch(_){u.textContent=_ instanceof Error?_.message:"error"}}),r.querySelectorAll("[data-toggle]").forEach(m=>{m.addEventListener("click",async()=>{const g=Number(m.dataset.toggle),u=m.dataset.enabled!=="1";try{await q.update(g,{enabled:u}),b("/notifications")}catch(p){alert(p instanceof Error?p.message:"error")}})}),r.querySelectorAll("[data-del]").forEach(m=>{m.addEventListener("click",async()=>{await x(()=>q.remove(Number(m.dataset.del)))&&b("/notifications")})});return}if(t==="/status-pages"){const c=await E.list();r.innerHTML=Je(c),N(r),(Z=r.querySelector("#sp-form"))==null||Z.addEventListener("submit",async m=>{m.preventDefault();const g=new FormData(m.target),u=r.querySelector("#error");try{await E.create({name:String(g.get("name")),slug:String(g.get("slug")),public:String(g.get("public"))==="true"}),b("/status-pages")}catch(p){u.textContent=p instanceof Error?p.message:"error"}}),r.querySelectorAll("[data-del]").forEach(m=>{m.addEventListener("click",async()=>{await x(()=>E.remove(Number(m.dataset.del)))&&b("/status-pages")})});return}if(t==="/profile"){r.innerHTML=Be(h),N(r);const c=r.querySelector("#profile-ok"),m=r.querySelector("#error"),g=r.querySelector("input[name=api_key]");(Q=r.querySelector("#copy-api"))==null||Q.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(g.value),c.textContent=a("copied")}catch{c.textContent=""}}),(X=r.querySelector("#regen-api"))==null||X.addEventListener("click",async()=>{m.textContent="",c.textContent="";try{const u=await ne({regenerate_api_key:!0});g.value=u.api_key||"",c.textContent=a("profile_saved")}catch(u){m.textContent=u instanceof Error?u.message:"error"}}),(ee=r.querySelector("#profile-form"))==null||ee.addEventListener("submit",async u=>{u.preventDefault(),m.textContent="",c.textContent="";const p=new FormData(u.target),_={email:String(p.get("email")||"").trim(),username:String(p.get("username")||"").trim()},S=String(p.get("password")||""),j=String(p.get("current_password")||"");S&&(_.password=S,_.current_password=j);try{const H=await ne(_);c.textContent=a("profile_saved"),u.target.querySelector("input[name=password]").value="",u.target.querySelector("input[name=current_password]").value="",g.value=H.api_key||""}catch(H){m.textContent=H instanceof Error?H.message:"error"}});return}const k=t.match(/^\/status-pages\/(\d+)$/);if(k){const c=Number(k[1]),[m,g]=await Promise.all([E.get(c),w.list()]);r.innerHTML=Ve(m,g),N(r),r.querySelectorAll("[data-del]").forEach(u=>{u.addEventListener("click",async()=>{await x(()=>E.remove(Number(u.dataset.del)))&&b("/status-pages")})}),(te=r.querySelector("#sp-edit"))==null||te.addEventListener("submit",async u=>{u.preventDefault();const p=new FormData(u.target),_=r.querySelector("#error");try{await E.update(c,{name:String(p.get("name")),slug:String(p.get("slug")),public:String(p.get("public"))==="true"}),b(`/status-pages/${c}`)}catch(S){_.textContent=S instanceof Error?S.message:"error"}}),(ae=r.querySelector("#attach-monitor"))==null||ae.addEventListener("submit",async u=>{u.preventDefault();const p=new FormData(u.target),_=Number(p.get("monitor_id"));_&&(await E.attachMonitor(c,_),b(`/status-pages/${c}`))}),r.querySelectorAll("[data-detach]").forEach(u=>{u.addEventListener("click",async()=>{await E.detachMonitor(c,Number(u.dataset.detach)),b(`/status-pages/${c}`)})});return}b("/")}catch{K(),b("/login")}}F();
