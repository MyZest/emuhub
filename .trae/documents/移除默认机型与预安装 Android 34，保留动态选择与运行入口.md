## 结论与修复
- 删除默认机型：去掉 `ENV SPOOF_PROFILE=pixel_8_pro`，改为仅由 UI/API 在运行时选择机型
- 不预装系统镜像：移除 `sdkmanager "platforms;android-34"` 与 `sdkmanager "system-images;android-34;google_apis;x86_64"`
- 保留必备工具：只安装 `cmdline-tools;latest`、`build-tools;34.0.0`、`platform-tools`
- apt 拉取失败（连接 `archive.ubuntu.com`）
  - 先用 http 更新并安装 `ca-certificates`，再切回 https
  - 增加重试与 `--fix-missing`，支持替换镜像站

## Dockerfile 修改点
- 删除：
  - `ENV SPOOF_PROFILE=pixel_8_pro`
  - 预装 Android 34 的两行 `sdkmanager`
- 保留：
  - `CMD ["/opt/tools/start-emuhub.sh"]` 与端口 `EXPOSE 6080 5901 5555`
- apt 段改为：
```
ARG UBUNTU_MIRROR=archive.ubuntu.com
ARG UBUNTU_SECURITY_MIRROR=security.ubuntu.com
ARG APT_SCHEME=http
RUN set -eux; \
    sed -i "s|http://archive.ubuntu.com|${APT_SCHEME}://${UBUNTU_MIRROR}|g" /etc/apt/sources.list; \
    sed -i "s|http://security.ubuntu.com|${APT_SCHEME}://${UBUNTU_SECURITY_MIRROR}|g" /etc/apt/sources.list; \
    printf 'Acquire::Retries "5";\nAcquire::http::No-Cache "true";\n' > /etc/apt/apt.conf.d/99retries

RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt \
    set -eux; \
    if [ "${ENABLE_I386:-false}" = "true" ]; then dpkg --add-architecture i386; fi; \
    apt-get -o Acquire::Retries=5 update -yqq; \
    apt-get install -y --no-install-recommends ca-certificates gnupg; \
    update-ca-certificates; \
    sed -i "s|http://|https://|g" /etc/apt/sources.list; \
    apt-get -o Acquire::Retries=5 update -yqq; \
    apt-get install -y --no-install-recommends curl expect git openjdk-17-jdk wget unzip vim xvfb fluxbox x11vnc novnc python3-websockify --fix-missing; \
    if [ "${ENABLE_I386:-false}" = "true" ]; then apt-get install -y libc6:i386 libgcc1:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386 --fix-missing; fi; \
    curl -fsSL --retry 5 --retry-delay 3 https://deb.nodesource.com/setup_18.x | bash -; \
    apt-get install -y --no-install-recommends nodejs --fix-missing; \
    apt-get clean; rm -rf /var/lib/apt/lists/*; \
    groupadd android; useradd -d /opt/android-sdk-linux -g android android
```
- Android SDK 安装：
```
RUN /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "cmdline-tools;latest" \ 
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "build-tools;34.0.0" \ 
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "platform-tools"
```
- 可选：添加 `ARG PREINSTALL_API=""`，如需预装时用构建参数启用；默认空不预装

## 构建与加速建议（M2）
- 不预装镜像：`docker build --platform linux/amd64 -t emuhub:0.1.0 .`
- 网络慢时：
  - 传镜像站与 http：`--build-arg UBUNTU_MIRROR=mirrors.aliyun.com --build-arg UBUNTU_SECURITY_MIRROR=mirrors.aliyun.com --build-arg APT_SCHEME=http`
  - npm 镜像：`--build-arg NPM_REGISTRY=https://registry.npmmirror.com`

## 运行与按需安装
- 运行容器后，设备页选择 Android 版本；若未安装，API 会先执行 `sdkmanager system-images;android-<api>;google_apis;x86_64` 再启动 Emulator（页面显示 download）

如确认，我将按上述修改调整 Dockerfile，移除默认机型与预装行，并加入 apt 修复与加速策略。