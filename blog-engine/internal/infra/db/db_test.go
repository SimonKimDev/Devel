package db

import (
	"testing"
)

func TestBuildDSN(t *testing.T) {
	got := buildDSN("server.postgres.database.azure.com", 5432, "blog user", "blog")
	expected := "host='server.postgres.database.azure.com' port=5432 user='blog user' dbname='blog' sslmode=require"

	if got != expected {
		t.Errorf("expected %q, got %q", expected, got)
	}
}

func TestQuoteDSNValue(t *testing.T) {
	tests := []struct {
		value    string
		expected string
	}{
		{"plain", `'plain'`},
		{"", `''`},
		{"it's", `'it\'s'`},
		{`back\slash`, `'back\\slash'`},
		{"with space", `'with space'`},
	}

	for _, tt := range tests {
		got := quoteDSNValue(tt.value)
		if got != tt.expected {
			t.Errorf("quoteDSNValue(%q): expected %q, got %q", tt.value, tt.expected, got)
		}
	}
}
