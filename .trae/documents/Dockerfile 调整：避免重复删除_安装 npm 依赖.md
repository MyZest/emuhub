## 现状核查
- 已检查仓库中的构建文件：`/Users/zest/myworks/emuhub/Dockerfile`。
- 未发现删除 npm 缓存或删除 `node_modules` 的命令；因此“注释删除 npm 缓存步骤”目前无需改动。
- 相关构建段：
  - 安装与构建：`/Users/zest/myworks/emuhub/Dockerfile:64-69`（使用 BuildKit 缓存挂载到`/root/.npm`，无清理命令）
  - 源码复制在安装之前：`/Users/zest/myworks/emuhub/Dockerfile:47`、`/Users/zest/myworks/emuhub/Dockerfile:63`

## 若需减少调试时重复安装依赖
1. 将安装命令固定为 `npm install`
   - 目的：避免 `npm ci` 的“删除并重装”行为（`npm ci`会清空`node_modules`）。
   - 修改点：把`/Users/zest/myworks/emuhub/Dockerfile:68`的`(npm ci || npm install)`改为`npm install`。
   - 可选：通过构建参数控制行为，保留生产的 `npm ci`：
     - 新增 `ARG USE_NPM_CI=true`，并在安装处：
       - `if [ "${USE_NPM_CI}" = "true" ]; then npm ci; else npm install; fi`

2. 优化 Docker 层缓存顺序
   - 目的：代码改动不触发依赖重装的层失效。
   - 调整为先复制包清单再安装：
     - `COPY web/package.json /opt/app/package.json`
     - `COPY web/package-lock.json /opt/app/package-lock.json`
     - 运行安装（沿用现有 `--mount=type=cache,target=/root/.npm`）
     - 再复制其余源码：`COPY web /opt/app`

3. 可选：缓存 `node_modules`
   - 目的：在调试环境进一步提升增量构建速度。
   - 做法：在安装步骤增加 `--mount=type=cache,target=/opt/app/node_modules`（仅建议在同一构建环境下的开发/调试使用）。

## 验证方案
- 使用 BuildKit 构建（`DOCKER_BUILDKIT=1`）：确认安装命中缓存（无重复下载），并在生产构建时开启`USE_NPM_CI=true`保留严格锁定安装。
- 构建完成后运行应用，确保无运行时差异。