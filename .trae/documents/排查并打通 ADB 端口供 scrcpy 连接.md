## 问题判断
- emulator 的 `-ports <console>,<adb>`并不等于“对外开放一个可 `adb connect host:port` 的 TCP 端口”。它只是给 ADB server 用来识别 emulator 的本地端口对。
- scrcpy 默认通过 ADB 设备序列号工作；若用 `127.0.0.1:P` 连接，前提是宿主真的发布了该端口并且设备 adbd 处于 TCPIP 模式。

## 代码现状与要点
- 端口三元组计算：`web/pages/api/devices/[id]/start.js:67–84`。
- 端口注入到 emulator：`android-docker/common/tools/run-emulator-with-profile.sh:54–56`（需要设置 `EMU_CONSOLE_PORT/EMU_ADB_PORT`）。
- 已调整后端：无论是否传 `adb_port`，都固定注入 `EMU_*`（`web/pages/api/devices/[id]/start.js:125–136`），确保 emulator 采用确定端口。
- 日志位置：`/var/log/emuhub/d<DID>/emulator.log`（由 `android-docker/common/tools/start-device-session.sh:118–120` 启动写入）。

## 排查与修复步骤
1. 确认正确的 scrcpy 连接方式
- 使用序列号：`scrcpy -s emulator-<consolePort>`（例：ADB=5555 → console=5554 → `scrcpy -s emulator-5554`）。
- 或者使用 TCPIP：先 `adb -s emulator-5554 tcpip 5555`，再 `adb connect 127.0.0.1:5555`，最后 `scrcpy -s 127.0.0.1:5555`（仅当发布端口到宿主）。

2. 验证 emulator 已按预期使用固定端口
- 查看 `emulator.log` 是否包含 `-ports "<console>,<adb>"`（路径参考上文）。
- 容器内可用 `android-docker/common/tools/list-emulator-ports.sh` 列出当前端口并给出命令建议。

3. 检查宿主端口发布
- `docker run`：发布三元组端口（`-p P:P -p P+1:P+1 -p P+2:P+2`）。
- 多设备：发布区间（`-p 5555-5599:5555-5599 -p 5900-5999:5900-5999 -p 6080-6199:6080-6199`）。
- `docker-compose`：在 README 已给出 `ports` 区间示例。

4. 端到端验证
- 前端“Check ADB”（`web/pages/devices/[id].jsx:200–222`）应显示 `ADB Ready`（容器内检测）。
- 宿主执行：`adb devices` 应看到 `emulator-<consolePort>` 或 `<ip>:<P>`（若走 TCPIP）。
- 运行 `scrcpy` 成功投屏。

## 若仍不通的可能原因与处理
- 未发布宿主端口：补充 `-p` 或用 `--network=host`（Linux）。
- 防火墙阻断：放行 `P/P+1/P+2`。
- 设备未进入 TCPIP：仅当使用 `host:P` 连接时需要 `adb tcpip`。

## 交付
- 不修改额外代码；按以上步骤核查日志与运行方式；切换到推荐的 scrcpy 连接方法或确保宿主端口发布与 TCPIP 状态。