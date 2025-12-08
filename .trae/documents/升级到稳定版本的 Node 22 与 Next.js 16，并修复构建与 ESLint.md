## 升级目标
- Node.js：升级为当前稳定的长期支持版本 22.x（安全与性能更佳）
- Next.js：升级到 16.x（移除了 next lint、改进构建与依赖管理）
- ESLint：升级到 10.x 并采用官方推荐的 flat config（eslint.config.mjs），避免过时版本和规则冲突
- 关闭 Next.js 匿名遥测（构建更安静）：设置 `NEXT_TELEMETRY_DISABLED=1`

## 具体改动
- web/package.json
  - dependencies：`next` 升级到 `^16`；保留 `react`/`react-dom` 18.x（与 Next 16 兼容稳定）；`execa` 保留
  - devDependencies：升级 `eslint` 到 `^10`；`eslint-config-next` 到最新；移除过时或不必要项
  - scripts：保留 `build` 与 `start`；去除不再需要的 `next lint` 相关脚本或改为 `eslint` 直接 lint（可选）
- ESLint 配置
  - 删除 `.eslintrc.json`
  - 新增 `eslint.config.mjs`（flat config）：
    - 使用 `eslint-config-next/core-web-vitals`
    - 关闭或放宽 `curly`（改为 `"multi-line"`）以避免现有单行 `if` 报错；或临时关闭该规则
    - 集成 `eslint-config-prettier` 以避免格式冲突
- Dockerfile
  - Node 安装改为 NodeSource 22：`https://deb.nodesource.com/setup_22.x`
  - 构建阶段设置 `ENV NEXT_TELEMETRY_DISABLED=1`
  - npm 安装逻辑：保留 `(npm ci || npm install)`；若无 `package-lock.json` 将自动使用 `npm install`，无需报错
- 代码与构建修复
  - 保留 execa `$` 标签模板执行（可读性更好）
  - 为避免 ESLint 构建失败，使用 flat config 放宽 `curly` 或在必要处加花括号（优先放宽规则，减少代码改动）

## 验证
- 构建：`docker build --platform linux/amd64 -t emuhub:latest .`
- 运行：`docker run --platform linux/amd64 -it --rm -p 8080:8080 -p 6080-6090:6080-6090 -p 5900-5910:5900-5910 -p 5555:5555 --name emuhub emuhub:latest`
- 检查：
  - `/docs` 正常打开（swagger-ui）
  - 设备页可选择机型与版本并启动
  - 构建日志不再出现 `curly` 报错；无`npm ci`锁文件时报错

## 说明
- ESLint 8.x 已到 EOL，升级至 10.x 更安全（官方支持与维护）
- Next.js 16 移除了 `next lint`，建议改用 flat config + `eslint` 脚本
- 关闭 Next.js 遥测：`NEXT_TELEMETRY_DISABLED=1` 或命令 `next telemetry disable`，本方案使用环境变量

## 我将进行的修改
1) 更新 web/package.json 的版本与 devDependencies
2) 删除 `.eslintrc.json`，新增 `eslint.config.mjs`（flat config，放宽 curly）
3) 更新 Dockerfile 的 Node 安装为 22.x，增加 `NEXT_TELEMETRY_DISABLED=1`
4) 验证构建通过，日志干净，功能不变