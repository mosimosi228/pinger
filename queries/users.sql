-- name: CreateUser :one
INSERT INTO users (
    email,
    username,
    password_hash,
    role,
    api_key
) VALUES (
    sqlc.arg('email'),
    sqlc.arg('username'),
    sqlc.arg('password_hash'),
    sqlc.arg('role'),
    sqlc.arg('api_key')
) RETURNING *;

-- name: GetListUser :many
SELECT u.*
FROM users u
ORDER BY u.created_at DESC;

-- name: GetListUserByRole :many
SELECT u.*
FROM users u
WHERE u.role = sqlc.arg('role')
ORDER BY u.created_at DESC;

-- name: GetUserById :one
SELECT u.*
FROM users u
WHERE u.id = sqlc.arg('id');

-- name: GetUserByEmail :one
SELECT u.*
FROM users u
WHERE lower(u.email) = lower(sqlc.arg('email'));

-- name: GetUserByUserName :one
SELECT u.*
FROM users u
WHERE lower(u.username) = lower(sqlc.arg('username'));

-- name: GetUserByAPIKey :one
SELECT u.*
FROM users u
WHERE u.api_key = sqlc.arg('api_key')
  AND u.status = 'active';

-- name: UpdateLastLogin :exec
UPDATE users
SET last_login_at = datetime('now'),
    last_login_ip = sqlc.arg('ip')
WHERE id = sqlc.arg('id');

-- name: UpdateUser :one
UPDATE users
SET email         = COALESCE(sqlc.narg('email'), email),
    username      = COALESCE(sqlc.narg('username'), username),
    password_hash = COALESCE(sqlc.narg('password_hash'), password_hash),
    role          = COALESCE(sqlc.narg('role'), role),
    status        = COALESCE(sqlc.narg('status'), status),
    api_key       = COALESCE(sqlc.narg('api_key'), api_key)
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: DeleteUser :exec
UPDATE users
SET status = 'inactive'
WHERE id = sqlc.arg('id');

-- name: SetActive :exec
UPDATE users
SET status = 'active'
WHERE id = sqlc.arg('id');

-- name: GetUserSelectList :many
SELECT (username || '(' || email || ')') AS title,
       id AS value
FROM users
WHERE lower(username) LIKE '%' || lower(COALESCE(sqlc.narg('name'), '')) || '%'
   OR lower(email) LIKE '%' || lower(COALESCE(sqlc.narg('name'), '')) || '%'
   OR id LIKE '%' || COALESCE(sqlc.narg('name'), '') || '%'
ORDER BY id
LIMIT 10;
