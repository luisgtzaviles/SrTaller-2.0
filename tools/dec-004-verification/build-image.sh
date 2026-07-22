#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly IMAGE_TAG="${1:-srtaller-dec004-preliminary:056e8695}"

docker build \
  --platform linux/amd64 \
  --pull=false \
  --tag "${IMAGE_TAG}" \
  "${SCRIPT_DIR}"

docker image inspect --format \
  'image_id={{.Id}} architecture={{.Architecture}} os={{.Os}}' \
  "${IMAGE_TAG}"
