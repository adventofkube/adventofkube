package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	appKey := os.Getenv("APP_KEY")
	if appKey == "" {
		fmt.Fprintln(os.Stderr, "ERROR: APP_KEY environment variable is required")
		os.Exit(1)
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "AOK{d3ploy_and_d3bug}")
	})

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("App is ready! Flag: AOK{d3ploy_and_d3bug}")
	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
