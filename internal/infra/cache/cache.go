package cache

import (
	"log/slog"
	"sync"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
	pkgcache "github.com/mosimosi228/pinger/pkg/cache"
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
	userCache                   *pkgcache.LRUCache[string, *mapping.User]
	monitorCache                *pkgcache.LRUCache[int64, *mapping.Monitor]
	monitorsByUserCache         *pkgcache.LRUCache[string, []*mapping.Monitor]
	latestCheckCache            *pkgcache.LRUCache[int64, *mapping.Check]
	notificationCache           *pkgcache.LRUCache[int64, *mapping.Notification]
	notificationsByUserCache    *pkgcache.LRUCache[string, []*mapping.Notification]
	notificationsByMonitorCache *pkgcache.LRUCache[int64, []*mapping.Notification]
	statusPageCache             *pkgcache.LRUCache[int64, *mapping.StatusPage]
	statusPageBySlugCache       *pkgcache.LRUCache[string, *mapping.StatusPage]
	once                        sync.Once
)

// Init initializes caches once. Call at app startup before HTTP.
func Init() {
	once.Do(func() {
		userCache = pkgcache.NewLRU[string, *mapping.User](userCacheCapacity)
		monitorCache = pkgcache.NewLRU[int64, *mapping.Monitor](monitorCacheCapacity)
		monitorsByUserCache = pkgcache.NewLRU[string, []*mapping.Monitor](monitorsByUserCacheCapacity)
		latestCheckCache = pkgcache.NewLRU[int64, *mapping.Check](checkCacheCapacity)
		notificationCache = pkgcache.NewLRU[int64, *mapping.Notification](notificationCacheCapacity)
		notificationsByUserCache = pkgcache.NewLRU[string, []*mapping.Notification](notificationsByUserCacheCapacity)
		notificationsByMonitorCache = pkgcache.NewLRU[int64, []*mapping.Notification](notificationsByMonitorCapacity)
		statusPageCache = pkgcache.NewLRU[int64, *mapping.StatusPage](statusPageCacheCapacity)
		statusPageBySlugCache = pkgcache.NewLRU[string, *mapping.StatusPage](statusPageBySlugCacheCapacity)
		slog.Info("Cache initialized")
	})
}

// User returns the user cache.
func User() *pkgcache.LRUCache[string, *mapping.User] {
	if userCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return userCache
}

// Monitor returns the monitor cache keyed by id.
func Monitor() *pkgcache.LRUCache[int64, *mapping.Monitor] {
	if monitorCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return monitorCache
}

// MonitorsByUser returns the per-user monitor list cache.
func MonitorsByUser() *pkgcache.LRUCache[string, []*mapping.Monitor] {
	if monitorsByUserCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return monitorsByUserCache
}

// LatestCheck returns the latest check cache keyed by monitor_id.
func LatestCheck() *pkgcache.LRUCache[int64, *mapping.Check] {
	if latestCheckCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return latestCheckCache
}

// Notification returns the notification cache keyed by id.
func Notification() *pkgcache.LRUCache[int64, *mapping.Notification] {
	if notificationCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return notificationCache
}

// NotificationsByUser returns the per-user notification list cache.
func NotificationsByUser() *pkgcache.LRUCache[string, []*mapping.Notification] {
	if notificationsByUserCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return notificationsByUserCache
}

// NotificationsByMonitor returns notifications linked to a monitor.
func NotificationsByMonitor() *pkgcache.LRUCache[int64, []*mapping.Notification] {
	if notificationsByMonitorCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return notificationsByMonitorCache
}

// StatusPage returns the status page cache keyed by id.
func StatusPage() *pkgcache.LRUCache[int64, *mapping.StatusPage] {
	if statusPageCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return statusPageCache
}

// StatusPageBySlug returns the status page cache keyed by slug.
func StatusPageBySlug() *pkgcache.LRUCache[string, *mapping.StatusPage] {
	if statusPageBySlugCache == nil {
		panic("cache not initialized: call cache.Init first")
	}
	return statusPageBySlugCache
}
