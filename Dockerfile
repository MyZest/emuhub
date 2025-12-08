FROM ubuntu:20.04

LABEL maintainer="emuhub"

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US \
    LC_ALL=en_US.UTF-8 \
    DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android-sdk-linux \
    ANDROID_SDK_HOME=/opt/android-sdk-linux \
    ANDROID_SDK_ROOT=/opt/android-sdk-linux \
    ANDROID_SDK=/opt/android-sdk-linux \
    PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/cmdline-tools/tools/bin:${ANDROID_HOME}/tools/bin:${ANDROID_HOME}/build-tools/34.0.0:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${ANDROID_HOME}/bin"

RUN dpkg --add-architecture i386 \
    && apt-get update -yqq \
    && apt-get install -y curl expect git libc6:i386 libgcc1:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386 openjdk-17-jdk wget unzip vim xvfb fluxbox x11vnc novnc python3-websockify \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && groupadd android \
    && useradd -d /opt/android-sdk-linux -g android android

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
RUN npm ci || npm install \
    && npm run build

EXPOSE 6080 5901 5555

ENV SPOOF_PROFILE=pixel_8_pro
WORKDIR /opt/android-sdk-linux
CMD ["/opt/tools/start-emuhub.sh"]
