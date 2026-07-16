CREATE TABLE users
(
    id            TEXT PRIMARY KEY NOT NULL DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
    ),
    email         TEXT        NOT NULL UNIQUE
        CHECK (email LIKE '%_@_%.__%'),
    username      TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    role          TEXT        NOT NULL DEFAULT 'user'
        CHECK (role IN ('admin', 'user')),
    status        TEXT        NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'blocked')),
    api_key       TEXT UNIQUE,
    last_login_at TEXT,
    last_login_ip TEXT,
    created_at    TEXT        NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT        NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users (lower(email));
CREATE INDEX idx_users_username ON users (lower(username));
CREATE INDEX idx_users_api_key ON users (api_key) WHERE api_key IS NOT NULL;
CREATE INDEX idx_users_active ON users (status) WHERE status = 'active';

CREATE TRIGGER users_set_updated_at
    AFTER UPDATE
    ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;
