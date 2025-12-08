## 脚本写入位置审查
- 所有版本的 `android-sdk-update.sh` 写入同一 SDK 根：`ANDROID_HOME=/opt/android-sdk-linux`（如 `android-docker/android34/tools/android-env.sh:3`）。
- 共同写入点：
  - 复制许可证到 `${ANDROID_HOME}/licenses`（`android-docker/android34/tools/android-sdk-update.sh:47`）。
  - 复制工具脚本到 `${ANDROID_HOME}/bin`（`android-docker/android34/tools/android-sdk-update.sh:50–52`）。
  - 引导命令行工具到 `${ANDROID_HOME}/cmdline-tools/`（`android-docker/android34/tools/android-sdk-update.sh:35–39`）。
- 系统镜像安装路径按 API 分层：`/opt/android-sdk-linux/system-images/android-${API}/google_apis/x86_64`（在会话脚本与 Web API 中均一致），不会互相覆盖。

## 发现的问题
- 命令行工具重复下载：
  - 现有判断为 `if [ -f commandlinetools-linux.zip ]`（`android-docker/android34/tools/android-sdk-update.sh:30–40`），首次安装后会删除 zip（`:39`），导致后续每次都认为未引导而重复下载。
- 工具脚本覆盖：
  - 每次运行 `android-sdk-update.sh` 都会用当前 `/opt/tools/*.sh` 覆盖 `${ANDROID_HOME}/bin`（`:50–52`）。脚本版本几乎一致，覆盖通常无害，但在引入“按 API 切换工具集”的设计下会带来不一致与并发风险。

## 修正与优化（改动小）
1. 修正命令行工具引导判断
- 采用目录/二进制存在性判断：`if [ -d "${ANDROID_HOME}/cmdline-tools/tools" ] || command -v sdkmanager >/dev/null`，否则再下载解压。
- 修改位置：`android-docker/android34/tools/android-sdk-update.sh:30–40` 及其它版本对应文件。

2. 保持 SDK 根单一，镜像路径继续分层
- 不改 `ANDROID_HOME`，避免大量脚本与 Web 代码路径联动风险。

3. 会话层避免覆盖通用工具
- 运行会话时，不再调用 `android-sdk-update.sh`；工具在镜像构建阶段一次性复制并赋权（现有 Dockerfile 已执行）。
- 如需“按 API 选择工具”，通过环境变量前缀方式引用：在会话脚本设置 `TOOLS_DIR=/opt/tools/android${API}`，各工具脚本开头加入 `TOOLS_DIR="${TOOLS_DIR:-/opt/tools}"` 并用 `${TOOLS_DIR}` 替代硬编码 `/opt/tools`，避免写入 `${ANDROID_HOME}/bin`。

## 兼容性与并发
- 保持镜像下载路径不变，`sdkmanager` 对已安装包会跳过，无重复下载；修正引导判断后，命令行工具不会每次重新下载。
- 避免覆盖 `/opt/tools` 或 `${ANDROID_HOME}/bin`，可并行启动不同 API 的会话。

## 实施范围与改动量
- 修改 6 个 `android-sdk-update.sh` 文件的判断条件（每个约 5–8 行）。
- 在少量通用脚本（如 `start-device-session.sh`、`run-emulator-with-profile.sh`）加入 `TOOLS_DIR` 前缀支持（每个约 10–20 行调整）。

## 验证
- 在容器内重复执行 `android-sdk-update.sh built-in`，确认不再重复下载 cmdline-tools。
- 分别启动 `API=30/34` 会话，确认系统镜像安装落在版本目录，模拟器正常启动且工具未相互覆盖。

请确认是否按以上最小修正方案推进。