-- name: UpsertMonitorUptimeHourly :exec
INSERT INTO monitor_uptime_hourly (monitor_id, hour_start, ok, total)
VALUES (
    sqlc.arg('monitor_id'),
    sqlc.arg('hour_start'),
    sqlc.arg('ok_inc'),
    1
)
ON CONFLICT (monitor_id, hour_start) DO UPDATE SET
    ok = ok + excluded.ok,
    total = total + 1;

-- name: ListMonitorUptimeHourlySince :many
SELECT monitor_id, hour_start, ok, total
FROM monitor_uptime_hourly
WHERE monitor_id = sqlc.arg('monitor_id')
  AND hour_start >= sqlc.arg('since')
ORDER BY hour_start ASC;

-- name: DeleteOldMonitorUptimeHourly :exec
DELETE FROM monitor_uptime_hourly
WHERE hour_start < sqlc.arg('before');
