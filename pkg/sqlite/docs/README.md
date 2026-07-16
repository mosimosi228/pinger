# pkg/sqlite

SQLite connection, migrations, and global `*sql.DB`.

Import: `github.com/mosimosi228/pinger/pkg/sqlite`

## Purpose

Open the DB once at service startup, run golang-migrate, and expose the connection pool.

## API

| Function | Description |
|----------|-------------|
| `New(ctx, Option{Path})` | create directory, run migrations, `Ping`, store in `sqlite.DB` |
| `Close()` | close the connection |
| `DefaultDBPath` | `./tmp/public.db` when Path is empty |

```go
err := sqlite.New(ctx, sqlite.Option{Path: "runtime/pinger.db"})
defer sqlite.Close()

rows, err := sqlite.DB.QueryContext(ctx, "SELECT 1")
```

## Behavior

- Driver: `mattn/go-sqlite3`.
- PRAGMA: `foreign_keys=1`, `busy_timeout=5000`, `journal_mode=WAL`.
- Pool: `MaxOpenConns(1)`, `MaxIdleConns(1)` — typical for SQLite.
- Migrations: `<repo>/migrations` directory (files `*.up.sql` / `*.down.sql` in the directory root).
- If no `.up.sql` files exist — migrations are skipped with a log message.

## Option

```go
type Option struct {
    Path string // path to the DB file
}
```

## Dependencies

- `github.com/mattn/go-sqlite3`
- `github.com/golang-migrate/migrate/v4`
