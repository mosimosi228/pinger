package live

import (
	"encoding/json"
	"log/slog"
	"sync"
)

// StatusEvent is a live monitor status update.
type StatusEvent struct {
	Type      string   `json:"type"`
	ID        int64    `json:"id"`
	UserID    string   `json:"user_id"`
	Status    bool     `json:"status"`
	Latency   *int64   `json:"latency,omitempty"`
	CheckedAt string   `json:"checked_at"`
	Enabled   bool     `json:"enabled"`
	Uptime1h  *float64 `json:"uptime_1h,omitempty"`
}

type Client struct {
	send chan []byte
}

type Hub struct {
	mu       sync.RWMutex
	byUser   map[string]map[*Client]struct{}
	bySlug   map[string]map[*Client]struct{}
	register chan subscription
	unreg    chan subscription
	publish  chan publishMsg
}

type subscription struct {
	c      *Client
	userID string
	slug   string
}

type publishMsg struct {
	userID  string
	slugs   []string
	payload []byte
}

var defaultHub = NewHub()

func Default() *Hub { return defaultHub }

func NewHub() *Hub {
	h := &Hub{
		byUser:   make(map[string]map[*Client]struct{}),
		bySlug:   make(map[string]map[*Client]struct{}),
		register: make(chan subscription, 64),
		unreg:    make(chan subscription, 64),
		publish:  make(chan publishMsg, 256),
	}
	go h.loop()
	return h
}

func (h *Hub) loop() {
	for {
		select {
		case s := <-h.register:
			h.mu.Lock()
			if s.userID != "" {
				if h.byUser[s.userID] == nil {
					h.byUser[s.userID] = make(map[*Client]struct{})
				}
				h.byUser[s.userID][s.c] = struct{}{}
			}
			if s.slug != "" {
				if h.bySlug[s.slug] == nil {
					h.bySlug[s.slug] = make(map[*Client]struct{})
				}
				h.bySlug[s.slug][s.c] = struct{}{}
			}
			h.mu.Unlock()
		case s := <-h.unreg:
			h.mu.Lock()
			if s.userID != "" {
				if set := h.byUser[s.userID]; set != nil {
					delete(set, s.c)
					if len(set) == 0 {
						delete(h.byUser, s.userID)
					}
				}
			}
			if s.slug != "" {
				if set := h.bySlug[s.slug]; set != nil {
					delete(set, s.c)
					if len(set) == 0 {
						delete(h.bySlug, s.slug)
					}
				}
			}
			h.mu.Unlock()
			close(s.c.send)
		case msg := <-h.publish:
			h.mu.RLock()
			targets := make(map[*Client]struct{})
			if set := h.byUser[msg.userID]; set != nil {
				for c := range set {
					targets[c] = struct{}{}
				}
			}
			for _, slug := range msg.slugs {
				if set := h.bySlug[slug]; set != nil {
					for c := range set {
						targets[c] = struct{}{}
					}
				}
			}
			h.mu.RUnlock()
			for c := range targets {
				select {
				case c.send <- msg.payload:
				default:
				}
			}
		}
	}
}

func (h *Hub) SubscribeUser(userID string) *Client {
	c := &Client{send: make(chan []byte, 16)}
	h.register <- subscription{c: c, userID: userID}
	return c
}

func (h *Hub) SubscribeSlug(slug string) *Client {
	c := &Client{send: make(chan []byte, 16)}
	h.register <- subscription{c: c, slug: slug}
	return c
}

func (h *Hub) Unsubscribe(c *Client, userID, slug string) {
	h.unreg <- subscription{c: c, userID: userID, slug: slug}
}

func (h *Hub) Publish(evt StatusEvent, slugs []string) {
	evt.Type = "monitor.status"
	payload, err := json.Marshal(evt)
	if err != nil {
		slog.Warn("live marshal", slog.Any("err", err))
		return
	}
	select {
	case h.publish <- publishMsg{userID: evt.UserID, slugs: slugs, payload: payload}:
	default:
		slog.Warn("live publish queue full", slog.Int64("monitor_id", evt.ID))
	}
}

func (c *Client) Recv() <-chan []byte { return c.send }
