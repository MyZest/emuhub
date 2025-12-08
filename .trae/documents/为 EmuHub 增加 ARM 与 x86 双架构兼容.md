## 现状与问题
- 主机为 `aarch64`（ARM64），而当前容器与脚本仅使用 `x86/x86_64` 系统镜像，导致“架构不兼容”。
- 代码中明确硬编码了 x86 系统镜像：
  - `Dockerfile:88-89` 安装 `android-34;google-tv;x86` 与 `android-33;android-wear;x86_64`。
  - `emulator-configuration/emulator/mobile_emu.sh:12` 使用 `google_apis;x86_64`；`wear_emu.sh:12` 使用 `android-wear;x86_64`；`tv_emu.sh:12` 使用 `google-tv;x86`。
- 运行依赖 `/dev/kvm` 与 `-gpu host`（如 `start-vnc.sh:20`、各 `*_emu.sh` 启动参数），在 ARM 主机上若继续跑 x86 模拟器则需要嵌套虚拟化/仿真，现实中不可行或极慢。

## 兼容性策略（总体思路）
- 构建并发布“多架构镜像”（`linux/amd64` 与 `linux/arm64`），镜像内同时准备所需工具链。
- 在运行时按主机架构自动选择“对应体系的 Android 系统镜像”：
  - `amd64` 主机：继续用 `x86/x86_64` 系统镜像，利用 KVM 加速。
  - `arm64` 主机：改用 `arm64-v8a` 系统镜像（手机/平板可用）。
- 对于 Wear/TV：若官方未提供 `arm64-v8a` 系统镜像，则在 ARM 主机上暂不支持这些目标（或提供低速仿真降级开关，不默认开启）。

## 具体改动
- Docker 构建
  - 若基础镜像 `mohamedhelmy/android-docker:34` 不具备多架构清单，则改为多架构基础（如 `ubuntu:22.04`/`debian:bookworm-slim`）重建 SDK 环境，并发布多架构镜像清单（见 CI 部分）。
  - 在 `Dockerfile` 中安装手机用 `arm64-v8a` 系统镜像：如 `system-images;android-34;google_apis;arm64-v8a`。同时保留现有 `x86/x86_64` 安装，以便 `amd64` 主机使用。
  - 保持 `/dev/kvm`、VNC/noVNC、XRDP 配置不变。
- 运行脚本（自动选择架构）
  - 修改 `mobile_emu.sh`、`tv_emu.sh`、`wear_emu.sh`：
    - 通过 `uname -m` 或 `getconf LONG_BIT` 判断架构，设置 `PACKAGE`：
      - `amd64`→`x86_64` 或 `x86`
      - `arm64`→`arm64-v8a`（仅手机有保障）
    - 当 ARM 主机上不可用 `-gpu host` 时，自动降级到 `-gpu swiftshader_indirect`；无 `/dev/kvm` 则提示并可选择退出或降级（不默认模拟 x86）。
  - 手机脚本优先支持 ARM；Wear/TV 在 ARM 上检测到无 `arm64-v8a` 则给出清晰提示。
- Compose 运行
  - 保持 `privileged: true`，并显式映射 `devices: - /dev/kvm:/dev/kvm`（两架构通用）。
  - 文档中补充 ARM 主机的 KVM 校验：`lsmod | grep kvm`、`test -e /dev/kvm`、用户组 `kvm`。
- CI/CD（发布多架构清单）
  - 修改 `.github/workflows/docker-image.yml`：在 `docker/build-push-action` 增加 `platforms: linux/amd64,linux/arm64`，以 `buildx` 推送多架构 manifest。
  - 如基础镜像不多架构，先验证并必要时替换为多架构基础镜像。

## 验证与演示
- 在 `amd64` 主机：
  - 启动容器后，创建并启动 `x86_64` AVD；`adb devices` 可见；冷/热启动稳定。
- 在 `arm64` 主机：
  - 启动容器后，创建并启动 `arm64-v8a` AVD；`adb devices` 可见；确认 `/dev/kvm` 存在且加速启用，若无则自动使用软件渲染与非加速（性能较低）。
- 提供一个简单脚本同时启动 N 个 AVD 并批量 `adb install`，用于并发验证。

## 注意事项与边界
- 官方 Android 系统镜像的可用性以 SDK 发布为准：
  - 手机/平板通常提供 `arm64-v8a`；Wear/TV 的 `arm64-v8a` 可能缺失。
- 在 ARM 主机上“强行运行 x86 模拟器”不可取：`--platform linux/amd64`+QEMU 不能提供 KVM，性能与兼容性极差。
- 容器内 GPU 直通与 `-gpu host` 在不同主机/驱动环境差异大；必要时使用 SwiftShader 作为保底渲染。
- 并发数量取决于主机 CPU/内存与 `/dev/kvm` 可用性；文档中将给出建议配额与参数。