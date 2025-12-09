#!/usr/bin/env bash
set -euo pipefail

cmds=$(pgrep -a emulator || true)
if [ -z "$cmds" ]; then
  echo "no emulator processes found"
  exit 0
fi

idx=0
while IFS= read -r line; do
  ports_arg=$(echo "$line" | sed -n 's/.*-ports \([0-9]\{4,\}\),\([0-9]\{4,\}\).*/\1,\2/p')
  if [ -z "$ports_arg" ]; then
    continue
  fi
  console_port=$(echo "$ports_arg" | cut -d, -f1)
  adb_port=$(echo "$ports_arg" | cut -d, -f2)
  vnc_port=$((adb_port+1))
  ws_port=$((adb_port+2))
  idx=$((idx+1))
  echo "# emulator[$idx]"
  echo "console: $console_port"
  echo "adb:     $adb_port"
  echo "vnc:     $vnc_port"
  echo "ws:      $ws_port"
  echo "connect: adb connect 127.0.0.1:$adb_port"
  echo "scrcpy:  scrcpy -s 127.0.0.1:$adb_port"
  echo
done <<< "$cmds"

