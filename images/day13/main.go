package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	flagGauge := prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "flag_value",
		Help: flag,
	})
	prometheus.MustRegister(flagGauge)
	flagGauge.Set(1)

	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Check /metrics for the flag (look at the HELP text of flag_value)")
	})

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
