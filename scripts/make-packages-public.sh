#!/bin/bash
# Make all GHCR packages public for the adventofkube org
# Requires: gh CLI authenticated with appropriate permissions

set -e

ORG="adventofkube"

# Container images
IMAGES=(day00 day01 day02 day03 day04 day05 day06)

# Helm charts (stored under charts/ path)
CHARTS=(day00 day01 day02 day03 day04 day05 day06)

echo "Making container images public..."
for img in "${IMAGES[@]}"; do
  if gh api -X PATCH "/orgs/$ORG/packages/container/$img/visibility" -f visibility=public 2>/dev/null; then
    echo "  ✓ $img"
  else
    echo "  - $img (not found or already public)"
  fi
done

echo ""
echo "Making Helm charts public..."
for chart in "${CHARTS[@]}"; do
  # Charts are stored as charts/dayXX, URL-encoded as charts%2FdayXX
  encoded="charts%2F$chart"
  if gh api -X PATCH "/orgs/$ORG/packages/container/$encoded/visibility" -f visibility=public 2>/dev/null; then
    echo "  ✓ charts/$chart"
  else
    echo "  - charts/$chart (not found or already public)"
  fi
done

echo ""
echo "Done."
