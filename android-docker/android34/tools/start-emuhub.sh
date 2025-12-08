#!/usr/bin/env bash
set -euo pipefail

export DISPLAY=${DISPLAY:-:0}

Xvfb "$DISPLAY" -screen 0 1280x800x24 &
sleep 1

fluxbox &
sleep 1

x11vnc -display "$DISPLAY" -forever -rfbport 5901 -shared -nopw &
sleep 1

websockify 6080 localhost:5901 &
sleep 1

"/opt/tools/run-emulator-with-profile.sh"

