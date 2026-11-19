package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/yitching/crib-planner/backend/internal/calc"
)

func post(t *testing.T, h http.Handler, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestCalculate(t *testing.T) {
	h := NewHandler("")
	rec := post(t, h, `{"flatType":"4-room","price":400000,"income":7000,"cpfA":25000,"cpfB":20000,"cash":93000,"loanType":"hdb"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	var r calc.Result
	if err := json.NewDecoder(rec.Body).Decode(&r); err != nil {
		t.Fatal(err)
	}
	if r.CashLeft != 91000 || r.Verdict != "ok" || len(r.Stops) != 4 {
		t.Errorf("unexpected result: %+v", r)
	}
}

func TestCalculateRejectsBadInput(t *testing.T) {
	h := NewHandler("")
	for _, body := range []string{``, `{`, `{"flatType":"castle"}`, `{"price":-5}`, `{"surprise":1}`} {
		if rec := post(t, h, body); rec.Code != http.StatusBadRequest {
			t.Errorf("body %q: status = %d, want 400", body, rec.Code)
		}
	}
}

func TestCalculateWrongMethod(t *testing.T) {
	rec := httptest.NewRecorder()
	NewHandler("").ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/calculate", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", rec.Code)
	}
}

func TestSPAFallback(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>app</html>"), 0o644); err != nil {
		t.Fatal(err)
	}
	h := NewHandler(dir)
	for _, path := range []string{"/", "/budget"} {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
		if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "app") {
			t.Errorf("%s: status = %d, body = %q", path, rec.Code, rec.Body)
		}
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/nope", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("/api/nope: status = %d, want 404", rec.Code)
	}
}
