## 后端
- 设备型号：完成 /api/skins → 前端改为从该接口拉取型号；读取顺序：本地 emulator-configuration/skins/* → 镜像 /opt/skins/*；返回 { id,name,hasLogo }
- Logo 显示：/api/profile-logo/[name] 的查找顺序为 /data/spoof/profiles → /opt/spoof/profiles → /opt/spoof/logos，保证镜像构建后可显示
- Android API 列表：在 Dockerfile 复制 android-docker/apis.json 至镜像（/opt/spoof/apis.json）；/api/versions 先读清单，再标注 installed（检测 /opt/android-sdk-linux/system-images/...）
- sdkmanager 调用修复：在 /pages/api/devices/[id]/start.js 使用 execa 参数数组，先执行 --licenses 再安装 "system-images;android-<api>;google_apis;x86_64"；AVD 创建同样用参数数组，避免分号被 shell 当作分隔符

## 前端
- 设备页：改为从 /api/skins 渲染型号卡片（带 logo）；保留响应式样式，兼容 Windows 桌面与移动端（≥1024px 4–6列，≤768px 2–3列，≤480px 1列）；卡片 hover/focus/active 友好，点击区域加大
- 版本下拉：从 /api/versions 读取、显示 (installed)/(download)，与安装流程一致

## 构建与兼容
- Dockerfile：复制 emulator-configuration/skins → /opt/skins；复制 android-docker/apis.json → /opt/spoof/apis.json（若没有则跳过，运行期由目录扫描）
- 运行期：不挂载 profiles 也能用内置 logo；挂载后可以覆盖

## 验证
- 构建后访问设备页：型号列表与 logo 显示正常；选择 API 30 首次安装成功（无分号解析错误），Emulator 启动后 noVNC 正常连接

## 说明
- 不改变现有行为与接口返回结构，只增强可用性与兼容性；后续新增型号/API 只需在目录或清单中补充即可（镜像读取与本地读取均可用）。