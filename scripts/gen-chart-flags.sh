#!/usr/bin/env bash
# Replaces __FLAG__ placeholders in chart values.yaml with real flag values.
# Usage: CHART_FLAG_VALUES='{"day02":"AOK{...}","day14":"AOK{...}"}' ./scripts/gen-chart-flags.sh
set -euo pipefail

if [ -z "${CHART_FLAG_VALUES:-}" ]; then
  echo "ERROR: CHART_FLAG_VALUES environment variable not set" >&2
  exit 1
fi

echo "$CHART_FLAG_VALUES" | jq -r 'to_entries[] | "\(.key) \(.value)"' | while read -r day flagval; do
  valuesfile="charts/$day/values.yaml"
  if [ -f "$valuesfile" ]; then
    sed -i "s|__FLAG__|$flagval|g" "$valuesfile"
    echo "Injected flag into $valuesfile"
  fi
done
