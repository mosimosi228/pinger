-- name: CreateCheck :one
INSERT INTO checks (
    monitor_id,
    status,
    status_code,
    latency,
    error
) VALUES (
    sqlc.arg('monitor_id'),
    sqlc.arg('status'),
    sqlc.arg('status_code'),
    sqlc.arg('latency'),
    sqlc.arg('error')
) RETURNING *;

-- name: GetCheckById :one
SELECT c.*
FROM checks c
WHERE c.id = sqlc.arg('id');

-- name: GetLatestCheckByMonitor :one
SELECT c.*
FROM checks c
WHERE c.monitor_id = sqlc.arg('monitor_id')
ORDER BY c.checked_at DESC, c.id DESC
LIMIT 1;

-- name: GetCheckBeforeIDByStatus :one
SELECT c.*
FROM checks c
WHERE c.monitor_id = sqlc.arg('monitor_id')
  AND c.status = sqlc.arg('status')
  AND c.id < sqlc.arg('id')
ORDER BY c.id DESC
LIMIT 1;

-- name: ListChecksByMonitor :many
SELECT c.*
FROM checks c
WHERE c.monitor_id = sqlc.arg('monitor_id')
ORDER BY c.checked_at DESC, c.id DESC
LIMIT sqlc.arg('limit_count');

-- name: ListChecksByMonitorSince :many
SELECT c.*
FROM checks c
WHERE c.monitor_id = sqlc.arg('monitor_id')
  AND c.checked_at >= sqlc.arg('since')
ORDER BY c.checked_at DESC, c.id DESC;

-- name: GetCheckStatsByMonitorSince :one
SELECT
    COUNT(*) AS total,
    CAST(COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0) AS INTEGER) AS ok
FROM checks
WHERE monitor_id = sqlc.arg('monitor_id')
  AND checked_at >= sqlc.arg('since');

-- name: DeleteOldChecks :exec
DELETE FROM checks
WHERE checked_at < sqlc.arg('before');
