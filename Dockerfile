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
ENV NEXT_TELEMETRY_DISABLED=1

ARG UBUNTU_MIRROR=archive.ubuntu.com
ARG UBUNTU_SECURITY_MIRROR=security.ubuntu.com
ARG APT_SCHEME=http
ARG ENABLE_I386=false
RUN set -eux; \
    sed -i "s|http://archive.ubuntu.com|${APT_SCHEME}://${UBUNTU_MIRROR}|g" /etc/apt/sources.list; \
    sed -i "s|http://security.ubuntu.com|${APT_SCHEME}://${UBUNTU_SECURITY_MIRROR}|g" /etc/apt/sources.list; \
    printf 'Acquire::Retries \"5\";\nAcquire::http::Timeout \"30\";\nAcquire::https::Timeout \"30\";\nAcquire::http::Pipeline-Depth \"0\";\nAcquire::http::No-Cache \"true\";\nAcquire::https::No-Cache \"true\";\n' > /etc/apt/apt.conf.d/99retries

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
    curl -fsSL --retry 5 --retry-delay 3 https://deb.nodesource.com/setup_22.x | bash -; \
    apt-get install -y --no-install-recommends nodejs --fix-missing; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    groupadd android; \
    useradd -d /opt/android-sdk-linux -g android android

COPY android-docker/android34/tools /opt/tools
COPY android-docker/android34/licenses /opt/licenses
COPY android-docker/common/spoof /opt/spoof
COPY web /opt/app
RUN find /opt/tools -type f -name "*.sh" -exec chmod +x {} \;

WORKDIR /opt/android-sdk-linux

RUN /opt/tools/entrypoint.sh built-in

RUN chmod +x /opt/android-sdk-linux/bin/android-accept-licenses.sh

RUN /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "cmdline-tools;latest" \
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "build-tools;34.0.0" \
    && /opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager "platform-tools"

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
WORKDIR /opt/android-sdk-linux
CMD ["/opt/tools/start-emuhub.sh"]
