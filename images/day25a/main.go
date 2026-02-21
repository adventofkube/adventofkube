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
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		secretName := os.Getenv("SECRET_NAME")
		namespace := os.Getenv("NAMESPACE")
		if secretName == "" {
			secretName = "part-a"
		}
		if namespace == "" {
			namespace = "finale-a"
		}

		config, err := rest.InClusterConfig()
		if err != nil {
			fmt.Fprintf(w, "ERROR: not in cluster: %v\n", err)
			return
		}
		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			fmt.Fprintf(w, "ERROR: client failed: %v\n", err)
			return
		}

		// Uses Get (requires "get" verb)
		secret, err := clientset.CoreV1().Secrets(namespace).Get(
			context.TODO(), secretName, metav1.GetOptions{},
		)
		if err != nil {
			fmt.Fprintf(w, "ERROR: cannot get secret '%s': %v\n", secretName, err)
			fmt.Fprintln(w, "Hint: check the RBAC Role verbs for this ServiceAccount")
			return
		}

		_ = secret // Verified access works
		fmt.Fprintln(w, flag)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})

	log.Println("fragment-a starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
