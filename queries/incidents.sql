-- name: CreateIncident :one
INSERT INTO incidents (
    monitor_id,
    title,
    message
) VALUES (
    sqlc.arg('monitor_id'),
    sqlc.arg('title'),
    sqlc.arg('message')
) RETURNING *;

-- name: GetOpenIncidentByMonitor :one
SELECT *
FROM incidents
WHERE monitor_id = sqlc.arg('monitor_id')
  AND resolved_at IS NULL
ORDER BY id DESC
LIMIT 1;

-- name: ResolveOpenIncidentByMonitor :one
UPDATE incidents
SET resolved_at = datetime('now')
WHERE id = (
    SELECT i.id
    FROM incidents i
    WHERE i.monitor_id = sqlc.arg('monitor_id')
      AND i.resolved_at IS NULL
    ORDER BY i.id DESC
    LIMIT 1
)
RETURNING *;

-- name: ListIncidentsByMonitorIDsSince :many
SELECT
    i.id,
    i.monitor_id,
    m.name AS monitor_name,
    i.title,
    i.message,
    i.started_at,
    i.resolved_at
FROM incidents i
JOIN monitors m ON m.id = i.monitor_id
WHERE i.monitor_id = sqlc.arg('monitor_id')
  AND (
    i.resolved_at IS NULL
    OR i.started_at >= sqlc.arg('since')
    OR (i.resolved_at IS NOT NULL AND i.resolved_at >= sqlc.arg('since'))
  )
ORDER BY
    CASE WHEN i.resolved_at IS NULL THEN 0 ELSE 1 END,
    COALESCE(i.resolved_at, i.started_at) DESC;

-- name: DeleteOldResolvedIncidents :exec
DELETE FROM incidents
WHERE resolved_at IS NOT NULL
  AND resolved_at < sqlc.arg('before');
