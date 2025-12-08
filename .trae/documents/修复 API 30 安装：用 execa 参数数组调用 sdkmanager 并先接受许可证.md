## 目标
- 通过读取目录返回可用的设备型号列表，来源于 `emulator-configuration/skins/*`
- 在本地开发与打包成 Docker 镜像后都可正常读取（容器无法访问宿主源码目录时也能返回）

## 方案
- 新增 API 路由 `/api/skins`
  - 本地开发：优先读取仓库路径 `emulator-configuration/skins/*`，每个子目录作为一个机型 ID 返回（如 `pixel_8_pro`）
  - 镜像环境：读取镜像内预置目录 `/opt/skins/*`
  - 返回结构：`{ skins: [{ id: string, name: string, hasLogo: boolean }] }`
    - `id`: 子目录名
    - `name`: 同 `id`（或做简单友好化处理，比如替换下划线为空格）
    - `hasLogo`: 通过查找 `/data/spoof/profiles/<id>.png|.svg`、`/opt/spoof/profiles/<id>.png|.svg`、`/opt/spoof/logos/<id>.png|.svg` 判断
- 构建兼容：
  - 在 Dockerfile 中 `COPY emulator-configuration/skins /opt/skins`（镜像内可读）
  - （可选）生成清单 `/opt/spoof/skins.json` 以加快读取；默认直接列目录即可

## 验证与前端使用
- 设备页调用 `/api/skins` 获取列表，渲染带 logo 的卡片（现有逻辑复用 `hasLogo` 与 `/api/profile-logo/<id>`）
- 本地与镜像环境：如果本地目录不存在或容器内不可读，路由有 fallback（例如返回空列表或内置默认机型）

## 说明
- 目录读取方式无需修改现有机型来源（profiles）；只扩展“型号列表”的来源为 skins 目录
- 镜像环境必须复制该目录到 `/opt/skins`；否则容器无法访问宿主源码路径

我将据此添加 `/api/skins` 路由并在 Dockerfile 复制 `emulator-configuration/skins` 到镜像，同时在路由里加入本地与镜像两种读取逻辑与 fallback。