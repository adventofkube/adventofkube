package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Check if there are >=2 ready endpoints (meaning HPA scaled us)
		config, err := rest.InClusterConfig()
		if err != nil {
			fmt.Fprintln(w, "Not running in cluster — can't check replicas")
			return
		}
		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			fmt.Fprintln(w, "Failed to create client")
			return
		}
		namespace := os.Getenv("POD_NAMESPACE")
		if namespace == "" {
			namespace = "day20"
		}
		endpoints, err := clientset.CoreV1().Endpoints(namespace).Get(
			context.TODO(), "scale-app", metav1.GetOptions{},
		)
		if err != nil {
			fmt.Fprintf(w, "Can't check endpoints: %v\n", err)
			return
		}
		readyCount := 0
		for _, subset := range endpoints.Subsets {
			readyCount += len(subset.Addresses)
		}
		if readyCount >= 2 {
			fmt.Fprintln(w, flag)
		} else {
			fmt.Fprintf(w, "Only %d replica(s) ready. HPA needs to scale to >=2 for the flag.\n", readyCount)
		}
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	// Generate CPU load to trigger HPA (once resource requests are added)
	go func() {
		for {
			start := time.Now()
			for time.Since(start) < 100*time.Millisecond {
				_ = start.String()
			}
			time.Sleep(100 * time.Millisecond)
		}
	}()

	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
