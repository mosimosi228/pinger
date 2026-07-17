(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function i(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(s){if(s.ep)return;s.ep=!0;const r=i(s);fetch(s.href,r)}})();const ae="pinger.access",ne="pinger.refresh";function J(){return localStorage.getItem(ae)}function $e(){return localStorage.getItem(ne)}function te(e){localStorage.setItem(ae,e.access_token),localStorage.setItem(ne,e.refresh_token)}function ie(){localStorage.removeItem(ae),localStorage.removeItem(ne)}async function we(e){try{const n=await e.json();return n.error||n.status||e.statusText}catch{return e.statusText||"request failed"}}async function $(e,n={},i=!1){const o=new Headers(n.headers||{});if(!o.has("Content-Type")&&n.body&&o.set("Content-Type","application/json"),i){const c=J();c&&o.set("Authorization",`Bearer ${c}`)}let s=await fetch(e,{...n,headers:o});if(i&&s.status===401&&await Se()&&(o.set("Authorization",`Bearer ${J()}`),s=await fetch(e,{...n,headers:o})),!s.ok)throw new Error(await we(s));if(s.status===204)return;const r=await s.text();if(r)return JSON.parse(r)}async function Se(){const e=$e();if(!e)return!1;try{const n=await $("/auth/refresh",{method:"POST",body:JSON.stringify({refresh_token:e})});return te(n),!0}catch{return ie(),!1}}function ke(e,n,i){return $("/auth/register",{method:"POST",body:JSON.stringify({email:e,username:n,password:i})})}function Ee(e,n){return $("/auth/login",{method:"POST",body:JSON.stringify({login:e,password:n})})}function Le(){return $("/api/v1/me",{},!0)}function de(e){return $("/api/v1/me",{method:"PATCH",body:JSON.stringify(e)},!0)}const L={list:()=>$("/api/v1/monitors",{},!0),get:e=>$(`/api/v1/monitors/${e}`,{},!0),create:e=>$("/api/v1/monitors",{method:"POST",body:JSON.stringify(e)},!0),update:(e,n)=>$(`/api/v1/monitors/${e}`,{method:"PATCH",body:JSON.stringify(n)},!0),remove:e=>$(`/api/v1/monitors/${e}`,{method:"DELETE"},!0),checks:e=>$(`/api/v1/monitors/${e}/checks`,{},!0),attachNotification:(e,n)=>$(`/api/v1/monitors/${e}/notifications`,{method:"POST",body:JSON.stringify({id:n})},!0),detachNotification:(e,n)=>$(`/api/v1/monitors/${e}/notifications/${n}`,{method:"DELETE"},!0)},U={list:()=>$("/api/v1/notifications",{},!0),create:e=>$("/api/v1/notifications",{method:"POST",body:JSON.stringify(e)},!0),update:(e,n)=>$(`/api/v1/notifications/${e}`,{method:"PATCH",body:JSON.stringify(n)},!0),remove:e=>$(`/api/v1/notifications/${e}`,{method:"DELETE"},!0)},A={list:()=>$("/api/v1/status-pages",{},!0),get:e=>$(`/api/v1/status-pages/${e}`,{},!0),create:e=>$("/api/v1/status-pages",{method:"POST",body:JSON.stringify(e)},!0),update:(e,n)=>$(`/api/v1/status-pages/${e}`,{method:"PATCH",body:JSON.stringify(n)},!0),remove:e=>$(`/api/v1/status-pages/${e}`,{method:"DELETE"},!0),attachMonitor:(e,n)=>$(`/api/v1/status-pages/${e}/monitors`,{method:"POST",body:JSON.stringify({id:n})},!0),detachMonitor:(e,n)=>$(`/api/v1/status-pages/${e}/monitors/${n}`,{method:"DELETE"},!0),public:e=>$(`/api/public/s/${encodeURIComponent(e)}`)},Ae=[{code:"en",label:"English"},{code:"ru",label:"Русский"},{code:"es",label:"Español"},{code:"de",label:"Deutsch"},{code:"zh",label:"中文"}],he="pinger_lang",j={nav_aria:"Main menu",nav_dashboard:"Dashboard",nav_monitors:"Monitors",nav_alerts:"Alerts",nav_pages:"Pages",nav_profile:"Profile",menu:"Menu",menu_close:"Close menu",logout:"Log out",live:"live",tagline:"Uptime checks, alerts, and public status pages.",tagline_login:"Uptime monitoring. Sign in to manage checks and alerts.",tagline_register:"Create your Pinger account.",login_title:"Sign in",login_field:"Email or username",password:"Password",sign_in:"Sign in",create_account:"Create account",register_title:"Sign up",email:"Email",username:"Username",register_submit:"Create account",have_account:"Already have an account",hello:"Hello, {name}",monitors:"Monitors",no_monitors:"No monitors yet. {link}.",create_first:"Create the first one",col_name:"Name",col_type:"Type",col_target:"Target",col_status:"Status",col_uptime:"Uptime 1h",col_latency:"Latency",col_checked:"Checked",col_interval:"Interval",col_code:"Code",col_error:"Error",col_at:"At",col_notification:"Notification",col_config:"Config",col_enabled:"Enabled",col_slug:"Slug",col_visibility:"Visibility",col_link:"Link",col_monitor:"Monitor",col_service:"Service",delete:"Delete",new_monitor:"New monitor",target:"Target",interval_sec:"Interval (sec)",timeout_sec:"Timeout (sec)",confirmations:"Confirmations",confirmations_hint:"Alert after N consecutive UP or DOWN checks (1 = immediate).",enabled:"Enabled",yes:"yes",no:"no",create:"Create",list:"List",empty:"Empty",back:"← back",next_check:"Next check",save:"Save",alerts:"Alerts",alert:"Alert",no_alerts:"no alerts",attach:"Attach",detach:"Detach",not_attached:"None attached",check_history:"Check history",check_history_hint:"Only the last hour of checks is kept.",no_checks:"No checks yet — wait for the next scheduler tick",new_alert:"New alert",type:"Type",webhook_url:"Webhook URL",bot_token:"Bot token",chat_id:"Chat ID",hint_telegram:"A message is sent to Telegram when a monitor status changes (up ↔ down).",hint_webhook:"Pinger will POST JSON to the URL when a monitor status changes. Requests include X-Pinger-Signature: sha256=… (HMAC-SHA256 of the body with your API key).",new_status_page:"New status page",public:"Public",private:"private",public_label:"public",public_page:"public page",monitors_on_page:"Monitors on page",no_available:"none available",status_page_tag:"Status page",no_monitors_short:"No monitors",not_found:"Not found",footer_copy:"© {year} Pinger · open source",footer_repo:"Repository",language:"Language",embed:"Embed",embed_iframe:"iframe",embed_script:"Script widget",embed_normal:"Normal widget",embed_mini:"Mini widget",embed_hint:"Paste on another site to show this status page.",badge_up:"up",badge_down:"down",badge_on:"on",badge_off:"off",badge_pending:"pending",enable:"Enable",disable:"Disable",start:"Start",stop:"Stop",placeholder_target:"https://example.com or host:443",all_operational:"All systems operational",some_down:"Some systems are down",status_degraded:"Partial system outage",status_major:"Major system outage",components:"Components",past_incidents:"Past incidents",no_incidents:"No incidents in the last 24 hours",uptime_24h:"24-hour uptime",bar_na:"n/a",bar_hours_ago:"{n}h ago",incident_ongoing:"Ongoing",incident_resolved:"Resolved",powered_by:"Powered by Pinger",confirm_delete:"Delete this item?",delete_failed:"Delete failed",profile_title:"Profile",profile_saved:"Saved",current_password:"Current password",new_password:"New password",api_key:"API key",regenerate_api_key:"Regenerate API key",role:"Role",status_label:"Status",copy:"Copy",copied:"Copied"},Ce={...j,nav_aria:"Основное меню",nav_dashboard:"Дашборд",nav_monitors:"Мониторы",nav_alerts:"Алерты",nav_pages:"Страницы",nav_profile:"Профиль",menu:"Меню",menu_close:"Закрыть меню",logout:"Выйти",tagline:"Проверки доступности, алерты и публичные status pages.",tagline_login:"Мониторинг доступности. Войдите, чтобы управлять проверками и алертами.",tagline_register:"Создайте аккаунт Pinger.",login_title:"Вход",login_field:"Email или username",password:"Пароль",sign_in:"Войти",create_account:"Создать аккаунт",register_title:"Регистрация",username:"Username",register_submit:"Зарегистрироваться",have_account:"Уже есть аккаунт",hello:"Привет, {name}",monitors:"Мониторы",no_monitors:"Пока нет мониторов. {link}.",create_first:"Создайте первый",col_name:"Имя",col_type:"Тип",col_target:"Цель",col_status:"Статус",col_uptime:"Аптайм 1ч",col_latency:"Задержка",col_checked:"Проверено",col_interval:"Интервал",col_code:"Код",col_error:"Ошибка",col_at:"Время",col_notification:"Алерт",col_config:"Конфиг",col_enabled:"Вкл",col_slug:"Slug",col_visibility:"Доступ",col_link:"Ссылка",col_monitor:"Монитор",col_service:"Сервис",delete:"Удалить",new_monitor:"Новый монитор",target:"Цель",interval_sec:"Интервал (сек)",timeout_sec:"Таймаут (сек)",confirmations:"Подтверждения",confirmations_hint:"Алерт после N подряд UP или DOWN (1 = сразу).",enabled:"Включён",yes:"да",no:"нет",create:"Создать",list:"Список",empty:"Пусто",back:"← назад",next_check:"След. проверка",save:"Сохранить",alerts:"Алерты",alert:"Алерт",no_alerts:"нет алертов",attach:"Привязать",detach:"Отвязать",not_attached:"Не привязано",check_history:"История проверок",check_history_hint:"Хранятся только проверки за последний час.",no_checks:"Пока нет checks — подождите следующий тик scheduler",new_alert:"Новый алерт",type:"Тип",hint_telegram:"Сообщение уйдёт в Telegram при смене статуса монитора (up ↔ down).",hint_webhook:"Pinger сделает POST JSON на URL при смене статуса монитора. В запросе будет X-Pinger-Signature: sha256=… (HMAC-SHA256 тела с вашим API-ключом).",new_status_page:"Новая status page",public:"Публичная",private:"private",public_label:"public",public_page:"публичная страница",monitors_on_page:"Мониторы на странице",no_available:"нет доступных",status_page_tag:"Status page",no_monitors_short:"Нет мониторов",not_found:"Не найдено",footer_copy:"© {year} Pinger · open source",footer_repo:"Репозиторий",language:"Язык",embed:"Встраивание",embed_iframe:"iframe",embed_script:"Скрипт-виджет",embed_normal:"Обычный виджет",embed_mini:"Мини-виджет",embed_hint:"Вставьте на другой сайт, чтобы показать эту status page.",badge_on:"вкл",badge_off:"выкл",enable:"Включить",disable:"Выключить",start:"Запустить",stop:"Остановить",placeholder_target:"https://example.com или host:443",all_operational:"Все системы в норме",some_down:"Есть недоступные системы",status_degraded:"Частичный сбой",status_major:"Крупный сбой",components:"Компоненты",past_incidents:"Инциденты",no_incidents:"За последние 24 часа инцидентов не было",uptime_24h:"Аптайм за 24 часа",bar_na:"н/д",bar_hours_ago:"{n} ч назад",incident_ongoing:"Активен",incident_resolved:"Решён",powered_by:"Сделано на Pinger",confirm_delete:"Удалить этот элемент?",delete_failed:"Не удалось удалить",profile_title:"Профиль",profile_saved:"Сохранено",current_password:"Текущий пароль",new_password:"Новый пароль",api_key:"API-ключ",regenerate_api_key:"Обновить API-ключ",role:"Роль",status_label:"Статус",copy:"Копировать",copied:"Скопировано"},Ne={...j,nav_aria:"Menú principal",nav_dashboard:"Panel",nav_monitors:"Monitores",nav_alerts:"Alertas",nav_pages:"Páginas",nav_profile:"Perfil",menu:"Menú",menu_close:"Cerrar menú",logout:"Salir",tagline:"Comprobaciones de disponibilidad, alertas y páginas de estado públicas.",tagline_login:"Monitorización de disponibilidad. Inicia sesión para gestionar comprobaciones y alertas.",tagline_register:"Crea tu cuenta de Pinger.",login_title:"Iniciar sesión",login_field:"Email o usuario",password:"Contraseña",sign_in:"Entrar",create_account:"Crear cuenta",register_title:"Registro",username:"Usuario",register_submit:"Registrarse",have_account:"Ya tengo cuenta",hello:"Hola, {name}",monitors:"Monitores",no_monitors:"Aún no hay monitores. {link}.",create_first:"Crea el primero",col_name:"Nombre",col_type:"Tipo",col_target:"Destino",col_status:"Estado",col_uptime:"Uptime 1h",col_latency:"Latencia",col_checked:"Comprobado",col_interval:"Intervalo",col_code:"Código",col_error:"Error",col_at:"Fecha",col_notification:"Alerta",col_config:"Config",col_enabled:"Activo",col_visibility:"Visibilidad",col_link:"Enlace",col_monitor:"Monitor",col_service:"Servicio",delete:"Eliminar",new_monitor:"Nuevo monitor",target:"Destino",interval_sec:"Intervalo (seg)",timeout_sec:"Timeout (seg)",confirmations:"Confirmaciones",confirmations_hint:"Alerta tras N comprobaciones UP o DOWN seguidas (1 = inmediata).",enabled:"Activo",yes:"sí",no:"no",create:"Crear",list:"Lista",empty:"Vacío",back:"← atrás",next_check:"Próxima comprobación",save:"Guardar",alerts:"Alertas",alert:"Alerta",no_alerts:"sin alertas",attach:"Vincular",detach:"Desvincular",not_attached:"Sin vincular",check_history:"Historial de comprobaciones",check_history_hint:"Solo se guardan las comprobaciones de la última hora.",no_checks:"Aún no hay checks — espera el siguiente tick del scheduler",new_alert:"Nueva alerta",type:"Tipo",hint_telegram:"Se envía un mensaje a Telegram cuando cambia el estado del monitor (up ↔ down).",hint_webhook:"Pinger hará POST JSON a la URL cuando cambie el estado del monitor. Incluye X-Pinger-Signature: sha256=… (HMAC-SHA256 del cuerpo con tu API key).",new_status_page:"Nueva status page",public:"Pública",public_page:"página pública",monitors_on_page:"Monitores en la página",no_available:"ninguno disponible",no_monitors_short:"Sin monitores",not_found:"No encontrado",footer_repo:"Repositorio",language:"Idioma",embed:"Integrar",embed_script:"Widget script",embed_normal:"Widget normal",embed_mini:"Widget mini",embed_hint:"Pégalo en otro sitio para mostrar esta status page.",badge_on:"activo",enable:"Activar",disable:"Desactivar",start:"Iniciar",stop:"Detener",placeholder_target:"https://example.com o host:443",all_operational:"Todos los sistemas operativos",some_down:"Algunos sistemas están caídos",status_degraded:"Interrupción parcial",status_major:"Interrupción mayor",components:"Componentes",past_incidents:"Incidentes",no_incidents:"Sin incidentes en las últimas 24 horas",uptime_24h:"Disponibilidad 24 h",bar_na:"n/d",bar_hours_ago:"hace {n} h",incident_ongoing:"En curso",incident_resolved:"Resuelto",powered_by:"Hecho con Pinger"},Pe={...j,nav_aria:"Hauptmenü",nav_dashboard:"Dashboard",nav_monitors:"Monitore",nav_alerts:"Alerts",nav_pages:"Seiten",nav_profile:"Profil",menu:"Menü",menu_close:"Menü schließen",logout:"Abmelden",tagline:"Verfügbarkeitschecks, Alerts und öffentliche Statusseiten.",tagline_login:"Uptime-Monitoring. Melde dich an, um Checks und Alerts zu verwalten.",tagline_register:"Erstelle dein Pinger-Konto.",login_title:"Anmelden",login_field:"E-Mail oder Benutzername",password:"Passwort",sign_in:"Anmelden",create_account:"Konto erstellen",register_title:"Registrierung",username:"Benutzername",register_submit:"Registrieren",have_account:"Bereits ein Konto",hello:"Hallo, {name}",monitors:"Monitore",no_monitors:"Noch keine Monitore. {link}.",create_first:"Ersten erstellen",col_name:"Name",col_type:"Typ",col_target:"Ziel",col_status:"Status",col_uptime:"Uptime 1h",col_latency:"Latenz",col_checked:"Geprüft",col_interval:"Intervall",col_code:"Code",col_error:"Fehler",col_at:"Zeit",col_notification:"Alert",col_config:"Config",col_enabled:"Aktiv",col_visibility:"Sichtbarkeit",col_link:"Link",col_monitor:"Monitor",col_service:"Service",delete:"Löschen",new_monitor:"Neuer Monitor",target:"Ziel",interval_sec:"Intervall (Sek)",timeout_sec:"Timeout (Sek)",confirmations:"Bestätigungen",confirmations_hint:"Alert nach N aufeinanderfolgenden UP/DOWN-Checks (1 = sofort).",enabled:"Aktiv",yes:"ja",no:"nein",create:"Erstellen",list:"Liste",empty:"Leer",back:"← zurück",next_check:"Nächster Check",save:"Speichern",alerts:"Alerts",alert:"Alert",no_alerts:"keine Alerts",attach:"Verknüpfen",detach:"Trennen",not_attached:"Nicht verknüpft",check_history:"Check-Verlauf",check_history_hint:"Es werden nur Checks der letzten Stunde gespeichert.",no_checks:"Noch keine Checks — warte auf den nächsten Scheduler-Tick",new_alert:"Neuer Alert",type:"Typ",hint_telegram:"Bei Statuswechsel (up ↔ down) wird eine Telegram-Nachricht gesendet.",hint_webhook:"Pinger sendet bei Statuswechsel ein POST JSON an die URL. Header X-Pinger-Signature: sha256=… (HMAC-SHA256 des Body mit deinem API-Key).",new_status_page:"Neue Statusseite",public:"Öffentlich",public_page:"öffentliche Seite",monitors_on_page:"Monitore auf der Seite",no_available:"keine verfügbar",no_monitors_short:"Keine Monitore",not_found:"Nicht gefunden",footer_repo:"Repository",language:"Sprache",embed:"Einbetten",embed_script:"Script-Widget",embed_normal:"Normales Widget",embed_mini:"Mini-Widget",embed_hint:"Auf einer anderen Website einfügen, um diese Statusseite zu zeigen.",badge_on:"an",enable:"Aktivieren",disable:"Deaktivieren",start:"Starten",stop:"Stoppen",placeholder_target:"https://example.com oder host:443",all_operational:"Alle Systeme betriebsbereit",some_down:"Einige Systeme sind ausgefallen",status_degraded:"Teilweise Störung",status_major:"Schwere Störung",components:"Komponenten",past_incidents:"Vorfälle",no_incidents:"Keine Vorfälle in den letzten 24 Stunden",uptime_24h:"24-Stunden-Uptime",bar_na:"k. A.",bar_hours_ago:"vor {n} Std.",incident_ongoing:"Laufend",incident_resolved:"Behoben",powered_by:"Powered by Pinger"},qe={...j,nav_aria:"主菜单",nav_dashboard:"仪表盘",nav_monitors:"监控",nav_alerts:"告警",nav_pages:"状态页",nav_profile:"个人资料",menu:"菜单",menu_close:"关闭菜单",logout:"退出",tagline:"可用性检测、告警与公开状态页。",tagline_login:"可用性监控。登录以管理检测与告警。",tagline_register:"创建你的 Pinger 账户。",login_title:"登录",login_field:"邮箱或用户名",password:"密码",sign_in:"登录",create_account:"创建账户",register_title:"注册",username:"用户名",register_submit:"注册",have_account:"已有账户",hello:"你好，{name}",monitors:"监控",no_monitors:"还没有监控。{link}。",create_first:"创建第一个",col_name:"名称",col_type:"类型",col_target:"目标",col_status:"状态",col_uptime:"1小时可用性",col_latency:"延迟",col_checked:"检查时间",col_interval:"间隔",col_code:"状态码",col_error:"错误",col_at:"时间",col_notification:"告警",col_config:"配置",col_enabled:"启用",col_visibility:"可见性",col_link:"链接",col_monitor:"监控",col_service:"服务",delete:"删除",new_monitor:"新建监控",target:"目标",interval_sec:"间隔（秒）",timeout_sec:"超时（秒）",confirmations:"连续确认",confirmations_hint:"连续 N 次 UP/DOWN 后发送告警（1 = 立即）。",enabled:"启用",yes:"是",no:"否",create:"创建",list:"列表",empty:"空",back:"← 返回",next_check:"下次检查",save:"保存",alerts:"告警",alert:"告警",no_alerts:"暂无告警",attach:"绑定",detach:"解绑",not_attached:"未绑定",check_history:"检查历史",check_history_hint:"仅保留最近一小时的检查记录。",no_checks:"暂无检查记录 — 请等待下次调度",new_alert:"新建告警",type:"类型",hint_telegram:"监控状态变化（up ↔ down）时会发送 Telegram 消息。",hint_webhook:"监控状态变化时，Pinger 会向该 URL 发送 POST JSON，并带上 X-Pinger-Signature: sha256=…（用你的 API key 对 body 做 HMAC-SHA256）。",new_status_page:"新建状态页",public:"公开",public_page:"公开页面",monitors_on_page:"页面上的监控",no_available:"暂无可用",no_monitors_short:"没有监控",not_found:"未找到",footer_repo:"仓库",language:"语言",embed:"嵌入",embed_script:"脚本小部件",embed_normal:"标准小部件",embed_mini:"迷你小部件",embed_hint:"粘贴到其他网站以显示此状态页。",badge_on:"开",enable:"启用",disable:"禁用",start:"启动",stop:"停止",placeholder_target:"https://example.com 或 host:443",all_operational:"全部正常",some_down:"部分服务异常",status_degraded:"部分故障",status_major:"重大故障",components:"组件",past_incidents:"历史事件",no_incidents:"过去 24 小时无事件",uptime_24h:"24 小时可用性",bar_na:"无数据",bar_hours_ago:"{n} 小时前",incident_ongoing:"进行中",incident_resolved:"已恢复",powered_by:"由 Pinger 提供"},Z={en:j,ru:Ce,es:Ne,de:Pe,zh:qe};function Te(){try{const e=localStorage.getItem(he);if(e&&Z[e])return e}catch{}return"en"}let M=Te();function Me(){return M}function _e(e){if(Z[e]){M=e;try{localStorage.setItem(he,e)}catch{}document.documentElement.lang=e==="zh"?"zh-CN":e}}function a(e,n){return je(M,e,n)}function je(e,n,i){let s=(Z[e]||j)[n]??j[n]??n;if(i)for(const[r,c]of Object.entries(i))s=s.replaceAll(`{${r}}`,String(c));return s}function Y(e,n){const i=M;M=Z[e]?e:"en";try{return n()}finally{M=i}}_e(M);function be(e){return`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}${e}`}function ue(e,n){return fe(`${be("/api/v1/ws")}?token=${encodeURIComponent(e)}`,n)}function pe(e,n){return fe(be(`/api/public/ws/s/${encodeURIComponent(e)}`),n)}function fe(e,n){let i=!1,o=null,s=0,r;const c=()=>{i||(o=new WebSocket(e),o.onopen=()=>{s=0},o.onmessage=S=>{try{const b=JSON.parse(String(S.data));(b==null?void 0:b.type)==="monitor.status"&&b.id!=null&&n(b)}catch{}},o.onclose=()=>{if(i)return;const S=Math.min(15e3,1e3*2**s);s+=1,r=window.setTimeout(c,S)},o.onerror=()=>{o==null||o.close()})};return c(),()=>{i=!0,r&&window.clearTimeout(r),o==null||o.close()}}function xe(e,n){return e?n===!0?`<span class="badge badge-up">${G(a("badge_up"))}</span>`:n===!1?`<span class="badge badge-down">${G(a("badge_down"))}</span>`:`<span class="badge badge-off">${G(a("badge_pending"))}</span>`:`<span class="badge badge-off">${G(a("badge_off"))}</span>`}function Oe(e){return e>=99.95?"100":e>=10?e.toFixed(1):e.toFixed(2)}function G(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function X(e,n){e.querySelectorAll(`[data-monitor-id="${n.id}"]`).forEach(C=>{const I=C.querySelector(".js-status");if(I){const k=n.enabled?n.status:null;I.innerHTML=xe(n.enabled,k)}const R=C.querySelector(".js-latency");R&&(R.textContent=n.latency!=null?`${n.latency} ms`:"—");const h=C.querySelector(".js-checked");h&&(h.textContent=n.checked_at||"—");const y=C.querySelector(".js-uptime");y&&(n.enabled&&n.status&&n.uptime_1h!=null?y.textContent=`${Oe(n.uptime_1h)}%`:y.textContent="—")});const i=Array.from(e.querySelectorAll("[data-monitor-id]"));let o=0,s=0;i.forEach(C=>{C.querySelector(".badge-down")&&(o+=1),C.querySelector(".badge-up")&&(s+=1)});const r=o+s,c=i.length>0;let S="operational",b=a("all_operational"),w="up";c?r===0?(b=a("all_operational"),w="idle"):o===0?(S="operational",b=a("all_operational"),w="up"):o>=r?(S="major_outage",b=a("status_major"),w="down"):(S="degraded",b=a("status_degraded"),w="down"):(b=a("no_monitors_short"),w="idle");const E=e.querySelector(".js-embed-summary");E&&(E.textContent=b);const q=e.querySelector(".js-embed-pill");q&&(q.textContent=b,q.classList.remove("up","down","idle"),q.classList.add(w));const O=e.querySelector(".js-status-banner"),H=e.querySelector(".js-status-banner-text");O&&(O.classList.remove("ok","degraded","major"),O.classList.add(S==="major_outage"?"major":S==="degraded"?"degraded":"ok")),H&&(H.textContent=b)}const l=document.querySelector("#app");let P;function De(){P==null||P(),P=void 0}function He(){return window.location.pathname.replace(/\/+$/,"")||"/"}function v(e){history.pushState({},"",e),ee()}window.addEventListener("popstate",()=>{ee()});function t(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function _(e,n,i=""){return`<td${i?` class="${i}"`:""} data-label="${t(e)}">${n}</td>`}function B(...e){return _("",`<div class="row-actions-inner">${e.join("")}</div>`,"row-actions")}function D(e){return e.enabled?e.last_status===!0?`<span class="badge badge-up">${t(a("badge_up"))}</span>`:e.last_status===!1?`<span class="badge badge-down">${t(a("badge_down"))}</span>`:`<span class="badge badge-off">${t(a("badge_pending"))}</span>`:`<span class="badge badge-off">${t(a("badge_off"))}</span>`}function Q(e){return e.enabled&&e.last_status===!0&&e.uptime_1h!=null?`<span class="js-uptime">${t(ce(e.uptime_1h))}%</span>`:'<span class="js-uptime">—</span>'}function oe(e){switch(e){case"major_outage":return a("status_major");case"degraded":return a("status_degraded");default:return a("all_operational")}}function se(e){switch(e){case"major_outage":return"major";case"degraded":return"degraded";default:return"ok"}}function re(e){const i=(e&&e.length===24?e:Array.from({length:24},()=>({hour:"",total:0}))).map((o,s)=>{const r=23-s;let c="na",S=a("bar_na");if(o.total>0&&o.uptime_pct!=null){const w=o.uptime_pct;w>=99.5?c="ok":w>=80?c="partial":c="bad",S=`${ce(w)}%`}const b=`${S} · ${a("bar_hours_ago").replace("{n}",String(r))}`;return`<span class="hour-seg ${c}" title="${t(b)}"></span>`}).join("");return`<div class="hour-bar" role="img" aria-label="${t(a("uptime_24h"))}">${i}</div>`}function Ie(e){return[...e].sort((n,i)=>{const o=!n.resolved_at,s=!i.resolved_at;return o!==s?o?-1:1:i.started_at.localeCompare(n.started_at)})}function Re(e){const n=!e.resolved_at,i=(e.message||e.title||"").trim()||"—",o=n?`${t(e.started_at)} · ${t(a("incident_ongoing"))}`:`${t(e.started_at)} → ${t(e.resolved_at)}`;return`
    <li class="incident-item${n?" open":""}">
      <div class="incident-head">
        <span class="incident-name">${t(e.monitor_name)}</span>
        <span class="incident-state">${t(a(n?"incident_ongoing":"incident_resolved"))}</span>
      </div>
      <p class="incident-msg">${t(i)}</p>
      <p class="incident-time">${o}</p>
    </li>`}function Ue(e){return e.map(n=>`
      <li class="status-component" data-monitor-id="${n.id}">
        <div class="status-component-top">
          <div class="status-component-title">
            <span class="status-component-name">${t(n.name)}</span>
            <span class="js-status">${D(n)}</span>
          </div>
          <div class="status-component-meta">
            <span><span class="meta-k">${t(a("col_latency"))}</span> <span class="js-latency">${n.last_latency!=null?t(n.last_latency)+" ms":"—"}</span></span>
            <span><span class="meta-k">${t(a("col_uptime"))}</span> ${Q(n)}</span>
          </div>
        </div>
        ${re(n.uptime_hours)}
      </li>`).join("")}function le(e,n){const i=Ie(e),o=n!=null?i.slice(0,n):i;return o.length?`<ul class="incident-list">${o.map(Re).join("")}</ul>`:`<p class="list-empty">${t(a("no_incidents"))}</p>`}async function me(e,n,i){try{const o=await A.public(n),s=()=>{const r=e.querySelector(".js-status-banner"),c=e.querySelector(".js-status-banner-text");r&&(r.classList.remove("ok","degraded","major"),r.classList.add(se(o.overall_status))),c&&(c.textContent=oe(o.overall_status)),(o.monitors||[]).forEach(b=>{const w=e.querySelector(`[data-monitor-id="${b.id}"]`),E=w==null?void 0:w.querySelector(".hour-bar");E&&(E.outerHTML=re(b.uptime_hours))});const S=e.querySelector(".js-incidents");if(S){const b=S.getAttribute("data-limit"),w=b?Number(b):void 0;S.innerHTML=le(o.incidents||[],Number.isFinite(w)?w:void 0)}};i?Y(i,s):s()}catch{}}function ce(e){return e>=99.95?"100":e>=10?e.toFixed(1):e.toFixed(2)}function ze(){const e=Ae.map(n=>`<option value="${n.code}" ${Me()===n.code?"selected":""}>${t(n.label)}</option>`).join("");return`<select class="lang-select" id="lang-switch" aria-label="${t(a("language"))}">${e}</select>`}function F(e){var n;(n=e.querySelector("#lang-switch"))==null||n.addEventListener("change",i=>{_e(i.target.value),ee()})}function Fe(e){var s;const n=[["/",a("nav_dashboard")],["/monitors",a("nav_monitors")],["/notifications",a("nav_alerts")],["/status-pages",a("nav_pages")],["/profile",a("nav_profile")]],i=((s=n.find(([r])=>r===e))==null?void 0:s[1])||a("nav_dashboard"),o=n.map(([r,c])=>`<a href="${r}" data-link class="nav-link${e===r?" active":""}">${t(c)}</a>`).join("");return`
    <nav class="nav" aria-label="${t(a("nav_aria"))}">
      <div class="nav-bar">
        <span class="nav-current">${t(i)}</span>
        <button class="nav-burger" type="button" id="nav-burger" aria-expanded="false" aria-controls="nav-panel" aria-label="${t(a("menu"))}">
          <span class="nav-burger-lines" aria-hidden="true"></span>
        </button>
      </div>
      <div class="nav-panel" id="nav-panel">
        <div class="nav-tabs">
          ${o}
        </div>
        <button class="btn btn-ghost btn-nav" type="button" id="logout">${t(a("logout"))}</button>
      </div>
    </nav>
  `}function T(e){var s;const n=e.querySelector(".nav"),i=e.querySelector("#nav-burger"),o=r=>{n==null||n.classList.toggle("is-open",r),i==null||i.setAttribute("aria-expanded",r?"true":"false"),i==null||i.setAttribute("aria-label",a(r?"menu_close":"menu"))};i==null||i.addEventListener("click",()=>{o(!(n!=null&&n.classList.contains("is-open")))}),e.querySelectorAll("a[data-link]").forEach(r=>{r.addEventListener("click",c=>{c.preventDefault(),o(!1),v(r.getAttribute("href")||"/")})}),(s=e.querySelector("#logout"))==null||s.addEventListener("click",()=>{ie(),v("/login")}),F(e)}async function z(e){if(!window.confirm(a("confirm_delete")))return!1;try{return await e(),!0}catch(n){return window.alert(n instanceof Error?n.message:a("delete_failed")),!1}}function V(){const e=new Date().getFullYear();return`
    <footer class="site-footer">
      <div class="site-footer-inner">
        <p class="site-footer-copy">${t(a("footer_copy",{year:e}))}</p>
        <div class="site-footer-links">
          ${ze()}
          <a href="https://github.com/mosimosi228" target="_blank" rel="noopener noreferrer" class="site-footer-link">
            <svg class="gh-icon" viewBox="0 0 16 16" aria-hidden="true" width="16" height="16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>
            mosimosi228
          </a>
          <a href="https://github.com/mosimosi228/pinger" target="_blank" rel="noopener noreferrer" class="site-footer-link">
            ${t(a("footer_repo"))}
          </a>
        </div>
      </div>
    </footer>
  `}function x(e,n,i=!1){return`
    <div class="shell ${i?"shell-wide":""}">
      <section class="hero">
        <p class="pulse">${t(a("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${t(a("tagline"))}</p>
      </section>
      ${Fe(e)}
      ${n}
      ${V()}
    </div>
  `}function ve(){return window.location.origin}function Je(e){const n=ve(),i=`<script src="${n}/widget.js" data-slug="${e}" data-theme="light" data-variant="normal" data-height="auto" data-lang="en" async><\/script>`,o=`<script src="${n}/widget.js" data-slug="${e}" data-theme="light" data-variant="mini" data-height="auto" data-lang="en" async><\/script>`;return`
    <section class="panel" style="margin-top:1rem">
      <h2>${t(a("embed"))}</h2>
      <p class="muted">${t(a("embed_hint"))}</p>
      <div class="embed-box">
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${t(a("embed_normal"))}</p>
          <pre>${t(i)}</pre>
        </div>
        <div>
          <p class="muted" style="margin:0 0 0.35rem">${t(a("embed_mini"))}</p>
          <pre>${t(o)}</pre>
        </div>
      </div>
    </section>
  `}function Be(){return`
    <div class="shell">
      <section class="hero">
        <p class="pulse">${t(a("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${t(a("tagline_login"))}</p>
      </section>
      <section class="panel">
        <h2>${t(a("login_title"))}</h2>
        <form id="login-form">
          <div class="field"><label>${t(a("login_field"))}</label><input name="login" required /></div>
          <div class="field"><label>${t(a("password"))}</label><input name="password" type="password" required /></div>
          <p class="error" id="error"></p>
          <div class="row">
            <button class="btn btn-primary" type="submit">${t(a("sign_in"))}</button>
            <a href="/register" data-link>${t(a("create_account"))}</a>
          </div>
        </form>
      </section>
      ${V()}
    </div>
  `}function Ve(){return`
    <div class="shell">
      <section class="hero">
        <p class="pulse">${t(a("live"))}</p>
        <h1 class="brand">Pin<span>ger</span></h1>
        <p class="tagline">${t(a("tagline_register"))}</p>
      </section>
      <section class="panel">
        <h2>${t(a("register_title"))}</h2>
        <form id="register-form">
          <div class="field"><label>${t(a("email"))}</label><input name="email" type="email" required /></div>
          <div class="field"><label>${t(a("username"))}</label><input name="username" minlength="3" required /></div>
          <div class="field"><label>${t(a("password"))}</label><input name="password" type="password" minlength="8" required /></div>
          <p class="error" id="error"></p>
          <div class="row">
            <button class="btn btn-primary" type="submit">${t(a("register_submit"))}</button>
            <a href="/login" data-link>${t(a("have_account"))}</a>
          </div>
        </form>
      </section>
      ${V()}
    </div>
  `}function We(e,n){const i=n.map(s=>`
      <tr data-monitor-id="${s.id}">
        ${_(a("col_name"),`<a href="/monitors/${s.id}" data-link>${t(s.name)}</a>`)}
        ${_(a("col_type"),t(s.type),"cell-tight")}
        ${_(a("col_target"),t(s.target))}
        ${_(a("col_status"),D(s),"cell-tight js-status")}
        ${_(a("col_uptime"),Q(s),"cell-tight")}
        ${_(a("col_latency"),s.last_latency!=null?t(s.last_latency)+" ms":"—","cell-tight js-latency")}
        ${_(a("col_checked"),t(s.last_checked_at||"—"),"cell-tight js-checked")}
      </tr>`).join(""),o=a("no_monitors",{link:`<a href="/monitors" data-link>${t(a("create_first"))}</a>`});return x("/",`
    <section class="panel">
      <div class="panel-head">
        <h2>${t(a("hello",{name:e.username}))}</h2>
        <a class="btn btn-primary" href="/monitors" data-link style="text-decoration:none">${t(a("monitors"))}</a>
      </div>
      ${n.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${t(a("col_name"))}</th><th>${t(a("col_type"))}</th><th>${t(a("col_target"))}</th><th>${t(a("col_status"))}</th><th>${t(a("col_uptime"))}</th><th>${t(a("col_latency"))}</th><th>${t(a("col_checked"))}</th></tr></thead><tbody>${i}</tbody></table></div>`:`<p class="list-empty">${o}</p>`}
    </section>
  `,!0)}function Ke(e){const n=e.map(i=>`
      <tr data-monitor-id="${i.id}">
        ${_(a("col_name"),`<a href="/monitors/${i.id}" data-link>${t(i.name)}</a>`)}
        ${_(a("col_type"),t(i.type),"cell-tight")}
        ${_(a("col_target"),t(i.target))}
        ${_(a("col_interval"),`${t(i.interval)}s`,"cell-tight")}
        ${_(a("col_status"),D(i),"cell-tight js-status")}
        ${_(a("col_uptime"),Q(i),"cell-tight")}
        ${B(`<button class="btn btn-ghost" data-toggle="${i.id}" data-enabled="${i.enabled?"1":"0"}" type="button">${t(i.enabled?a("stop"):a("start"))}</button>`,`<button class="btn btn-ghost" data-del="${i.id}" type="button">${t(a("delete"))}</button>`)}
      </tr>`).join("");return x("/monitors",`
    <section class="panel" style="margin-bottom:1rem">
      <h2>${t(a("new_monitor"))}</h2>
      <form id="monitor-form">
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("col_name"))}</label><input name="name" required placeholder="Google" /></div>
          <div class="field"><label>${t(a("col_type"))}</label>
            <select name="type"><option>HTTP</option><option>TCP</option><option>ICMP</option></select>
          </div>
        </div>
        <div class="field"><label>${t(a("target"))}</label><input name="target" required placeholder="${t(a("placeholder_target"))}" /></div>
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("interval_sec"))}</label><input name="interval" type="number" value="60" min="5" required /></div>
          <div class="field"><label>${t(a("timeout_sec"))}</label><input name="timeout" type="number" value="10" min="1" required /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("confirmations"))}</label><input name="confirmations" type="number" value="1" min="1" max="20" required /></div>
          <div class="field"><label>${t(a("enabled"))}</label>
            <select name="enabled"><option value="true">${t(a("yes"))}</option><option value="false">${t(a("no"))}</option></select>
          </div>
        </div>
        <p class="muted">${t(a("confirmations_hint"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${t(a("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${t(a("list"))}</h2>
      ${e.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${t(a("col_name"))}</th><th>${t(a("col_type"))}</th><th>${t(a("col_target"))}</th><th>${t(a("col_interval"))}</th><th>${t(a("col_status"))}</th><th>${t(a("col_uptime"))}</th><th></th></tr></thead><tbody>${n}</tbody></table></div>`:`<p class="list-empty">${t(a("empty"))}</p>`}
    </section>
  `,!0)}function Ge(e,n,i){const o=n.map(c=>`
      <tr>
        ${_(a("col_status"),c.status?`<span class="badge badge-up">${t(a("badge_up"))}</span>`:`<span class="badge badge-down">${t(a("badge_down"))}</span>`)}
        ${_(a("col_code"),String(c.status_code??"—"))}
        ${_(a("col_latency"),c.latency!=null?c.latency+" ms":"—")}
        ${_(a("col_error"),t(c.error||""))}
        ${_(a("col_at"),t(c.checked_at))}
      </tr>`).join(""),s=i.map(c=>`<option value="${c.id}">${t(c.type)} #${c.id}${c.enabled?"":` (${a("badge_off")})`}</option>`).join(""),r=(e.notifications||[]).map(c=>`
      <tr>
        ${_(a("col_notification"),`${t(c.type)} #${c.id}`)}
        ${_(a("col_config"),`<code>${t(c.config)}</code>`)}
        ${_(a("col_enabled"),c.enabled?`<span class="badge badge-up">${t(a("badge_on"))}</span>`:`<span class="badge badge-off">${t(a("badge_off"))}</span>`)}
        ${B(`<button class="btn btn-ghost" type="button" data-detach-notif="${c.id}">${t(a("detach"))}</button>`)}
      </tr>`).join("");return x("/monitors",`
    <section class="panel" style="margin-bottom:1rem">
      <div class="panel-head">
        <h2>${t(e.name)} ${D(e)}</h2>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-del="${e.id}">${t(a("delete"))}</button>
          <a href="/monitors" data-link>${t(a("back"))}</a>
        </div>
      </div>
      <div class="grid two" style="margin-top:1rem">
        <div class="stat"><div class="k">${t(a("col_type"))}</div><div class="v">${t(e.type)}</div></div>
        <div class="stat"><div class="k">${t(a("col_target"))}</div><div class="v">${t(e.target)}</div></div>
        <div class="stat"><div class="k">${t(a("col_interval"))}</div><div class="v">${t(e.interval)}s</div></div>
        <div class="stat"><div class="k">${t(a("col_uptime"))}</div><div class="v js-uptime">${e.enabled&&e.last_status===!0&&e.uptime_1h!=null?`${t(ce(e.uptime_1h))}%`:"—"}</div></div>
        <div class="stat"><div class="k">${t(a("next_check"))}</div><div class="v">${t(e.next_check_at)}</div></div>
      </div>
      <form id="monitor-edit" style="margin-top:1.25rem">
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("col_name"))}</label><input name="name" value="${t(e.name)}" required /></div>
          <div class="field"><label>${t(a("col_type"))}</label>
            <select name="type">
              ${["HTTP","TCP","ICMP"].map(c=>`<option ${c===e.type?"selected":""}>${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>${t(a("target"))}</label><input name="target" value="${t(e.target)}" required /></div>
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("col_interval"))}</label><input name="interval" type="number" value="${e.interval}" min="5" /></div>
          <div class="field"><label>${t(a("timeout_sec"))}</label><input name="timeout" type="number" value="${e.timeout}" min="1" /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("confirmations"))}</label><input name="confirmations" type="number" value="${e.confirmations??1}" min="1" max="20" /></div>
          <div class="field"><label>${t(a("enabled"))}</label>
            <select name="enabled">
              <option value="true" ${e.enabled?"selected":""}>${t(a("yes"))}</option>
              <option value="false" ${e.enabled?"":"selected"}>${t(a("no"))}</option>
            </select>
          </div>
        </div>
        <p class="muted">${t(a("confirmations_hint"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${t(a("save"))}</button>
      </form>
    </section>
    <section class="panel" style="margin-bottom:1rem">
      <h2>${t(a("alerts"))}</h2>
      <form id="attach-notif" class="attach-row">
        <div class="field" style="margin-bottom:0">
          <label>${t(a("alert"))}</label>
          <select name="notification_id">${s||`<option value="">${t(a("no_alerts"))}</option>`}</select>
        </div>
        <button class="btn btn-primary" type="submit" ${i.length===0?"disabled":""}>${t(a("attach"))}</button>
      </form>
      ${r?`<div class="table-wrap" style="margin-top:1rem"><table class="table"><thead><tr><th>${t(a("col_notification"))}</th><th>${t(a("col_config"))}</th><th>${t(a("col_enabled"))}</th><th></th></tr></thead><tbody>${r}</tbody></table></div>`:`<p class="list-empty">${t(a("not_attached"))}</p>`}
    </section>
    <section class="panel">
      <h2>${t(a("check_history"))}</h2>
      <p class="muted">${t(a("check_history_hint"))}</p>
      ${n.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${t(a("col_status"))}</th><th>${t(a("col_code"))}</th><th>${t(a("col_latency"))}</th><th>${t(a("col_error"))}</th><th>${t(a("col_at"))}</th></tr></thead><tbody>${o}</tbody></table></div>`:`<p class="list-empty">${t(a("no_checks"))}</p>`}
    </section>
  `,!0)}function Xe(e,n){try{const i=JSON.parse(n);if(e==="telegram"){const o=i.token?`${i.token.slice(0,8)}…`:"—";return`chat: ${t(i.chat_id||"—")} · token: ${t(o)}`}if(e==="webhook")return`url: ${t(i.url||"—")}`}catch{}return t(n)}function ye(e){return e==="webhook"?`
      <div class="field" data-cfg="webhook">
        <label>${t(a("webhook_url"))}</label>
        <input name="webhook_url" type="url" placeholder="https://hooks.example.com/pinger" required />
      </div>
    `:`
    <div class="form-row cols-2" data-cfg="telegram">
      <div class="field">
        <label>${t(a("bot_token"))}</label>
        <input name="telegram_token" type="text" placeholder="123456:AAH..." required autocomplete="off" />
      </div>
      <div class="field">
        <label>${t(a("chat_id"))}</label>
        <input name="telegram_chat_id" type="text" placeholder="-1001234567890" required />
      </div>
    </div>
  `}function Ye(e){const n=e.map(i=>`
      <tr>
        ${_(a("col_type"),`${t(i.type)} #${i.id}`)}
        ${_(a("col_config"),Xe(i.type,i.config))}
        ${_(a("col_enabled"),i.enabled?`<span class="badge badge-up">${t(a("badge_on"))}</span>`:`<span class="badge badge-off">${t(a("badge_off"))}</span>`)}
        ${B(`<button class="btn btn-ghost" data-toggle="${i.id}" data-enabled="${i.enabled?"1":"0"}" type="button">${t(i.enabled?a("disable"):a("enable"))}</button>`,`<button class="btn btn-ghost" data-del="${i.id}" type="button">${t(a("delete"))}</button>`)}
      </tr>`).join("");return x("/notifications",`
    <section class="panel" style="margin-bottom:1rem">
      <h2>${t(a("new_alert"))}</h2>
      <form id="notif-form">
        <div class="field"><label>${t(a("type"))}</label>
          <select name="type" id="notif-type">
            <option value="telegram">Telegram</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
        <div id="notif-fields">${ye("telegram")}</div>
        <div class="field"><label>${t(a("enabled"))}</label>
          <select name="enabled">
            <option value="true">${t(a("yes"))}</option>
            <option value="false">${t(a("no"))}</option>
          </select>
        </div>
        <p class="muted" id="notif-hint">${t(a("hint_telegram"))}</p>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${t(a("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${t(a("list"))}</h2>
      ${e.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${t(a("col_type"))}</th><th>${t(a("col_config"))}</th><th>${t(a("col_enabled"))}</th><th></th></tr></thead><tbody>${n}</tbody></table></div>`:`<p class="list-empty">${t(a("empty"))}</p>`}
    </section>
  `,!0)}function Ze(e,n){return JSON.stringify(e==="webhook"?{url:String(n.get("webhook_url")||"").trim()}:{token:String(n.get("telegram_token")||"").trim(),chat_id:String(n.get("telegram_chat_id")||"").trim()})}function Qe(e){const n=e.querySelector("#notif-type"),i=e.querySelector("#notif-fields"),o=e.querySelector("#notif-hint");if(!n||!i)return;const s=()=>{const r=n.value;i.innerHTML=ye(r),o&&(o.textContent=a(r==="webhook"?"hint_webhook":"hint_telegram"))};n.addEventListener("change",s)}function et(e){const n=e.map(i=>`
      <tr>
        ${_(a("col_name"),`<a href="/status-pages/${i.id}" data-link>${t(i.name)}</a>`)}
        ${_(a("col_slug"),t(i.slug))}
        ${_(a("col_visibility"),i.public?t(a("public_label")):t(a("private")))}
        ${_(a("col_link"),i.public?`<a href="/s/${t(i.slug)}" data-link>/s/${t(i.slug)}</a>`:"—")}
        ${B(`<button class="btn btn-ghost" data-del="${i.id}" type="button">${t(a("delete"))}</button>`)}
      </tr>`).join("");return x("/status-pages",`
    <section class="panel" style="margin-bottom:1rem">
      <h2>${t(a("new_status_page"))}</h2>
      <form id="sp-form">
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("col_name"))}</label><input name="name" required /></div>
          <div class="field"><label>${t(a("col_slug"))}</label><input name="slug" required pattern="[a-z0-9\\-]+" placeholder="my-status" /></div>
        </div>
        <div class="field"><label>${t(a("public"))}</label>
          <select name="public"><option value="true">${t(a("yes"))}</option><option value="false">${t(a("no"))}</option></select>
        </div>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${t(a("create"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${t(a("list"))}</h2>
      ${e.length?`<div class="table-wrap"><table class="table"><thead><tr><th>${t(a("col_name"))}</th><th>${t(a("col_slug"))}</th><th>${t(a("col_visibility"))}</th><th>${t(a("col_link"))}</th><th></th></tr></thead><tbody>${n}</tbody></table></div>`:`<p class="list-empty">${t(a("empty"))}</p>`}
    </section>
  `,!0)}function tt(e,n){const i=new Set((e.monitors||[]).map(r=>r.id)),o=n.filter(r=>!i.has(r.id)).map(r=>`<option value="${r.id}">${t(r.name)}</option>`).join(""),s=(e.monitors||[]).map(r=>`
      <tr data-monitor-id="${r.id}">
        ${_(a("col_monitor"),t(r.name))}
        ${_(a("col_status"),D(r),"js-status")}
        ${B(`<button class="btn btn-ghost" type="button" data-detach="${r.id}">${t(a("detach"))}</button>`)}
      </tr>`).join("");return x("/status-pages",`
    <section class="panel" style="margin-bottom:1rem">
      <div class="panel-head">
        <h2>${t(e.name)}</h2>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-del="${e.id}">${t(a("delete"))}</button>
          <a href="/status-pages" data-link>${t(a("back"))}</a>
        </div>
      </div>
      <p class="muted">slug: <code>${t(e.slug)}</code> · ${e.public?`<a href="/s/${t(e.slug)}" data-link>${t(a("public_page"))}</a>`:t(a("private"))}</p>
      <form id="sp-edit">
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("col_name"))}</label><input name="name" value="${t(e.name)}" required /></div>
          <div class="field"><label>${t(a("col_slug"))}</label><input name="slug" value="${t(e.slug)}" required /></div>
        </div>
        <div class="field"><label>${t(a("public"))}</label>
          <select name="public">
            <option value="true" ${e.public?"selected":""}>${t(a("yes"))}</option>
            <option value="false" ${e.public?"":"selected"}>${t(a("no"))}</option>
          </select>
        </div>
        <p class="error" id="error"></p>
        <button class="btn btn-primary" type="submit">${t(a("save"))}</button>
      </form>
    </section>
    <section class="panel">
      <h2>${t(a("monitors_on_page"))}</h2>
      <form id="attach-monitor" class="attach-row">
        <div class="field" style="margin-bottom:0">
          <label>${t(a("col_monitor"))}</label>
          <select name="monitor_id">${o||`<option value="">${t(a("no_available"))}</option>`}</select>
        </div>
        <button class="btn btn-primary" type="submit" ${o?"":"disabled"}>${t(a("attach"))}</button>
      </form>
      ${s?`<div class="table-wrap" style="margin-top:1rem"><table class="table"><thead><tr><th>${t(a("col_monitor"))}</th><th>${t(a("col_status"))}</th><th></th></tr></thead><tbody>${s}</tbody></table></div>`:`<p class="list-empty">${t(a("not_attached"))}</p>`}
    </section>
    ${e.public?Je(e.slug):""}
  `,!0)}function at(e){return x("/profile",`
    <section class="panel">
      <h2>${t(a("profile_title"))}</h2>
      <div class="grid two" style="margin-bottom:1.25rem">
        <div class="stat"><div class="k">${t(a("role"))}</div><div class="v">${t(e.role)}</div></div>
        <div class="stat"><div class="k">${t(a("status_label"))}</div><div class="v">${t(e.status)}</div></div>
      </div>
      <form id="profile-form">
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("email"))}</label><input name="email" type="email" value="${t(e.email)}" required /></div>
          <div class="field"><label>${t(a("username"))}</label><input name="username" minlength="3" value="${t(e.username)}" required /></div>
        </div>
        <div class="form-row cols-2">
          <div class="field"><label>${t(a("current_password"))}</label><input name="current_password" type="password" autocomplete="current-password" /></div>
          <div class="field"><label>${t(a("new_password"))}</label><input name="password" type="password" minlength="8" autocomplete="new-password" /></div>
        </div>
        <div class="field">
          <label>${t(a("api_key"))}</label>
          <div class="row">
            <input name="api_key" value="${t(e.api_key||"")}" readonly style="flex:1" />
            <button class="btn btn-ghost" type="button" id="copy-api">${t(a("copy"))}</button>
          </div>
        </div>
        <p class="error" id="error"></p>
        <p class="muted" id="profile-ok" style="min-height:1.2rem"></p>
        <div class="row">
          <button class="btn btn-primary" type="submit">${t(a("save"))}</button>
          <button class="btn btn-ghost" type="button" id="regen-api">${t(a("regenerate_api_key"))}</button>
        </div>
      </form>
    </section>
  `,!0)}function nt(e){const n=e.monitors||[],i=e.overall_status||"operational";return`
    <div class="shell shell-wide">
      <section class="hero">
        <p class="pulse">${t(a("public_label"))}</p>
        <h1 class="brand">${t(e.name)}</h1>
        <p class="tagline">${t(a("status_page_tag"))} <code>${t(e.slug)}</code></p>
      </section>
      <section class="status-banner ${se(i)} js-status-banner">
        <span class="status-banner-dot" aria-hidden="true"></span>
        <span class="js-status-banner-text">${t(oe(i))}</span>
      </section>
      <section class="panel">
        <h2 class="section-title">${t(a("components"))}</h2>
        ${n.length?`<ul class="status-components">${Ue(n)}</ul>`:`<p class="list-empty">${t(a("no_monitors_short"))}</p>`}
      </section>
      <section class="panel">
        <h2 class="section-title">${t(a("past_incidents"))}</h2>
        <div class="js-incidents">${le(e.incidents||[])}</div>
      </section>
      ${V()}
    </div>
  `}function it(e,n,i){const o=e.monitors||[],s=e.overall_status||"operational",r=o.length===0?a("no_monitors_short"):oe(s),c=i==="mini",S=n==="light"?"theme-light":"theme-dark",b=c?"variant-mini":"variant-normal",w=o.map(E=>`
        <li class="embed-item" data-monitor-id="${E.id}">
          <div class="embed-item-main">
            <span class="embed-name">${t(E.name)}</span>
            <span class="js-status">${D(E)}</span>
          </div>
          <div class="embed-item-meta">
            <span><span class="embed-k">${t(a("col_uptime"))}</span> ${Q(E)}</span>
            <span><span class="embed-k">${t(a("col_latency"))}</span> <span class="js-latency">${E.last_latency!=null?t(E.last_latency)+" ms":"—"}</span></span>
          </div>
          ${re(E.uptime_hours)}
        </li>`).join("");return`
    <div class="embed-shell ${S} ${b}">
      <div class="embed-card">
        <header class="embed-head">
          <div class="embed-titles">
            <h1>${t(e.name)}</h1>
          </div>
          ${c?"":`<a class="embed-powered" href="${t(ve())}/s/${t(e.slug)}" target="_blank" rel="noopener">${t(a("powered_by"))}</a>`}
        </header>
        <div class="status-banner embed-banner ${se(s)} js-status-banner">
          <span class="status-banner-dot" aria-hidden="true"></span>
          <span class="js-status-banner-text js-embed-summary">${t(r)}</span>
        </div>
        ${o.length?`<ul class="embed-list">${w}</ul>`:`<p class="embed-empty">${t(a("no_monitors_short"))}</p>`}
        ${c?"":`<div class="embed-incidents">
                <h2 class="embed-section-title">${t(a("past_incidents"))}</h2>
                <div class="js-incidents" data-limit="2">${le(e.incidents||[],2)}</div>
              </div>`}
      </div>
    </div>
  `}function ge(e){const n=document.querySelector(".embed-shell");if(!n)return;if(e){n.classList.add("fill-height");return}if(window.parent===window)return;const i=()=>{const o=Math.ceil(n.getBoundingClientRect().height);o>0&&window.parent.postMessage({type:"pinger-embed-resize",height:o},"*")};i(),requestAnimationFrame(i),window.addEventListener("load",i),typeof ResizeObserver<"u"&&new ResizeObserver(()=>i()).observe(n)}async function ee(){var r,c,S,b,w,E,q,O,H,C,I,R;De();const e=He(),n=!!J(),i=new URLSearchParams(window.location.search),o=e.match(/^\/embed\/s\/([^/]+)$/);if(o){const h=i.get("lang")||"en",y=i.get("theme")||"dark",k=i.get("variant")==="mini"?"mini":"normal",u=i.get("fill")==="1"||i.get("height")==="100%";document.documentElement.classList.add("embed-mode"),document.body.classList.add("embed-mode"),y==="light"&&(document.documentElement.classList.add("theme-light"),document.body.classList.add("theme-light")),u&&(document.documentElement.classList.add("fill-height"),document.body.classList.add("fill-height"));try{const p=await A.public(o[1]);document.documentElement.lang=h==="zh"?"zh-CN":h,l.innerHTML=Y(h,()=>it(p,y,k)),ge(u);let g=new Map;(p.monitors||[]).forEach(d=>{d.last_status!=null&&g.set(d.id,d.last_status)}),P=pe(p.slug,d=>{Y(h,()=>X(l,d));const m=g.get(d.id);m!==void 0&&m!==d.status&&me(l,p.slug,h),g.set(d.id,d.status)})}catch(p){l.innerHTML=Y(h,()=>`<div class="embed-shell ${y==="light"?"theme-light":""}"><div class="embed-card"><p class="error">${t(p instanceof Error?p.message:a("not_found"))}</p></div></div>`),ge(u)}return}document.documentElement.classList.remove("embed-mode","theme-light","fill-height"),document.body.classList.remove("embed-mode","theme-light","fill-height");const s=e.match(/^\/s\/([^/]+)$/);if(s){try{const h=await A.public(s[1]);l.innerHTML=nt(h),F(l);let y=new Map;(h.monitors||[]).forEach(k=>{k.last_status!=null&&y.set(k.id,k.last_status)}),P=pe(h.slug,k=>{X(l,k);const u=y.get(k.id);u!==void 0&&u!==k.status&&me(l,h.slug),y.set(k.id,k.status)})}catch(h){l.innerHTML=`<div class="shell"><section class="panel"><h2>${t(a("not_found"))}</h2><p class="error">${t(h instanceof Error?h.message:"error")}</p></section>${V()}</div>`,F(l)}return}if(e==="/login"){if(n)return v("/");l.innerHTML=Be(),F(l),l.querySelectorAll("a[data-link]").forEach(h=>h.addEventListener("click",y=>{y.preventDefault(),v(h.getAttribute("href")||"/")})),(r=l.querySelector("#login-form"))==null||r.addEventListener("submit",async h=>{h.preventDefault();const y=new FormData(h.target),k=l.querySelector("#error");try{te(await Ee(String(y.get("login")),String(y.get("password")))),v("/")}catch(u){k.textContent=u instanceof Error?u.message:"error"}});return}if(e==="/register"){if(n)return v("/");l.innerHTML=Ve(),F(l),l.querySelectorAll("a[data-link]").forEach(h=>h.addEventListener("click",y=>{y.preventDefault(),v(h.getAttribute("href")||"/")})),(c=l.querySelector("#register-form"))==null||c.addEventListener("submit",async h=>{h.preventDefault();const y=new FormData(h.target),k=l.querySelector("#error");try{te(await ke(String(y.get("email")),String(y.get("username")),String(y.get("password")))),v("/")}catch(u){k.textContent=u instanceof Error?u.message:"error"}});return}if(!n)return v("/login");try{const h=await Le();if(e==="/"){const u=await L.list();l.innerHTML=We(h,u),T(l);const p=J();p&&(P=ue(p,g=>X(l,g)));return}if(e==="/monitors"){const u=await L.list();l.innerHTML=Ke(u),T(l);const p=J();p&&(P=ue(p,g=>X(l,g))),(S=l.querySelector("#monitor-form"))==null||S.addEventListener("submit",async g=>{g.preventDefault();const d=new FormData(g.target),m=l.querySelector("#error");try{await L.create({name:String(d.get("name")),type:String(d.get("type")),target:String(d.get("target")),interval:Number(d.get("interval")),timeout:Number(d.get("timeout")),confirmations:Number(d.get("confirmations"))||1,enabled:String(d.get("enabled"))==="true"}),v("/monitors")}catch(f){m.textContent=f instanceof Error?f.message:"error"}}),l.querySelectorAll("[data-toggle]").forEach(g=>{g.addEventListener("click",async()=>{const d=Number(g.dataset.toggle),m=g.dataset.enabled!=="1";try{await L.update(d,{enabled:m}),v("/monitors")}catch(f){alert(f instanceof Error?f.message:"error")}})}),l.querySelectorAll("[data-del]").forEach(g=>{g.addEventListener("click",async()=>{await z(()=>L.remove(Number(g.dataset.del)))&&v("/monitors")})});return}const y=e.match(/^\/monitors\/(\d+)$/);if(y){const u=Number(y[1]),[p,g,d]=await Promise.all([L.get(u),L.checks(u),U.list()]);l.innerHTML=Ge(p,g,d),T(l),l.querySelectorAll("[data-del]").forEach(m=>{m.addEventListener("click",async()=>{await z(()=>L.remove(Number(m.dataset.del)))&&v("/monitors")})}),(b=l.querySelector("#monitor-edit"))==null||b.addEventListener("submit",async m=>{m.preventDefault();const f=new FormData(m.target),N=l.querySelector("#error");try{await L.update(u,{name:String(f.get("name")),type:String(f.get("type")),target:String(f.get("target")),interval:Number(f.get("interval")),timeout:Number(f.get("timeout")),confirmations:Number(f.get("confirmations"))||1,enabled:String(f.get("enabled"))==="true"}),v(`/monitors/${u}`)}catch(W){N.textContent=W instanceof Error?W.message:"error"}}),(w=l.querySelector("#attach-notif"))==null||w.addEventListener("submit",async m=>{m.preventDefault();const f=new FormData(m.target),N=Number(f.get("notification_id"));N&&(await L.attachNotification(u,N),v(`/monitors/${u}`))}),l.querySelectorAll("[data-detach-notif]").forEach(m=>{m.addEventListener("click",async()=>{await L.detachNotification(u,Number(m.dataset.detachNotif)),v(`/monitors/${u}`)})});return}if(e==="/notifications"){const u=await U.list();l.innerHTML=Ye(u),T(l),Qe(l),(E=l.querySelector("#notif-form"))==null||E.addEventListener("submit",async p=>{p.preventDefault();const g=new FormData(p.target),d=l.querySelector("#error"),m=String(g.get("type"));try{await U.create({type:m,config:Ze(m,g),enabled:String(g.get("enabled"))==="true"}),v("/notifications")}catch(f){d.textContent=f instanceof Error?f.message:"error"}}),l.querySelectorAll("[data-toggle]").forEach(p=>{p.addEventListener("click",async()=>{const g=Number(p.dataset.toggle),d=p.dataset.enabled!=="1";try{await U.update(g,{enabled:d}),v("/notifications")}catch(m){alert(m instanceof Error?m.message:"error")}})}),l.querySelectorAll("[data-del]").forEach(p=>{p.addEventListener("click",async()=>{await z(()=>U.remove(Number(p.dataset.del)))&&v("/notifications")})});return}if(e==="/status-pages"){const u=await A.list();l.innerHTML=et(u),T(l),(q=l.querySelector("#sp-form"))==null||q.addEventListener("submit",async p=>{p.preventDefault();const g=new FormData(p.target),d=l.querySelector("#error");try{await A.create({name:String(g.get("name")),slug:String(g.get("slug")),public:String(g.get("public"))==="true"}),v("/status-pages")}catch(m){d.textContent=m instanceof Error?m.message:"error"}}),l.querySelectorAll("[data-del]").forEach(p=>{p.addEventListener("click",async()=>{await z(()=>A.remove(Number(p.dataset.del)))&&v("/status-pages")})});return}if(e==="/profile"){l.innerHTML=at(h),T(l);const u=l.querySelector("#profile-ok"),p=l.querySelector("#error"),g=l.querySelector("input[name=api_key]");(O=l.querySelector("#copy-api"))==null||O.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(g.value),u.textContent=a("copied")}catch{u.textContent=""}}),(H=l.querySelector("#regen-api"))==null||H.addEventListener("click",async()=>{p.textContent="",u.textContent="";try{const d=await de({regenerate_api_key:!0});g.value=d.api_key||"",u.textContent=a("profile_saved")}catch(d){p.textContent=d instanceof Error?d.message:"error"}}),(C=l.querySelector("#profile-form"))==null||C.addEventListener("submit",async d=>{d.preventDefault(),p.textContent="",u.textContent="";const m=new FormData(d.target),f={email:String(m.get("email")||"").trim(),username:String(m.get("username")||"").trim()},N=String(m.get("password")||""),W=String(m.get("current_password")||"");N&&(f.password=N,f.current_password=W);try{const K=await de(f);u.textContent=a("profile_saved"),d.target.querySelector("input[name=password]").value="",d.target.querySelector("input[name=current_password]").value="",g.value=K.api_key||""}catch(K){p.textContent=K instanceof Error?K.message:"error"}});return}const k=e.match(/^\/status-pages\/(\d+)$/);if(k){const u=Number(k[1]),[p,g]=await Promise.all([A.get(u),L.list()]);l.innerHTML=tt(p,g),T(l),l.querySelectorAll("[data-del]").forEach(d=>{d.addEventListener("click",async()=>{await z(()=>A.remove(Number(d.dataset.del)))&&v("/status-pages")})}),(I=l.querySelector("#sp-edit"))==null||I.addEventListener("submit",async d=>{d.preventDefault();const m=new FormData(d.target),f=l.querySelector("#error");try{await A.update(u,{name:String(m.get("name")),slug:String(m.get("slug")),public:String(m.get("public"))==="true"}),v(`/status-pages/${u}`)}catch(N){f.textContent=N instanceof Error?N.message:"error"}}),(R=l.querySelector("#attach-monitor"))==null||R.addEventListener("submit",async d=>{d.preventDefault();const m=new FormData(d.target),f=Number(m.get("monitor_id"));f&&(await A.attachMonitor(u,f),v(`/status-pages/${u}`))}),l.querySelectorAll("[data-detach]").forEach(d=>{d.addEventListener("click",async()=>{await A.detachMonitor(u,Number(d.dataset.detach)),v(`/status-pages/${u}`)})});return}v("/")}catch{ie(),v("/login")}}ee();
