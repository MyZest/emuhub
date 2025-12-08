## 目标
- 在 Next.js 增加动态版本 API，返回已安装/可安装的安卓版本列表
- 设备页从该 API 渲染版本下拉，标注安装状态；启动时对未安装版本执行懒安装

## API 设计
- 路由：`GET /api/versions`
- 实现：
  - 读取 `/opt/android-sdk-linux/system-images/` 目录，判断 `android-30/32/34` 下是否存在 `google_apis/x86_64`
  - 返回结构：`{ versions: [{ api: 34, installed: true }, { api: 32, installed: false }, ...] }`
- 现有启动 API `POST /api/devices/[id]/start` 已在启动前执行 `sdkmanager system-images;android-${api};google_apis;x86_64`；保持不变以支持懒安装

## UI 改动
- `pages/devices/[id].tsx`
  - 在 `useEffect` 中调用 `/api/versions`
  - 渲染版本下拉选项，显示 `(installed)` 或 `(download)` 标识
  - 保留机型下拉（来自 `/api/profiles`）与 VNC 密码输入

## 运行与验证
- 构建镜像后访问设备页，确认版本列表与状态显示
- 选择未安装版本启动时，观察日志中 `sdkmanager` 安装并成功进入 noVNC 客户端

## 说明
- 目录检测比解析 `sdkmanager --list` 更稳健且更快；保持容器体积并避免多进程开销
- 版本列表可扩展，后续在 API 中增加更多版本即可