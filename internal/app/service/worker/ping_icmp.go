package worker

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

func pingICMP(ctx context.Context, monitor *mapping.Monitor) CheckResult {
	host := strings.TrimSpace(monitor.Target)
	host = strings.TrimPrefix(host, "http://")
	host = strings.TrimPrefix(host, "https://")
	if i := strings.IndexAny(host, "/:"); i >= 0 {
		host = host[:i]
	}
	if host == "" {
		return CheckResult{OK: false, Err: "empty icmp host"}
	}

	start := time.Now()
	cmd := exec.CommandContext(ctx, "ping", "-c", "1", "-W", fmt.Sprintf("%d", max(1, int(monitor.Timeout))), host)
	out, err := cmd.CombinedOutput()
	latency := int(time.Since(start).Milliseconds())
	if err != nil {
		msg := strings.TrimSpace(string(out))
		if msg == "" {
			msg = err.Error()
		}
		return CheckResult{OK: false, Err: msg, LatencyMS: latency}
	}
	return CheckResult{OK: true, LatencyMS: latency}
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
