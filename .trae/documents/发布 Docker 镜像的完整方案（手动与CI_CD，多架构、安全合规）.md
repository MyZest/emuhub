## 目标
- 不再从远程拉取基础镜像；改为使用你本地的 `android-docker` 源码构建。
- 在 android-docker 镜像内集成“全局伪装”能力：构建期生成机型属性，运行时按机型把属性以 `-prop key=value` 注入 Emulator，在创建 AVD 前生效。

## 变更范围
- 新增目录：`android-docker/common/spoof/`（机型配置与生成器）
  - `models.json`：机型 → 属性映射（品牌/型号/指纹/构建/补丁）
  - `gen_profiles.py`：生成每机型属性文件（shell友好），输出到 `/opt/spoof/profiles/<model>.props`
- 新增脚本：`android-docker/android34/tools/run-emulator-with-profile.sh`
  - 读取 `SPOOF_PROFILE`（默认 `pixel_8_pro`）
  - 从 `/opt/spoof/profiles/<model>.props` 拼接 `-prop key=value` 参数
  - 启动 Emulator，建议参数：`-gpu swiftshader_indirect -no-accel -no-snapshot`（macOS 容器兼容）
  - 如 AVD 未创建，自动用 SDK 的 x86_64 system image 创建最小 AVD
  - 可选：注入 ABI/Native-Bridge 最小必要集（作为属性开关注入）
- 修改 Dockerfile（以 `android-docker/android34/Dockerfile` 为例）
  - `COPY common/spoof /opt/spoof`
  - `RUN python3 /opt/spoof/gen_profiles.py` 生成 `/opt/spoof/profiles/*.props`
  - 保留现有 entrypoint 与 SDK安装逻辑；默认 CMD 不变（兼容现有用法）

## 兼容与边界
- 指纹类 `ro.*` 属性在部分版本不可运行时覆盖；方案仍以 `-prop` 力求早期注入，若遇不可覆盖场景，可降级仅注入品牌/型号与 ABI/zygote 属性。
- 不改 `ro.board.platform`，避免 HAL 选择与 Emulator 后端冲突。
- 容器内无 KVM，加 `-gpu swiftshader_indirect -no-accel` 保证可运行。

## 使用流程（本地构建与运行）
- 构建基础镜像（免远程）：
  - `docker build --platform linux/amd64 -t emuhub-android34:local ./android-docker/android34`
- 运行并按机型伪装：
  - `docker run --platform linux/amd64 -it --rm -e SPOOF_PROFILE=pixel_8_pro emuhub-android34:local /opt/tools/run-emulator-with-profile.sh`
- 访问/验证（按你现有 noVNC/VNC 集成方式；若无，可先 `-no-window` 验证属性）：
  - `adb connect <容器地址>:5555` 后 `adb shell getprop ro.build.fingerprint` 等

## 拓展
- 将上述更改同步到其他版本目录（`android28`…`android34`）以覆盖多 API 级别
- 日后可在 `models.json` 补充你们自有机型，生成器无需修改

## 交付内容
- 新增 `common/spoof` 与生成器脚本
- 新增运行器脚本 `run-emulator-with-profile.sh`
- 修改 Dockerfile 完成拷贝与生成
- 使用说明（README 片段）与常见问题（M2 构建/运行、端口映射）