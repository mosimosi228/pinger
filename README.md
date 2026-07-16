<p align="center">
  <img src="docs/banner.png" alt="Pinger — Uptime checks, alerts, and public status pages" width="100%" />
</p>

<p align="center">
  <strong>Self-hosted uptime monitoring</strong> — HTTP / TCP / ICMP checks, Telegram & webhook alerts,<br/>
  public status pages, embeddable widgets, and live WebSocket updates.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#quick-start-dev">Dev</a> ·
  <a href="#features">Features</a> ·
  <a href="#embed">Embed</a> ·
  <a href="#api">API</a>
</p>

---

## Why Pinger

One binary. SQLite. No Redis, no Postgres, no Docker required.

You get a small control plane for monitors, alerts, and public status pages — with a dark SPA UI, i18n (en / ru / es / de / zh), and realtime status over WebSocket.

| | |
|---|---|
| **Checks** | HTTP, TCP, ICMP on a scheduler + worker pool |
| **Alerts** | Telegram bot & webhook, rich downtime payloads |
| **Status pages** | Public `/s/{slug}` + iframe / `widget.js` embed |
| **Live** | Dashboard & widgets update over WebSocket |
| **Deploy** | `go install` → `sudo pinger install` → systemd |

---

## Install

Production in two commands (needs Go with **CGO**, `gcc`, and root for install):

```bash
CGO_ENABLED=1 go install github.com/mosimosi228/pinger/cmd/pinger@latest
sudo "$(go env GOPATH)/bin/pinger" install
```

`install` will:

- create system user `pinger`
- write `/etc/pinger/pinger.yaml` (prod template + generated JWT secret)
- create `/var/lib/pinger` and `/var/log/pinger`
- install the binary to `/usr/local/bin/pinger`
- drop `/etc/systemd/system/pinger.service`, enable & start it

```bash
systemctl status pinger
journalctl -u pinger -f
```

| Flag | Meaning |
|------|---------|
| `--force` | overwrite existing `/etc/pinger/pinger.yaml` |
| `--no-start` | enable the unit but don’t start yet |

Default listen port in prod config: **2030**.

---

## Quick start (dev)

```bash
git clone https://github.com/mosimosi228/pinger.git
cd pinger
make init          # config + npm + SPA + binary
make run           # serve with pinger.yaml
```

Or step by step:

```bash
cp pinger.yaml.dist pinger.yaml
make web-install && make web
go build -o ./bin/pinger ./cmd/pinger
./bin/pinger serve --config pinger.yaml
```

Open the printed addr (default from dist: `http://localhost:12312`), register a user, create a monitor.

---

## Features

### Monitors

- **HTTP** — status code & latency  
- **TCP** — connect check  
- **ICMP** — via system `ping` (systemd unit grants `CAP_NET_RAW`)  
- Interval / timeout / enable toggle  
- Check history per monitor  

### Alerts

Attach Telegram or webhook channels to a monitor. On **up ↔ down** you get a full report:

- monitor name, type, target, interval  
- previous & current status, HTTP code, latency, error  
- **downtime duration** on recovery  

### Status pages & embed

Public page: `/s/{slug}`

```html
<iframe
  src="https://your-host/embed/s/SLUG?lang=en"
  width="100%"
  height="360"
  style="border:0;background:transparent"
  allowtransparency="true"
></iframe>
```

```html
<script src="https://your-host/widget.js" data-slug="SLUG" data-lang="en" async></script>
```

Optional: `data-theme="light|dark"`, `data-height="360"`, `data-refresh="60"`.

### Live updates

- Authenticated UI: `ws://host/api/v1/ws?token=<access_jwt>`  
- Public page / widget: `ws://host/api/public/ws/s/{slug}`  

Statuses, latency, and last-checked time refresh without reload.

---

## Configuration

Primary file: `pinger.yaml` (prod: `/etc/pinger/pinger.yaml`).

```yaml
app:
  name: Pinger
  env: prod
  addr: http://localhost:2030
  port: "2030"

logs:
  level: warn
  out_dir: /var/log/pinger
  out_filename: pinger.log

security:
  jwt_secret: change-me
  api_key: ""

sqlite:
  path: /var/lib/pinger/pinger.db
```

Templates in the repo: `pinger.yaml.dist` (dev), `pinger.yaml.prod.dist` (prod).

---

## API

| Area | Base |
|------|------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh` |
| Me | `GET /api/v1/me` |
| Monitors | `/api/v1/monitors` |
| Notifications | `/api/v1/notifications` |
| Status pages | `/api/v1/status-pages` |
| Public status | `GET /api/public/s/{slug}` |
| Health | `GET /ping` |

Protected routes expect `Authorization: Bearer <access_token>` (or `X-API-Key` when configured).

---

## CLI

```text
pinger serve --config /etc/pinger/pinger.yaml
pinger install [--force] [--no-start]
pinger uninstall [--purge]
```

`uninstall` stops/disables the service and removes the binary + unit.  
With `--purge` it also deletes `/etc/pinger`, `/var/lib/pinger`, `/var/log/pinger`, and the `pinger` system user.

SPA and SQL migrations are **embedded** in the binary — no extra `public/` folder needed next to the process.

---

## Stack

- **Go** — chi HTTP, cobra CLI, SQLite + sqlc, golang-migrate  
- **Workers** — scheduler + ping worker pool  
- **Frontend** — Vite + TypeScript SPA (Syne / IBM Plex Mono)  
- **Realtime** — gorilla/websocket  

---

## License

See the repository for license terms. Contributions welcome via pull requests.

<p align="center">
  <sub>Built for people who want uptime without the ops tax.</sub>
</p>
