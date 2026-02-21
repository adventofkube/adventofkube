package main

import (
	"context"
	"fmt"
	"os"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	config, err := rest.InClusterConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Not running in cluster: %v\n", err)
		os.Exit(1)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Failed to create client: %v\n", err)
		os.Exit(1)
	}

	namespace := os.Getenv("POD_NAMESPACE")
	if namespace == "" {
		namespace = "day09"
	}

	// Retry loop — RBAC might not be ready yet
	for i := 0; i < 5; i++ {
		secrets, err := clientset.CoreV1().Secrets(namespace).List(
			context.TODO(),
			metav1.ListOptions{},
		)
		if err != nil {
			fmt.Fprintf(os.Stderr, "ERROR: Cannot list secrets: %v\n", err)
			fmt.Fprintln(os.Stderr, "Hint: check the Role permissions for this ServiceAccount")
			time.Sleep(5 * time.Second)
			continue
		}

		for _, s := range secrets.Items {
			if s.Name == "flag-secret" {
				fmt.Println(flag)
				return
			}
		}
		fmt.Fprintln(os.Stderr, "ERROR: flag-secret not found")
		time.Sleep(5 * time.Second)
	}

	fmt.Fprintln(os.Stderr, "FAILED: Could not access secrets after retries")
	os.Exit(1)
}
