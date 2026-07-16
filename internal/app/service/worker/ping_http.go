package worker

import (
	"context"
	"fmt"
	"net/http"
	"time"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

func pingHTTP(ctx context.Context, monitor *mapping.Monitor) CheckResult {
	start := time.Now()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, monitor.Target, nil)
	if err != nil {
		return CheckResult{OK: false, Err: err.Error(), LatencyMS: int(time.Since(start).Milliseconds())}
	}
	req.Header.Set("User-Agent", "Pinger/1.0")

	client := &http.Client{
		Timeout: time.Duration(monitor.Timeout) * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	resp, err := client.Do(req)
	latency := int(time.Since(start).Milliseconds())
	if err != nil {
		return CheckResult{OK: false, Err: err.Error(), LatencyMS: latency}
	}
	defer resp.Body.Close()

	ok := resp.StatusCode >= 200 && resp.StatusCode < 400
	res := CheckResult{
		OK:         ok,
		StatusCode: resp.StatusCode,
		LatencyMS:  latency,
	}
	if !ok {
		res.Err = fmt.Sprintf("unexpected status %d", resp.StatusCode)
	}
	return res
}
