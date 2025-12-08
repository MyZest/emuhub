## 根因分析
- shell 将分号当作命令分隔符：当前在 `web/pages/api/devices/[id]/start.js:25-29` 里使用 `shell: true` 的 execa 模式，导致参数 `system-images;android-30;google_apis;x86_64` 被拆成多条命令，从而出现 `/bin/sh: 1: android-30: not found`、`google_apis: not found`，以及 `Warning: Failed to find package system-images`。
- 脚本对 API 版本写死：`/opt/tools/run-emulator-with-profile.sh` 实际来源是 `android-docker/android34/tools/run-emulator-with-profile.sh:13`，其中 `SYS_IMG` 被固定为 `android-34`，与接口传入的 API（30/32/34）不一致，创建 AVD 时会选错系统镜像。

## 具体修改
1. 修复 sdkmanager 调用的分号问题（避免 shell 拆分）
- 改为非 shell 模式或显式参数数组，确保分号作为普通字符传递：
  - 在 `web/pages/api/devices/[id]/start.js:25` 将 `shell: true` 改为 `shell: false`；或更推荐在安装处直接使用函数式调用：
  - 替换 `web/pages/api/devices/[id]/start.js:29` 为：
    - 使用 execa 参数数组：`$('/opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager', [sysImg(api)], { stdio: 'inherit' })`
    - 备选：保留 shell 时，将包名整体用引号包裹：`sdkmanager "${sysImg(api)}"`

2. 兼容许可证自动接受（避免交互阻塞）
- 使用已有的 `android-accept-licenses.sh` 包装 sdkmanager 安装，保持非交互：
  - 在 `web/pages/api/devices/[id]/start.js` 将安装命令改为调用包装脚本：
  - 例如：`$('/opt/android-sdk-linux/bin/android-accept-licenses.sh', [
    `sdkmanager ${sysImg(api)}`
  ], { stdio: 'inherit' })`

3. 让 AVD 创建脚本尊重 API/SYS_IMG 环境变量
- 修改 `android-docker/android34/tools/run-emulator-with-profile.sh:13`：
  - 原：`SYS_IMG="system-images;android-34;google_apis;x86_64"`
  - 新：`SYS_IMG="${SYS_IMG:-system-images;android-${API:-34};google_apis;x86_64}"`
- 这样当接口通过 env 传入 `API` 或 `SYS_IMG` 时，脚本会选用正确的系统镜像；否则仍默认 34。

## 验证思路
- 接口传入 `api=30/32/34`，应无 `android-30/google_apis not found` 报错；
- 观察日志：`sdkmanager` 安装应成功，且不会提示交互式许可证；
- 首次为某 API 运行时，脚本会创建 `AVD_NAME`（由 `web/pages/api/devices/[id]/start.js:36`），其镜像版本与传入 API 匹配；
- 成功返回 `200` 并带有 `vnc`/`ws` 端口。

## 影响范围与兼容
- 更改仅涉及命令调用方式与 AVD 选择逻辑，不影响已有 34 的行为；
- 若后续扩展更多 API，接口只需将 `allowedApis` 增加即可，脚本无需变更。

请确认以上方案，我将按上述文件位置进行最小化修改并提交修复。