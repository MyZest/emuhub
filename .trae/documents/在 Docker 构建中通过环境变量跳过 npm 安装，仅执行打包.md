## 不改 Dockerfile 的构建命令
- 基于你提供命令，只需开启 BuildKit 并关闭 `npm ci`：
  - `DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --build-arg USE_NPM_CI=false -t emuhub:0.1.1 .`

## 为什么这样能避免重新安装
- 现有 Dockerfile 已将安装步骤放在复制源码之前（先复制 `package*.json`，再安装，再复制源码）。
- 只要 `web/package.json` 与 `web/package-lock.json` 未变化，Docker 层缓存会复用“安装依赖”的层，不会再次执行安装。
- 传入 `USE_NPM_CI=false` 可避免在需要安装时使用 `npm ci`（它会清空 `node_modules`），进一步降低等待时间。

## 额外建议（可选）
- 若多环境/多机器构建，使用显式缓存传递：
  - `DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --build-arg USE_NPM_CI=false --cache-to=type=local,dest=.buildkit-cache,mode=max --cache-from=type=local,src=.buildkit-cache -t emuhub:0.1.1 .`
- 构建前避免改动 `package*.json`，否则安装层会失效并重新安装。