## 目标

* 解决无锁文件导致的 `npm ci` 报错。

* 在 `npm run build` 前清理 `.next` 目录，避免旧缓存影响产物。

* 保持最终镜像仅包含运行所需的构建产物与依赖。

## 变更要点（Dockerfile）

1. web-builder 阶段：

   * `COPY web/package*.json ./`

   * `ARG NPM_REGISTRY` 并执行 `npm config set registry "$NPM_REGISTRY"`（如需私有源）。

   * 安装依赖（有锁用 `npm ci`，无锁降级到 `npm install`）：

     * `RUN --mount=type=cache,target=/root/.npm sh -c 'if [ -f package-lock.json ]; then npm ci; else npm install --prefer-offline --no-audit; fi'`

   * 复制源码：`COPY web ./`

   * 在构建前清理 `.next` 并执行构建：

     * `RUN rm -rf .next && npm run build`
2. 最终镜像阶段仅复制运行所需：

   * `COPY --from=web-builder /app/package*.json /opt/app/`

   * `COPY --from=web-builder /app/node_modules /opt/app/node_modules`

   * `COPY --from=web-builder /app/.next /opt/app/.next`

   * `COPY --from=web-builder /app/public /opt/app/public`

## 验证

* 构建：`DOCKER_BUILDKIT=1 docker build -t emuhub:latest .`

* 确认 `.next` 在构建前被清理，构建后重新生成。

* 重复构建应更快（命中 `~/.npm` 下载缓存与镜像层缓存）。

## 备注

* 若未来添加 `package-lock.json`，将自动使用 `npm ci` 以保证可重复性。

* 如采用 Next.js `output: 'standalone'`，可进一步缩小最终镜像，仅复制 `standalone` 与 `static`。

