// Package api exposes the calculator over HTTP.
package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/yitching/crib-planner/backend/internal/calc"
)

const maxBody = 16 << 10

// NewHandler returns the app's routes. If staticDir is non-empty, the built
// frontend is served from it, with unknown paths falling back to index.html.
func NewHandler(staticDir string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/defaults", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, calc.DefaultInputs)
	})
	mux.HandleFunc("POST /api/calculate", handleCalculate)
	if staticDir != "" {
		mux.Handle("/", spa(staticDir))
	}
	return mux
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	in := calc.DefaultInputs
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBody))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&in); err != nil {
		msg := "invalid JSON body"
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			msg = "request body too large"
		} else if errors.Is(err, io.EOF) {
			msg = "request body is empty"
		}
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	if err := in.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, calc.Calculate(in))
}

// spa serves files from dir and falls back to index.html for client routes.
func spa(dir string) http.Handler {
	files := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		p := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))
		if info, err := os.Stat(p); err != nil || info.IsDir() {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}
		files.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
