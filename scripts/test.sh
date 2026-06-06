#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "» Server tests"
(cd "$ROOT/server" && npm test)

echo "» Client tests"
(cd "$ROOT/client" && npm test)
