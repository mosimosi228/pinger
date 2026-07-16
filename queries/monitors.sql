-- name: CreateMonitor :one
INSERT INTO monitors (
    user_id,
    name,
    type,
    target,
    interval,
    timeout,
    enabled,
    confirmations
) VALUES (
    sqlc.arg('user_id'),
    sqlc.arg('name'),
    sqlc.arg('type'),
    sqlc.arg('target'),
    sqlc.arg('interval'),
    sqlc.arg('timeout'),
    sqlc.arg('enabled'),
    sqlc.arg('confirmations')
) RETURNING *;

-- name: GetMonitorById :one
SELECT m.*
FROM monitors m
WHERE m.id = sqlc.arg('id');

-- name: GetMonitorByIdAndUser :one
SELECT m.*
FROM monitors m
WHERE m.id = sqlc.arg('id')
  AND m.user_id = sqlc.arg('user_id');

-- name: ListMonitorsByUser :many
SELECT m.*
FROM monitors m
WHERE m.user_id = sqlc.arg('user_id')
ORDER BY m.created_at DESC;

-- name: ListEnabledMonitors :many
SELECT m.*
FROM monitors m
WHERE m.enabled = 1
ORDER BY m.id;

-- name: ClaimDueMonitors :many
UPDATE monitors
SET next_check_at = datetime('now', '+' || interval || ' seconds')
WHERE id IN (
    SELECT id
    FROM monitors
    WHERE enabled = 1
      AND next_check_at <= datetime('now')
    ORDER BY next_check_at ASC
    LIMIT sqlc.arg('limit_count')
)
RETURNING *;

-- name: ListEnabledMonitorsByUser :many
SELECT m.*
FROM monitors m
WHERE m.user_id = sqlc.arg('user_id')
  AND m.enabled = 1
ORDER BY m.id;

-- name: UpdateMonitor :one
UPDATE monitors
SET name           = COALESCE(sqlc.narg('name'), name),
    type           = COALESCE(sqlc.narg('type'), type),
    target         = COALESCE(sqlc.narg('target'), target),
    interval       = COALESCE(sqlc.narg('interval'), interval),
    timeout        = COALESCE(sqlc.narg('timeout'), timeout),
    enabled        = COALESCE(sqlc.narg('enabled'), enabled),
    confirmations  = COALESCE(sqlc.narg('confirmations'), confirmations)
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteMonitor :exec
DELETE FROM monitors
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id');
