## 目标
- 让“任意启动的安卓虚拟设备”都有一个稳定且可预测的宿主机 ADB 端口，供 `scrcpy` 直接使用。
- 端口三元组约定：`ADB=P`、`VNC=P+1`、`WS=P+2`，统一冲突检查与分配。
- 保证端到端可用：容器内 emulator 固定端口；宿主机端口映射；`adb connect` 与 `scrcpy -s` 均成功。

## 现状洞察
- 端口分配入口（后端）：`web/pages/api/devices/[id]/start.js:67–84, 133–136`，支持传入 `adb_port`，并注入 `EMU_ADB_PORT/EMU_CONSOLE_PORT` 环境变量，前端展示三元组。
- emulator 启动固定端口：`android-docker/common/tools/run-emulator-with-profile.sh:54–56` 使用 `-ports "<console>,<adb>"` 锁定 `adbd` 与 console 端口。
- 端口占用检测：`web/pages/api/ports/check.js:27–50`，按三元组一次性验证。
- 会话脚本：`android-docker/common/tools/start-device-session.sh:118–120` 以固定 AVD 名称启动 emulator；VNC/WS 已按端口就绪。
- Docker 暴露：`Dockerfile:91` `EXPOSE 6080 5901 5555`（需运行时显式 `-p` 才能宿主可见）。

## 基本方案（无需改造即可使用）
- 启动设备时指定 ADB 基础端口 `P`：前端已支持，默认 5555（`web/pages/devices/[id].jsx:182–195`）。
- 后端将 `P` 注入 emulator：`EMU_ADB_PORT=P`、`EMU_CONSOLE_PORT=P-1`，emulator 以 `-ports` 固定监听。
- 宿主机端口映射：运行容器时为每个设备映射三元组，例如：
  - 单设备：`docker run ... -p 5555:5555 -p 5901:5901 -p 6081:6081`（参见 `android-docker/README.md:11`）。
  - 多设备：预留区间，如 `-p 5555-5599:5555-5599 -p 5900-5999:5900-5999 -p 6080-6199:6080-6199`，并用 `ports/check` 选择空闲三元组。
- 连接与使用：
  - `adb connect 127.0.0.1:P`
  - `scrcpy -s 127.0.0.1:P`

## 小幅改进（增强稳健性与易用性）
1. 后端健壮化：即使未传 `adb_port`，也用计算出的 `adb`（`vnc-1`）填充 `EMU_*`，避免 emulator 回落到默认 `5554/5556` 导致冲突。（改动点：`web/pages/api/devices/[id]/start.js` 132–136 邻近）
2. 运行手册补充：在 README 增加“多设备端口区间映射”示例与 `scrcpy` 用法片段。
3. 辅助脚本：新增一个只读查询脚本输出当前会话的三元组与连接提示，例如：
   - `adb connect 127.0.0.1:<P>; scrcpy -s 127.0.0.1:<P>`
4. docker-compose 场景：提供 `ports` 区间映射示例或建议 `--network=host`（Linux）以省去逐端口发布。

## 兼容场景
- 原生 AVD（非容器）：`scrcpy -s emulator-5554` 直接使用序列号，无需 TCP 映射。
- Genymotion/Android-x86/Waydroid：设备内执行 `adb tcpip 5555` 并确保宿主到设备网络可达，随后 `adb connect <ip>:5555; scrcpy -s <ip>:5555`。

## 风险与处理
- 端口冲突：已通过 `ports/check` 检测（`web/pages/api/ports/check.js:33–49`）；如冲突，前端提示更换端口。
- 宿主端未映射：确保 `docker run` 或 compose 发布 `P`；否则 `adb connect` 仅容器内可用。
- 防火墙与 NAT：本机防火墙需允许 `P/P+1/P+2`；跨主机需路由与安全策略放通。

## 验证步骤
- 启动设备（指定 `P`），前端“Check ADB”显示已开启（`web/pages/devices/[id].jsx:200–222`）。
- 宿主执行：`adb connect 127.0.0.1:P` → `adb devices` 显示 `<ip>:<P>`；随后 `scrcpy -s 127.0.0.1:P` 成功投屏。
- 多设备并发：用不同 `P` 启动两个会话，分别连接与 `scrcpy`，互不干扰。

## 交付项
- 保持现有“指定端口即用”的流程，补充运行文档与示例命令。
- 可选小改：后端默认也写入 `EMU_*`，提升未指定端口时的确定性。
- 提供一个查询脚本，便于快速拿到 `adb/vnc/ws` 三元组并生成连接命令。