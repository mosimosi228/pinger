package worker

import (
	"testing"

	mapping "github.com/mosimosi228/pinger/internal/infra/db/maps"
)

// checks builds a newest-first slice from oldest→newest statuses.
func checks(statuses ...int64) []*mapping.Check {
	out := make([]*mapping.Check, len(statuses))
	for i, s := range statuses {
		out[len(statuses)-1-i] = &mapping.Check{ID: int64(i + 1), Status: s}
	}
	return out
}

func TestEvaluateConfirmations(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		needed  int64
		history []int64 // oldest → newest
		want    bool
	}{
		{name: "first up silent", needed: 1, history: []int64{1}, want: false},
		{name: "first three ups silent", needed: 3, history: []int64{1, 1, 1}, want: false},
		{name: "first down alerts", needed: 1, history: []int64{0}, want: true},
		{name: "first three downs alert", needed: 3, history: []int64{0, 0, 0}, want: true},
		{name: "partial down then up no alert", needed: 3, history: []int64{1, 1, 1, 0, 0, 1, 1, 1}, want: false},
		{name: "confirmed down after up", needed: 3, history: []int64{1, 1, 1, 0, 0, 0}, want: true},
		{name: "confirmed up after down", needed: 3, history: []int64{1, 1, 1, 0, 0, 0, 1, 1, 1}, want: true},
		{name: "fourth down no realert", needed: 3, history: []int64{1, 1, 1, 0, 0, 0, 0}, want: false},
		{name: "needed1 recovery", needed: 1, history: []int64{1, 0, 1}, want: true},
		{name: "needed1 still down no realert", needed: 1, history: []int64{1, 0, 0}, want: false},
		{name: "flap never confirmed down", needed: 2, history: []int64{1, 1, 0, 1, 1}, want: false},
		{name: "two downs after baseline", needed: 2, history: []int64{1, 1, 0, 0}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got, _ := evaluateConfirmations(checks(tt.history...), tt.needed)
			if got != tt.want {
				t.Fatalf("evaluateConfirmations(%v, %d) = %v, want %v", tt.history, tt.needed, got, tt.want)
			}
		})
	}
}
