package main

import (
	"fmt"
	"os"
)

func main() {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		fmt.Fprintln(os.Stderr, "ERROR: API_KEY environment variable is required")
		os.Exit(1)
	}

	if apiKey != "supersecret123" {
		fmt.Fprintln(os.Stderr, "ERROR: Invalid API_KEY value")
		os.Exit(1)
	}

	fmt.Println(flag)
}
