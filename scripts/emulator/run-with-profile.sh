#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-}"
if [ -z "$PROFILE" ]; then
  echo "usage: $0 <profile> [avd_name]" >&2
  exit 1
fi

AVD_NAME="${2:-}"

IMG_DIR="images/$PROFILE"
SYSTEM_IMG="$IMG_DIR/system.img"
RAMDISK_IMG="$IMG_DIR/ramdisk.img"
KERNEL_IMG="${KERNEL_IMG:-$HOME/Library/Android/sdk/emulator/lib/kernelemu/kernel-qemu2}"

if [ ! -f "$SYSTEM_IMG" ] || [ ! -f "$RAMDISK_IMG" ]; then
  echo "images for profile '$PROFILE' not found under $IMG_DIR" >&2
  echo "please build with: SPOOF_PROFILE=$PROFILE lunch aosp_emuhub-userdebug && m -j" >&2
  exit 2
fi

"$(dirname "$0")/run-with-custom-images.sh" "$SYSTEM_IMG" "$RAMDISK_IMG" "$KERNEL_IMG" "${AVD_NAME:-}"

