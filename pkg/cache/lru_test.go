package cache

import "testing"

func TestNewLRUUsesDefaultCapacity(t *testing.T) {
	c := NewLRU[string, int](0)
	if c.cap != 1000 {
		t.Fatalf("default capacity = %d, want 1000", c.cap)
	}
}

func TestLRUGetSetAndEviction(t *testing.T) {
	c := NewLRU[string, int](2)

	c.Set("a", 1)
	c.Set("b", 2)
	c.Set("c", 3)

	if _, ok := c.Get("a"); ok {
		t.Fatal("expected key a to be evicted")
	}

	if val, ok := c.Get("b"); !ok || val != 2 {
		t.Fatalf("Get(b) = (%d, %v), want (2, true)", val, ok)
	}
	if val, ok := c.Get("c"); !ok || val != 3 {
		t.Fatalf("Get(c) = (%d, %v), want (3, true)", val, ok)
	}
}

func TestLRUSetUpdatesExistingKey(t *testing.T) {
	c := NewLRU[string, int](2)
	c.Set("a", 1)
	c.Set("a", 10)

	val, ok := c.Get("a")
	if !ok || val != 10 {
		t.Fatalf("Get(a) = (%d, %v), want (10, true)", val, ok)
	}
}

func TestLRUInvalidate(t *testing.T) {
	c := NewLRU[string, int](2)
	c.Set("a", 1)
	c.Invalidate("a")

	if _, ok := c.Get("a"); ok {
		t.Fatal("expected key a to be invalidated")
	}
}

func TestLRUInvalidateAll(t *testing.T) {
	c := NewLRU[string, int](2)
	c.Set("a", 1)
	c.Set("b", 2)
	c.InvalidateAll()

	if _, ok := c.Get("a"); ok {
		t.Fatal("expected cache to be empty after InvalidateAll")
	}
	if _, ok := c.Get("b"); ok {
		t.Fatal("expected cache to be empty after InvalidateAll")
	}
}

func TestLRUNilReceiver(t *testing.T) {
	var c *LRUCache[string, int]

	if _, ok := c.Get("a"); ok {
		t.Fatal("Get on nil cache should miss")
	}

	c.Set("a", 1)
	c.Invalidate("a")
	c.InvalidateAll()
}

func TestLRUGetOrLoad(t *testing.T) {
	c := NewLRU[string, int](10)

	calls := 0
	load := func() (int, error) {
		calls++
		return 5, nil
	}

	v, err := c.GetOrLoad("k", load)
	if err != nil || v != 5 || calls != 1 {
		t.Fatalf("first GetOrLoad = (%d, %v) calls=%d", v, err, calls)
	}

	v, err = c.GetOrLoad("k", load)
	if err != nil || v != 5 || calls != 1 {
		t.Fatalf("second GetOrLoad = (%d, %v) calls=%d, want load once", v, err, calls)
	}
}
