#!/usr/bin/env bash
# Generates flag.go files from FLAG_VALUES JSON secret.
# Usage: FLAG_VALUES='{"day01":"AOK{...}"}' ./scripts/gen-flags.sh
set -euo pipefail

if [ -z "${FLAG_VALUES:-}" ]; then
  echo "ERROR: FLAG_VALUES environment variable not set" >&2
  exit 1
fi

echo "$FLAG_VALUES" | jq -r 'to_entries[] | "\(.key) \(.value)"' | while read -r day flagval; do
  dir="images/$day"
  if [ -d "$dir" ]; then
    cat > "$dir/flag.go" <<GOEOF
package main

const flag = "$flagval"
GOEOF
    echo "Generated $dir/flag.go"
  fi
done
