#!/usr/bin/env bash
set -euo pipefail

SYSTEM_IMG="${1:-}"
RAMDISK_IMG="${2:-}"
KERNEL_IMG="${3:-}"
AVD_NAME="${4:-}"

if [ -z "$SYSTEM_IMG" ] || [ -z "$RAMDISK_IMG" ] || [ -z "$KERNEL_IMG" ]; then
  echo "usage: $0 <system.img> <ramdisk.img> <kernel> [avd_name]" >&2
  exit 1
fi

if [ -z "${EMULATOR_BIN:-}" ]; then
  EMULATOR_BIN="$HOME/Library/Android/sdk/emulator/emulator"
fi

CMD=("$EMULATOR_BIN" -system "$SYSTEM_IMG" -ramdisk "$RAMDISK_IMG" -kernel "$KERNEL_IMG" -wipe-data)
if [ -n "$AVD_NAME" ]; then
  CMD+=( -avd "$AVD_NAME" )
fi

exec "${CMD[@]}"

