package worker

import (
	"context"
	"net"
	"strings"
	"time"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

func pingTCP(ctx context.Context, monitor *mapping.Monitor) CheckResult {
	target := strings.TrimSpace(monitor.Target)
	if target == "" {
		return CheckResult{OK: false, Err: "empty target"}
	}
	if !strings.Contains(target, ":") {
		return CheckResult{OK: false, Err: "tcp target must be host:port"}
	}

	start := time.Now()
	d := net.Dialer{}
	conn, err := d.DialContext(ctx, "tcp", target)
	latency := int(time.Since(start).Milliseconds())
	if err != nil {
		return CheckResult{OK: false, Err: err.Error(), LatencyMS: latency}
	}
	_ = conn.Close()
	return CheckResult{OK: true, LatencyMS: latency}
}
