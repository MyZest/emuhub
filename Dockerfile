# syntax=docker/dockerfile:1
FROM ubuntu:20.04

LABEL maintainer="emuhub"

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US \
    LC_ALL=en_US.UTF-8 \
    DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android-sdk-linux \
    ANDROID_SDK_HOME=/opt/android-sdk-linux \
    ANDROID_SDK_ROOT=/opt/android-sdk-linux \
    ANDROID_SDK=/opt/android-sdk-linux
ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/cmdline-tools/tools/bin:${ANDROID_HOME}/tools/bin:${ANDROID_HOME}/build-tools/34.0.0:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${ANDROID_HOME}/bin"

ARG UBUNTU_MIRROR=archive.ubuntu.com
ARG ENABLE_I386=false
RUN set -eux; \
    sed -i "s|http://archive.ubuntu.com|https://${UBUNTU_MIRROR}|g" /etc/apt/sources.list; \
    sed -i "s|http://security.ubuntu.com|https://${UBUNTU_MIRROR}|g" /etc/apt/sources.list; \
    printf 'Acquire::Retries \"5\";\nAcquire::http::Timeout \"30\";\nAcquire::https::Timeout \"30\";\nAcquire::http::Pipeline-Depth \"0\";\nAcquire::http::No-Cache \"true\";\nAcquire::https::No-Cache \"true\";\n' > /etc/apt/apt.conf.d/99retries

RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt \
    set -eux; \
    if [ "${ENABLE_I386}" = "true" ]; then dpkg --add-architecture i386; fi; \
    apt-get update -yqq; \
    apt-get install -y --no-install-recommends curl expect git \
      openjdk-17-jdk wget unzip vim xvfb fluxbox x11vnc novnc python3-websockify; \
    if [ "${ENABLE_I386}" = "true" ]; then apt-get install -y libc6:i386 libgcc1:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386; fi; \
    curl -fsSL --retry 5 --retry-delay 3 https://deb.nodesource.com/setup_18.x | bash -; \
    apt-get install -y --no-install-recommends nodejs; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    groupadd android; \
    useradd -d /opt/android-sdk-linux -g android android

COPY android-docker/android34/tools /opt/tools
COPY android-docker/android34/licenses /opt/licenses
COPY android-docker/common/spoof /opt/spoof
COPY web /opt/app

WORKDIR /opt/android-sdk-linux

RUN /opt/tools/entrypoint.sh built-in

RUN /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "cmdline-tools;latest" \
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "build-tools;34.0.0" \
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "platform-tools" \
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "platforms;android-34" \
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "system-images;android-34;google_apis;x86_64"

RUN python3 /opt/spoof/gen_profiles.py
RUN mkdir -p /data/spoof/profiles
WORKDIR /opt/app
ARG NPM_REGISTRY=
RUN --mount=type=cache,target=/root/.npm \
    set -eux; \
    if [ -n "${NPM_REGISTRY}" ]; then npm config set registry "${NPM_REGISTRY}"; fi; \
    (npm ci || npm install); \
    npm run build

EXPOSE 6080 5901 5555

ENV SPOOF_PROFILE=pixel_8_pro
WORKDIR /opt/android-sdk-linux
CMD ["/opt/tools/start-emuhub.sh"]
