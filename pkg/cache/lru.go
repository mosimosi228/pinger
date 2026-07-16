package cache

import (
	"container/list"
	"log/slog"
	"sync"
)

type entryLru[K comparable, V any] struct {
	key   K
	value V
}

type LRUCache[K comparable, V any] struct {
	mu        sync.RWMutex
	cap       int
	items     map[K]*list.Element
	evictList *list.List
}

func NewLRU[K comparable, V any](capacity int) *LRUCache[K, V] {
	if capacity <= 0 {
		capacity = 1000
	}
	return &LRUCache[K, V]{
		cap:       capacity,
		items:     make(map[K]*list.Element),
		evictList: list.New(),
	}
}

// Get returns the value for key and updates LRU order on hit.
// Miss: RLock only (minimal contention). Hit: brief Lock for double-check and MoveToFront
// to avoid a race with eviction (the element may be evicted in Set/Invalidate between RUnlock and Lock).
func (c *LRUCache[K, V]) Get(key K) (V, bool) {
	if c == nil {
		var zero V
		return zero, false
	}
	c.mu.RLock()
	elem, ok := c.items[key]
	c.mu.RUnlock()
	if !ok {
		var zero V
		return zero, false
	}
	c.mu.Lock()
	// Element may have been evicted between RUnlock and Lock — recheck.
	if elem2, stillPresent := c.items[key]; !stillPresent || elem2 != elem {
		c.mu.Unlock()
		var zero V
		return zero, false
	}
	c.evictList.MoveToFront(elem)
	value := elem.Value.(*entryLru[K, V]).value
	c.mu.Unlock()
	return value, true
}

func (c *LRUCache[K, V]) Set(key K, value V) {
	if c == nil {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if elem, ok := c.items[key]; ok {
		c.evictList.MoveToFront(elem)
		elem.Value.(*entryLru[K, V]).value = value
		return
	}
	e := &entryLru[K, V]{key: key, value: value}
	elem := c.evictList.PushFront(e)
	c.items[key] = elem
	if c.evictList.Len() > c.cap {
		if back := c.evictList.Back(); back != nil {
			e := c.evictList.Remove(back).(*entryLru[K, V])
			delete(c.items, e.key)
			slog.Debug("evicted from cache", "key", e.key)
		}
	}
}

func (c *LRUCache[K, V]) Invalidate(key K) {
	if c == nil {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if elem, ok := c.items[key]; ok {
		c.evictList.Remove(elem)
		delete(c.items, key)
		slog.Debug("invalidated cache entry", "key", key)
	}
}

// InvalidateAll removes all entries from the cache. Use when a single entity affects all keys (e.g. deal with no endpoint).
func (c *LRUCache[K, V]) InvalidateAll() {
	if c == nil {
		return
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[K]*list.Element)
	c.evictList = list.New()
	slog.Debug("invalidated entire cache")
}

// GetOrLoad reads from the cache first; on miss it calls load, stores the result, and returns it.
func (c *LRUCache[K, V]) GetOrLoad(key K, load func() (V, error)) (V, error) {
	if v, ok := c.Get(key); ok {
		return v, nil
	}

	v, err := load()
	if err != nil {
		var zero V
		return zero, err
	}

	c.Set(key, v)
	return v, nil
}
