package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println(flag)
	// Keep running so the pod stays alive and logs are available
	for {
		time.Sleep(time.Hour)
	}
}
