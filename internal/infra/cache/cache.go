package cache

import (
	"log/slog"
	"sync"

	"github.com/mosimosi228/kit/cache"
	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

const (
	userCacheCapacity                = 100
	monitorCacheCapacity             = 10_000
	monitorsByUserCacheCapacity      = 1_000
	checkCacheCapacity               = 10_000
	notificationCacheCapacity        = 5_000
	notificationsByUserCacheCapacity = 1_000
	notificationsByMonitorCapacity   = 5_000
	statusPageCacheCapacity          = 1_000
	statusPageBySlugCacheCapacity    = 1_000
)

var (
	userCache                   *cache.LRUCache[string, *mapping.User]
	monitorCache                *cache.LRUCache[int64, *mapping.Monitor]
	monitorsByUserCache         *cache.LRUCache[string, []*mapping.Monitor]
	latestCheckCache            *cache.LRUCache[int64, *mapping.Check]
	notificationCache           *cache.LRUCache[int64, *mapping.Notification]
	notificationsByUserCache    *cache.LRUCache[string, []*mapping.Notification]
	notificationsByMonitorCache *cache.LRUCache[int64, []*mapping.Notification]
	statusPageCache             *cache.LRUCache[int64, *mapping.StatusPage]
	statusPageBySlugCache       *cache.LRUCache[string, *mapping.StatusPage]
	once                        sync.Once
)

// Init initializes caches once. Call at app startup before HTTP.
func Init() {
	once.Do(func() {
		userCache = cache.NewLRU[string, *mapping.User](userCacheCapacity)
		monitorCache = cache.NewLRU[int64, *mapping.Monitor](monitorCacheCapacity)
		monitorsByUserCache = cache.NewLRU[string, []*mapping.Monitor](monitorsByUserCacheCapacity)
		latestCheckCache = cache.NewLRU[int64, *mapping.Check](checkCacheCapacity)
		notificationCache = cache.NewLRU[int64, *mapping.Notification](notificationCacheCapacity)
		notificationsByUserCache = cache.NewLRU[string, []*mapping.Notification](notificationsByUserCacheCapacity)
		notificationsByMonitorCache = cache.NewLRU[int64, []*mapping.Notification](notificationsByMonitorCapacity)
		statusPageCache = cache.NewLRU[int64, *mapping.StatusPage](statusPageCacheCapacity)
		statusPageBySlugCache = cache.NewLRU[string, *mapping.StatusPage](statusPageBySlugCacheCapacity)
		slog.Info("Cache initialized")
	})
}

// User returns the user cache.
func User() *cache.LRUCache[string, *mapping.User] {
	if userCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return userCache
}

// Monitor returns the monitor cache keyed by id.
func Monitor() *cache.LRUCache[int64, *mapping.Monitor] {
	if monitorCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return monitorCache
}

// MonitorsByUser returns the per-user monitor list cache.
func MonitorsByUser() *cache.LRUCache[string, []*mapping.Monitor] {
	if monitorsByUserCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return monitorsByUserCache
}

// LatestCheck returns the latest check cache keyed by monitor_id.
func LatestCheck() *cache.LRUCache[int64, *mapping.Check] {
	if latestCheckCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return latestCheckCache
}

// Notification returns the notification cache keyed by id.
func Notification() *cache.LRUCache[int64, *mapping.Notification] {
	if notificationCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return notificationCache
}

// NotificationsByUser returns the per-user notification list cache.
func NotificationsByUser() *cache.LRUCache[string, []*mapping.Notification] {
	if notificationsByUserCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return notificationsByUserCache
}

// NotificationsByMonitor returns notifications linked to a monitor.
func NotificationsByMonitor() *cache.LRUCache[int64, []*mapping.Notification] {
	if notificationsByMonitorCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return notificationsByMonitorCache
}

// StatusPage returns the status page cache keyed by id.
func StatusPage() *cache.LRUCache[int64, *mapping.StatusPage] {
	if statusPageCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return statusPageCache
}

// StatusPageBySlug returns the status page cache keyed by slug.
func StatusPageBySlug() *cache.LRUCache[string, *mapping.StatusPage] {
	if statusPageBySlugCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return statusPageBySlugCache
}
