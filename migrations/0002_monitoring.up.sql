CREATE TABLE monitors
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    type       TEXT    NOT NULL CHECK (type IN ('HTTP', 'TCP', 'ICMP')),
    target     TEXT    NOT NULL,
    interval   INTEGER NOT NULL DEFAULT 60 CHECK (interval > 0),
    timeout    INTEGER NOT NULL DEFAULT 10 CHECK (timeout > 0),
    enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    next_check_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_monitors_user_id ON monitors (user_id);
CREATE INDEX idx_monitors_enabled ON monitors (enabled) WHERE enabled = 1;
CREATE INDEX idx_monitors_user_enabled ON monitors (user_id, enabled);

CREATE TABLE checks
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id  INTEGER NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
    status      INTEGER NOT NULL CHECK (status IN (0, 1)),
    status_code INTEGER,
    latency     INTEGER,
    error       TEXT,
    checked_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_checks_monitor_id ON checks (monitor_id);
CREATE INDEX idx_checks_monitor_checked ON checks (monitor_id, checked_at DESC);

CREATE TABLE notifications
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type    TEXT    NOT NULL CHECK (type IN ('telegram', 'webhook')),
    config  TEXT    NOT NULL DEFAULT '{}',
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_enabled ON notifications (user_id, enabled);

CREATE TABLE monitor_notifications
(
    monitor_id      INTEGER NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
    notification_id INTEGER NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
    PRIMARY KEY (monitor_id, notification_id)
);

CREATE INDEX idx_monitor_notifications_notification
    ON monitor_notifications (notification_id);

CREATE TABLE status_pages
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name    TEXT    NOT NULL,
    slug    TEXT    NOT NULL UNIQUE,
    public  INTEGER NOT NULL DEFAULT 0 CHECK (public IN (0, 1))
);

CREATE INDEX idx_status_pages_user_id ON status_pages (user_id);
CREATE INDEX idx_status_pages_slug ON status_pages (slug);
CREATE INDEX idx_status_pages_public ON status_pages (public) WHERE public = 1;
