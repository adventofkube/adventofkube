package main

import (
	"fmt"
	"os"
)

func main() {
	// Verify the volume is mounted and readable
	data, err := os.ReadFile("/data/flag.txt")
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: Cannot read /data/flag.txt: %v\n", err)
		fmt.Fprintln(os.Stderr, "Hint: check if the PVC is bound and the volume is mounted")
		os.Exit(1)
	}

	if len(data) == 0 {
		fmt.Fprintln(os.Stderr, "ERROR: /data/flag.txt is empty")
		os.Exit(1)
	}

	// Volume works — print the real flag
	fmt.Println(flag)
}
