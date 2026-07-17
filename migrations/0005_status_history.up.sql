CREATE TABLE monitor_uptime_hourly
(
    monitor_id INTEGER NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
    hour_start TEXT    NOT NULL,
    ok         INTEGER NOT NULL DEFAULT 0 CHECK (ok >= 0),
    total      INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
    PRIMARY KEY (monitor_id, hour_start)
);

CREATE INDEX idx_monitor_uptime_hourly_hour
    ON monitor_uptime_hourly (hour_start);

CREATE TABLE incidents
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id  INTEGER NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    message     TEXT    NOT NULL DEFAULT '',
    started_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
);

CREATE INDEX idx_incidents_monitor_open
    ON incidents (monitor_id, resolved_at);

CREATE INDEX idx_incidents_started
    ON incidents (started_at);
