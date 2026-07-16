# pkg/cache

Two in-memory caches: Ristretto (TTL) and LRU.

Import: `github.com/mosimosi228/pinger/pkg/cache`

## Cache (Ristretto + TTL)

High QPS, cost-based eviction, per-key TTL.

```go
c := cache.NewCache[string, int]()
defer c.Close()

c.Set("k", 42, time.Minute)
v, ok := c.Get("k")
c.Del("k")
c.Clear()
hits, misses, drops := c.Metrics()
```

| Method | Description |
|--------|-------------|
| `Set(key, value, ttl)` | write with TTL (`Wait` after set) |
| `Get` / `Del` / `Clear` / `Close` | read / delete / reset / shutdown |
| `GetOrLoad(key, ttl, load)` | cache-aside: hit from cache, otherwise `load` + `Set` |
| `Metrics` | hits, misses, drops |

```go
v, err := c.GetOrLoad("user:1", time.Minute, func() (User, error) {
    return db.GetUser(1)
})
```

Internal config is tuned for large volumes (many counters / large MaxCost).

## LRUCache

Simple thread-safe fixed-capacity LRU (no TTL).

```go
lru := cache.NewLRU[string, string](1000)
lru.Set("a", "b")
v, ok := lru.Get("a")

v, err := lru.GetOrLoad("a", func() (string, error) {
    return fetch("a")
})
```

- Capacity ≤ 0 → default `1000`.
- `Get` on hit moves the entry to the front (LRU order).
- `GetOrLoad` — cache-aside without TTL.

## When to use which

| Need | Use |
|------|-----|
| TTL, high load | `NewCache` |
| Small local LRU | `NewLRU` |
