## Dockerfile 修改
- 目的：将 `android-docker/` 下所有以 `android` 开头的版本目录复制到容器内的 `/opt/android-docker`，保证运行时可枚举完整版本。
- 变更位置：`Dockerfile:43-46`
- 具体调整：
  - 保留现有 `common/tools`、`common/spoof`、`android34/licenses` 的复制逻辑不变。
  - 新增：
    - `RUN mkdir -p /opt/android-docker`
    - `COPY android-docker/android*/ /opt/android-docker/`

## API 路径修复
- 在以下两处将候选目录增加并优先使用 `'/opt/android-docker'`，同时保留现有路径以兼容本地开发：
  - `web/pages/api/versions.js:4-26`
  - `web/pages/api/devices/[id]/start.js:12-34`
- 统一并集枚举：遍历所有候选路径，合并为去重后的集合后排序返回，不再对第一个非空目录提前返回。
- 正则统一为 `^android[-_]?(\d+)$`，两处一致。

## 返回含义保持
- `versions` 列表覆盖来自 `/opt/android-docker` 与工作目录的所有版本；`installed` 继续仅表示系统镜像是否存在（`/opt/android-sdk-linux/system-images`），不改变字段含义。

## 验证
- 构建镜像后，容器内存在 `/opt/android-docker/android28..android34` 时，`GET /api/versions` 返回完整版本，并与 `devices/[id]/start` 的 `allowedApis` 对齐。