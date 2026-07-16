CREATE TABLE status_page_monitors
(
    status_page_id INTEGER NOT NULL REFERENCES status_pages (id) ON DELETE CASCADE,
    monitor_id     INTEGER NOT NULL REFERENCES monitors (id) ON DELETE CASCADE,
    PRIMARY KEY (status_page_id, monitor_id)
);

CREATE INDEX idx_status_page_monitors_monitor
    ON status_page_monitors (monitor_id);

CREATE INDEX idx_monitors_due ON monitors (next_check_at) WHERE enabled = 1;
