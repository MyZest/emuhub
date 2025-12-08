## 目标
- 不再只有一个 VNC 页；为每个“设备实例”提供独立入口页（/devices/<id>），在启动前可选择 Android 版本、机型伪装与设置 VNC 密码
- 启动后为该设备绑定专属 Xvfb 显示、VNC 端口与 websockify 端口，noVNC 页面只对应该设备

## 端口与显示分配
- 每设备实例分配：
  - 显示：`:10 + id`（如设备1 → `:11`）
  - VNC 端口：`5900 + id`（设备1 → 5901）
  - websockify 端口：`6080 + id`（设备1 → 6081）
- 根 HTTP 服务统一监听 6080，提供入口与设备页；WebSocket 代理转发到对应设备的 `608x`

## 后端控制服务
- 在容器内运行一个轻量服务（Flask/Node）：
  - `GET /devices`：返回设备列表与状态
  - `GET /devices/<id>`：返回设备入口页（版本、机型、VNC 密码设置）
  - `POST /devices/<id>/start`：参数 `api`、`profile`、`vnc_pass`
    - 如系统镜像未安装：用 `sdkmanager system-images;android-${api};google_apis;x86_64` 懒安装
    - AVD 名：`emu_${profile}_api${api}_d${id}`
    - 启动流程：启动 `Xvfb :display` → `x11vnc -rfbport 590x -passwdfile` → `websockify 608x` → 调用现有 `/opt/tools/run-emulator-with-profile.sh`，并覆盖 `SYS_IMG`、`AVD_NAME` 与 `DISPLAY`
  - `POST /devices/<id>/stop`：结束该设备的 Emulator/VNC/websockify 进程
  - VNC 密码：通过生成 per-device `~/.vnc/passwd_<id>` 并传给 `x11vnc -passwdfile`

## 前端入口页
- 路由：`/devices/<id>`，包含：
  - Android 版本下拉（预装：30/32/34；未装显示“将下载”）
  - 机型伪装下拉（来自 `/opt/spoof/profiles/*.props`）
  - VNC 密码输入框
  - “启动设备”按钮调用 `/devices/<id>/start`
  - 启动完成后嵌入该设备的 noVNC 客户端（连接 `ws://localhost:608x`）或跳转设备专属 noVNC URL

## 运行时与兼容
- Emulator 参数：`-gpu swiftshader_indirect -no-accel -no-snapshot -no-boot-anim`
- macOS 无 KVM；全部使用软件渲染
- 体积控制：预装少量版本，其余按需下载；入口页提示大小与状态

## 实施步骤
1. 新增后端控制服务 `/opt/control`（Flask/Node），实现设备路由与启动/停止逻辑
2. 新增前端页面 `/opt/ui`，提供设备入口页与表单，内嵌 noVNC 客户端
3. 修改 `start-emuhub.sh`：启动根 HTTP 服务（入口+静态资源）、不再直接启动单一 VNC；按设备请求动态启动对应实例
4. 更新 README：说明“每设备独立入口页”的访问与端口分配；记录 VNC 密码与版本选择流程

## 说明
- 独立入口页满足“先选择版本与设置密码，再运行”的诉求，且每设备拥有专属 VNC/noVNC 端口与页面
- 通过控制服务协调安装与启动，保留现有伪装与 AVD 管理模式