# EmuHub

![main](https://github.com/mohamed-helmy/emuhub/actions/workflows/docker-image.yml/badge.svg)


<p align="center">
  <img id="header" src="./images/logo.png" />
</p>

## Overview
EmuHub is an innovative tool designed to simplify the testing of Android applications by providing access to multiple emulators via web browsers. Built with Docker and NoVNC (HTML5-based VNC client), EmuHub offers developers and QA engineers a seamless platform for testing APKs across various Android device configurations.

## Features
- **Multiple Emulators**: EmuHub allows you to access multiple Android emulators simultaneously, facilitating parallel testing of applications.
- **Web-Based Interface**: With EmuHub, you can control and interact with emulators directly from your web browser, eliminating the need for local installations or complex configurations.
- **Dockerized Environment**: EmuHub is built using Docker containers, ensuring easy deployment and scalability across different environments.
- **Customizable Configurations**: EmuHub is based on images from [mohamed-helmy/android-docker](https://github.com/mohamed-helmy/android-docker), providing flexibility to customize emulator configurations according to your testing requirements.
- **Seamless Testing Experience**: EmuHub simplifies the testing process by offering a user-friendly interface and centralized access to emulator instances, enhancing productivity for developers and QA engineers.
### Supported Tags
- `docker pull mohamedhelmy/emuhub:latest`

## Getting Started
单镜像构建与运行（内嵌 android-docker、noVNC 与机型伪装启动器）：

1. **Clone the Repository**: Clone the EmuHub repository to your local machine.

    ```bash
    git clone git@github.com:mohamed-helmy/emuhub.git
    ```

2. **Build the Docker Image**
    ```bash
    docker build --platform linux/amd64 -t emuhub:0.1.0 .
    ```

3. **Run EmuHub Container（noVNC + Emulator）**
    ```bash
    docker run --platform linux/amd64 -it --rm \
      -p 6080:6080 -p 5901:5901 -p 5555:5555 \
      -e SPOOF_PROFILE=pixel_8_pro \
      --name emuhub emuhub:0.1.0
    ```
    
4. **Access Emulators**
  - noVNC：`http://localhost:6080`
  - VNC：`localhost:5901`
  - ADB：`adb connect localhost:5555`

## Example Docker Compose
```yaml
services:
  emulator:
    image: mohamedhelmy/emuhub:latest
    privileged: true
    scale: 1
    environment:
      - VNCPASS=admin
      - emuhubPASS=admin
      - LISTENPORT=8000
    ports:
      - 8000:8000
    volumes:
      - ./apk-demo:/home/emuhub/apk
    logging:
      driver: json-file
      options:
        max-size: 20m
        max-file: '10'
```

 Modify the configuration as per your requirements. Ensure to set appropriate values for `VNCPASS`, `emuhubPASS`, and `LISTENPORT`.

**Run EmuHub Container**:

 Start EmuHub using Docker Compose:

```bash
docker compose up -d
```
Once EmuHub is running, access it via a web browser using the URL `http://<your-server-ip>:8000`. Replace `<your-server-ip>` with the IP address of the server where EmuHub is hosted.
<p align="center">
  <img id="demo" src="./images/demo.gif" />
</p>

## Contribution
Contributions to EmuHub are welcome! If you have any suggestions, bug fixes, or new features to propose, feel free to open an issue or submit a pull request.

## License
This project is licensed under the [MIT License](LICENSE), allowing for both personal and commercial use with attribution.

## Support
For any questions or assistance, please contact [helmy419@gmail.com](mailto:helmy419@gmail.com).

---

**Note:** EmuHub is a project maintained by [Mohamed Helmy]. We strive to improve the testing experience for Android developers and welcome feedback from the community.
Thank you for using EmuHub!
## Architecture
- Single-entry build: root `Dockerfile` builds the runnable image (no separate images required)
- Resources: `android-docker/` holds SDK scripts, licenses and spoof profiles used by the root build
- Runtime: Container starts noVNC + Emulator; spoof profiles are injected via `-prop` before AVD creation
## Hot-plug Profiles
- 挂载动态机型目录：
  - `docker run ... -v $(pwd)/profiles:/data/spoof/profiles ...`
- API：
  - 列表：`GET /api/profiles`
  - 上传：`POST /api/profiles`（JSON：`{ name, content }`）
  - 删除：`DELETE /api/profiles/<name>`
## Device Logos
- 放置路径（两种都支持，名字与机型一致，例如 `pixel_8_pro.png` 或 `.svg`）：
  - 动态：`/data/spoof/profiles/<name>.png|.svg`（运行容器时挂载 `-v $(pwd)/profiles:/data/spoof/profiles`）
  - 内置：`/opt/spoof/profiles/<name>.png|.svg`
- 前端会自动在机型列表中显示对应 logo；无 logo 显示占位文本。
