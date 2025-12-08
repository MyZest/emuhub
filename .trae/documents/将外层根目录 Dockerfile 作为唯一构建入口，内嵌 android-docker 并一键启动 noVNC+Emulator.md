## 目标
- 把“最终可运行镜像”的构建入口移到项目根目录的 Dockerfile（外层为主）
- 外层 Dockerfile 直接内嵌 android-docker/android34 的全部内容（SDK、系统镜像、伪装生成器、启动脚本），用户只构建/拉取 emuhub 镜像即可

## 目录与文件
- 根目录：新增/更新 Dockerfile（唯一入口）
- 复用现有内容：
  - `android-docker/android34/tools/entrypoint.sh`
  - `android-docker/android34/tools/run-emulator-with-profile.sh`
  - `android-docker/android34/tools/start-emuhub.sh`
  - `android-docker/android34/licenses/*`
  - `android-docker/android34/tools/android-env.sh`、`android-sdk-update.sh` 等
  - `android-docker/common/spoof/models.json` 与 `gen_profiles.py`

## 根 Dockerfile 设计（Ubuntu 20.04）
- 基础：`FROM ubuntu:20.04`
- 安装依赖：
  - `dpkg --add-architecture i386`
  - `apt-get install -y curl expect git libc6:i386 libgcc1:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386 openjdk-17-jdk wget unzip vim xvfb fluxbox x11vnc novnc python3-websockify`
- 环境变量：同 android34 镜像（`ANDROID_HOME`、`ANDROID_SDK_ROOT`、`PATH` 增加 cmdline-tools/build-tools/platform-tools/emulator）
- 复制资源：
  - `COPY android-docker/android34/tools /opt/tools`
  - `COPY android-docker/android34/licenses /opt/licenses`
  - `COPY android-docker/common/spoof /opt/spoof`
- 初始化与安装：
  - `WORKDIR /opt/android-sdk-linux`
  - `RUN /opt/tools/entrypoint.sh built-in`
  - `RUN /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "cmdline-tools;latest" && ... && "system-images;android-34;google_apis;x86_64"`
  - `RUN python3 /opt/spoof/gen_profiles.py`（生成 `/opt/spoof/profiles/*.props`）
- 端口与入口：
  - `EXPOSE 6080 5901 5555`
  - `ENV SPOOF_PROFILE=pixel_8_pro`
  - `CMD ["/opt/tools/start-emuhub.sh"]`

## 运行流程
- 构建（M2 上仿真 amd64）：`docker build --platform linux/amd64 -t emuhub:0.1.0 .`
- 运行：`docker run --platform linux/amd64 -it --rm -p 6080:6080 -p 5901:5901 -p 5555:5555 -e SPOOF_PROFILE=pixel_8_pro --name emuhub emuhub:0.1.0`
- 访问：`http://localhost:6080`（noVNC），或 `localhost:5901`（VNC）；ADB：`adb connect localhost:5555`

## 兼容说明
- macOS 不支持 KVM；启动脚本已设 `-gpu swiftshader_indirect -no-accel -no-snapshot`
- 指纹类属性通过 `-prop` 尽量早期注入；若遇不可覆盖的只读限制，保留机型身份与 ABI/zygote 属性以满足绝大多数识别与兼容需求

## 我将实施的改动
1. 在项目根目录新增 Dockerfile（按上述内容），作为唯一构建入口
2. 保留 android-docker 下现有脚本与资源，但改为“被根 Dockerfile 复制并使用”，不再需要二次镜像
3. 对 README 增加“一镜像构建与运行”的指令与注意事项

确认后我会创建/更新根 Dockerfile，并保证你只需构建/拉取 emuhub 一个镜像即可运行 noVNC+Emulator+机型伪装。