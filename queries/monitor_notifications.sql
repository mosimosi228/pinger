-- name: AttachNotificationToMonitor :exec
INSERT INTO monitor_notifications (monitor_id, notification_id)
VALUES (sqlc.arg('monitor_id'), sqlc.arg('notification_id'));

-- name: DetachNotificationFromMonitor :exec
DELETE FROM monitor_notifications
WHERE monitor_id = sqlc.arg('monitor_id')
  AND notification_id = sqlc.arg('notification_id');

-- name: ListNotificationsByMonitor :many
SELECT n.*
FROM notifications n
JOIN monitor_notifications mn ON mn.notification_id = n.id
WHERE mn.monitor_id = sqlc.arg('monitor_id')
ORDER BY n.id;

-- name: ListEnabledNotificationsByMonitor :many
SELECT n.*
FROM notifications n
JOIN monitor_notifications mn ON mn.notification_id = n.id
WHERE mn.monitor_id = sqlc.arg('monitor_id')
  AND n.enabled = 1
ORDER BY n.id;

-- name: ListMonitorsByNotification :many
SELECT m.*
FROM monitors m
JOIN monitor_notifications mn ON mn.monitor_id = m.id
WHERE mn.notification_id = sqlc.arg('notification_id')
ORDER BY m.id;
