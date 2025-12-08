## 目标
- 将 `web/lib/api-versions.js` 与 `web/lib/skins.js` 的逻辑分别内联到使用它们的 API 路由文件中，移除 `web/lib` 目录，减少结构冗余。

## 变更范围
- `web/pages/api/versions.js`：内联 API 版本发现与安装检测逻辑（读取 android-docker、SDK system-images、默认回退）。
- `web/pages/api/devices/[id]/start.js`：内联 API 版本发现逻辑，替换对 `lib/api-versions` 的依赖。
- `web/pages/api/skins.js`：内联 skins 扫描与可用性检测逻辑（多候选路径与回退）。
- 删除 `web/lib/api-versions.js` 与 `web/lib/skins.js`。

## 验证
- `/api/versions` 返回动态版本列表，容器内读取不到仓库目录时仍返回有效列表或默认回退。
- 设备启动接口对 `api` 的校验基于动态发现，兼容容器环境。
- `/api/skins` 返回机型列表及可用性标记，容器环境不可读时返回空数组而非错误。

若确认，我将执行上述内联与删除操作，并逐一验证接口返回。