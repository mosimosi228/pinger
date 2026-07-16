-- name: CreateStatusPage :one
INSERT INTO status_pages (
    user_id,
    name,
    slug,
    public
) VALUES (
    sqlc.arg('user_id'),
    sqlc.arg('name'),
    sqlc.arg('slug'),
    sqlc.arg('public')
) RETURNING *;

-- name: GetStatusPageById :one
SELECT sp.*
FROM status_pages sp
WHERE sp.id = sqlc.arg('id');

-- name: GetStatusPageByIdAndUser :one
SELECT sp.*
FROM status_pages sp
WHERE sp.id = sqlc.arg('id')
  AND sp.user_id = sqlc.arg('user_id');

-- name: GetStatusPageBySlug :one
SELECT sp.*
FROM status_pages sp
WHERE sp.slug = sqlc.arg('slug');

-- name: GetPublicStatusPageBySlug :one
SELECT sp.*
FROM status_pages sp
WHERE sp.slug = sqlc.arg('slug')
  AND sp.public = 1;

-- name: ListStatusPagesByUser :many
SELECT sp.*
FROM status_pages sp
WHERE sp.user_id = sqlc.arg('user_id')
ORDER BY sp.id DESC;

-- name: UpdateStatusPage :one
UPDATE status_pages
SET name   = COALESCE(sqlc.narg('name'), name),
    slug   = COALESCE(sqlc.narg('slug'), slug),
    public = COALESCE(sqlc.narg('public'), public)
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteStatusPage :exec
DELETE FROM status_pages
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id');
