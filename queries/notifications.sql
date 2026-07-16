-- name: CreateNotification :one
INSERT INTO notifications (
    user_id,
    type,
    config,
    enabled
) VALUES (
    sqlc.arg('user_id'),
    sqlc.arg('type'),
    sqlc.arg('config'),
    sqlc.arg('enabled')
) RETURNING *;

-- name: GetNotificationById :one
SELECT n.*
FROM notifications n
WHERE n.id = sqlc.arg('id');

-- name: GetNotificationByIdAndUser :one
SELECT n.*
FROM notifications n
WHERE n.id = sqlc.arg('id')
  AND n.user_id = sqlc.arg('user_id');

-- name: ListNotificationsByUser :many
SELECT n.*
FROM notifications n
WHERE n.user_id = sqlc.arg('user_id')
ORDER BY n.id DESC;

-- name: ListEnabledNotificationsByUser :many
SELECT n.*
FROM notifications n
WHERE n.user_id = sqlc.arg('user_id')
  AND n.enabled = 1
ORDER BY n.id;

-- name: UpdateNotification :one
UPDATE notifications
SET type    = COALESCE(sqlc.narg('type'), type),
    config  = COALESCE(sqlc.narg('config'), config),
    enabled = COALESCE(sqlc.narg('enabled'), enabled)
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteNotification :exec
DELETE FROM notifications
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id');
