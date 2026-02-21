package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Alert app is running. Fix the AlertManager routing to trigger /flag")
	})

	http.HandleFunc("/flag", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, flag)
		log.Println("Flag endpoint hit — alert routing is working!")
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
