package cache

import (
	"log/slog"
	"time"

	"github.com/dgraph-io/ristretto"
)

type Cache[K comparable, V any] struct {
	cache *ristretto.Cache
}

// NewCache is tuned for RTB bids (~500k–1M active bids).
func NewCache[K comparable, V any]() *Cache[K, V] {
	c, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 10e7,       // 100M counters — accuracy for 10M keys
		MaxCost:     8 << 30,    // 4GB cost (cost=1 per item → 4B items max, limited by RAM in practice)
		BufferItems: 128 * 1024, // large buffer for QPS >10k
		Metrics:     true,
		OnEvict: func(item *ristretto.Item) {
			slog.Debug("bid cache evicted", slog.Any("key", item.Key))
		},
		OnReject: func(item *ristretto.Item) {
			slog.Debug("bid cache rejected (full)", slog.Any("key", item.Key))
		},
	})
	if err != nil {
		panic(err)
	}
	slog.Info("ristretto bid cache initialized")
	return &Cache[K, V]{cache: c}
}

func (c *Cache[K, V]) Set(key K, value V, ttl time.Duration) bool {
	ok := c.cache.SetWithTTL(key, value, 1, ttl)
	c.cache.Wait()
	return ok
}

func (c *Cache[K, V]) Get(key K) (V, bool) {
	val, found := c.cache.Get(key)
	if !found {
		var zero V
		return zero, false
	}
	return val.(V), true
}

func (c *Cache[K, V]) Del(key K) {
	c.cache.Del(key)
}

// Clear wipes the entire cache. Use after batch DB operations (e.g. worker resetting limit
// counters) when invalidating each key individually is too expensive.
func (c *Cache[K, V]) Clear() {
	c.cache.Clear()
}

func (c *Cache[K, V]) Close() {
	c.cache.Close()
}

func (c *Cache[K, V]) Metrics() (hits, misses, drops uint64) {
	return c.cache.Metrics.Hits(), c.cache.Metrics.Misses(), c.cache.Metrics.GetsDropped()
}

// GetOrLoad reads from the cache first; on miss it calls load, stores the result, and returns it.
func (c *Cache[K, V]) GetOrLoad(key K, ttl time.Duration, load func() (V, error)) (V, error) {
	if v, ok := c.Get(key); ok {
		return v, nil
	}

	v, err := load()
	if err != nil {
		var zero V
		return zero, err
	}

	c.Set(key, v, ttl)
	return v, nil
}
