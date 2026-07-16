package cache

import (
	"testing"
	"time"
)

func TestCacheSetGetDel(t *testing.T) {
	c := NewCache[string, int]()
	defer c.Close()

	if ok := c.Set("key", 42, time.Minute); !ok {
		t.Fatal("Set() returned false")
	}

	val, ok := c.Get("key")
	if !ok || val != 42 {
		t.Fatalf("Get() = (%d, %v), want (42, true)", val, ok)
	}

	c.Del("key")
	if _, ok := c.Get("key"); ok {
		t.Fatal("expected key to be deleted")
	}
}

func TestCacheTTLExpiry(t *testing.T) {
	c := NewCache[string, int]()
	defer c.Close()

	if ok := c.Set("temp", 1, 20*time.Millisecond); !ok {
		t.Fatal("Set() returned false")
	}

	time.Sleep(50 * time.Millisecond)

	if _, ok := c.Get("temp"); ok {
		t.Fatal("expected key to expire by TTL")
	}
}

func TestCacheClearAndMetrics(t *testing.T) {
	c := NewCache[string, int]()
	defer c.Close()

	c.Set("a", 1, time.Minute)
	c.Get("a")
	c.Get("missing")

	hits, misses, _ := c.Metrics()
	if hits == 0 || misses == 0 {
		t.Fatalf("Metrics() = hits=%d misses=%d, want both > 0", hits, misses)
	}

	c.Clear()
	if _, ok := c.Get("a"); ok {
		t.Fatal("expected cache to be empty after Clear()")
	}
}

func TestCacheGetOrLoad(t *testing.T) {
	c := NewCache[string, int]()
	defer c.Close()

	calls := 0
	load := func() (int, error) {
		calls++
		return 7, nil
	}

	v, err := c.GetOrLoad("k", time.Minute, load)
	if err != nil || v != 7 || calls != 1 {
		t.Fatalf("first GetOrLoad = (%d, %v) calls=%d", v, err, calls)
	}

	v, err = c.GetOrLoad("k", time.Minute, load)
	if err != nil || v != 7 || calls != 1 {
		t.Fatalf("second GetOrLoad = (%d, %v) calls=%d, want load once", v, err, calls)
	}
}
