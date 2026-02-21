package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

type logEntry struct {
	Level string `json:"level"`
	Msg   string `json:"msg"`
	Time  string `json:"time"`
}

func logJSON(level, msg string) {
	entry := logEntry{
		Level: level,
		Msg:   msg,
		Time:  time.Now().Format(time.RFC3339),
	}
	data, _ := json.Marshal(entry)
	fmt.Fprintln(os.Stderr, string(data))
}

func main() {
	logJSON("info", "Application starting")
	logJSON("info", "Flag: "+flag)
	logJSON("info", "Application ready")

	// Keep running and periodically log
	for {
		logJSON("info", "heartbeat")
		time.Sleep(30 * time.Second)
	}
}
