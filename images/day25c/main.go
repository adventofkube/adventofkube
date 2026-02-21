package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	configMapName := os.Getenv("CONFIG_MAP")
	namespace := os.Getenv("NAMESPACE")
	if configMapName == "" {
		configMapName = "app-config"
	}
	if namespace == "" {
		namespace = "finale-c"
	}

	// Verify required ConfigMap exists — exit if not found
	config, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("ERROR: not in cluster: %v", err)
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("ERROR: client failed: %v", err)
	}

	_, err = clientset.CoreV1().ConfigMaps(namespace).Get(
		context.TODO(), configMapName, metav1.GetOptions{},
	)
	if err != nil {
		log.Fatalf("ERROR: required ConfigMap '%s' not found: %v\nHint: the app needs this ConfigMap to start", configMapName, err)
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, flag)
	})

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("fragment-c starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
