#!/usr/bin/env bash
set -euo pipefail

PROP_FILE=${1:?missing props file}
PROP_ARGS=()
while IFS='=' read -r k v; do
  [ -z "$k" ] && continue
  PROP_ARGS+=( -prop "${k}=${v}" )
done < "$PROP_FILE"
printf '%s\n' "${PROP_ARGS[@]}"
