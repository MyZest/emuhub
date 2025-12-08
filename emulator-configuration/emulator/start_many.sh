#!/bin/bash
BASE_NAME=$1
COUNT=$2
DEVICE_ID=$3
SKIN_NAME=$4
if [ -z "$BASE_NAME" ] || [ -z "$COUNT" ] || [ -z "$DEVICE_ID" ] || [ -z "$SKIN_NAME" ]; then
  echo "用法: start_many.sh <base_name> <count> <device_id> <skin_name>" >&2
  exit 1
fi
for i in $(seq 1 $COUNT); do
  NAME="${BASE_NAME}-${i}"
  /home/emuhub/emulator/mobile_emu.sh "$NAME" "$DEVICE_ID" "$SKIN_NAME"
done
