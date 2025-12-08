## 方案摘要
- 在会话脚本运行前，将 `android-docker/android{API}/tools` 复制到版本化目录：`/opt/android-sdk-linux/tools/android-{API}/`。
- 脚本执行统一从该版本化目录调用对应工具（如 `run-emulator-with-profile.sh`、`android-wait-for-emulator.sh`）。
- 保持现有日志路径 `/var/log/emuhub/d${DID}` 不变，避免前端改动；如需在 SDK 目录区分执行位置，可在 `android-{API}` 目录下创建 `work` 子目录并作为脚本工作目录（日志仍写入 `/var/log/emuhub`）。

## 具体改动（最小改动）
- 修改 `android-docker/common/tools/start-device-session.sh`：
  1. 解析源工具目录：优先 `ANDROID_DOCKER_DIR/android{API}/tools`，否则 `/opt/app/android-docker/android{API}/tools`。
  2. 目标版本目录：`API_DIR=/opt/android-sdk-linux/tools/android-{API}`，不存在则创建。
  3. 将源工具复制到 `API_DIR`（`cp -a`），并对 `*.sh` 赋可执行权限。
  4. 设定 `TOOLS_BASE=$API_DIR`，后续调用改为：
     - `nohup "$TOOLS_BASE/run-emulator-with-profile.sh" ...`
     - `nohup "$TOOLS_BASE/android-wait-for-emulator.sh" ...`（仅在 `WAIT_READY=true` 时）
  5. 将“准备 tools”的信息写入 `session.log`，便于前端刷新查看。
- 保持 Xvfb/x11vnc/websockify 启动与端口选择逻辑不变。

## 可选增强（不影响前端）
- 在 `API_DIR` 下创建 `work` 子目录，并将相关临时文件（如 `PASSWD_FILE`）放入该目录，实现“脚本所执行保存的位置”在 SDK 树中区分；日志仍写 `/var/log/emuhub/d${DID}`。
- 若您希望日志也按 API 归档，可在 `API_DIR/logs` 建立到 `/var/log/emuhub/d${DID}` 的符号链接，无需前端修改。

## 改动量评估
- 涉及单个脚本 `start-device-session.sh` 的若干行增量（路径解析、复制、赋权、调用路径替换），对其他脚本与前端无破坏性影响。
- 不需要修改 Dockerfile 和前端日志读取接口（已保持日志路径稳定）。
- 整体改动量小，风险低，可快速实施与验证。