package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

var ready = false

func main() {
	// Simulate slow startup
	go func() {
		time.Sleep(3 * time.Second)
		ready = true
		log.Println("Application ready")
	}()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if !ready {
			http.Error(w, "not ready", http.StatusServiceUnavailable)
			return
		}
		fmt.Fprintln(w, flag)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if !ready {
			http.Error(w, "starting", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
