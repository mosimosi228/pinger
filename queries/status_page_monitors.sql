-- name: AttachMonitorToStatusPage :exec
INSERT INTO status_page_monitors (status_page_id, monitor_id)
VALUES (sqlc.arg('status_page_id'), sqlc.arg('monitor_id'));

-- name: DetachMonitorFromStatusPage :exec
DELETE FROM status_page_monitors
WHERE status_page_id = sqlc.arg('status_page_id')
  AND monitor_id = sqlc.arg('monitor_id');

-- name: ListMonitorsByStatusPage :many
SELECT m.*
FROM monitors m
JOIN status_page_monitors spm ON spm.monitor_id = m.id
WHERE spm.status_page_id = sqlc.arg('status_page_id')
ORDER BY m.name;

-- name: ListStatusPagesByMonitor :many
SELECT sp.*
FROM status_pages sp
JOIN status_page_monitors spm ON spm.status_page_id = sp.id
WHERE spm.monitor_id = sqlc.arg('monitor_id')
ORDER BY sp.id;
