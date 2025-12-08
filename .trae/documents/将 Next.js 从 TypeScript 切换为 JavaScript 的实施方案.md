## 目标
- 统一把 `web/` 下的 Next.js 代码从 TypeScript 切换为 JavaScript，去除 TS 依赖，同时保留现有功能：设备独立入口、API、接口文档（next-swagger-doc）、热插拔机型。

## 文件改动
- 页面与 API 文件改名与内容调整：
  - `web/pages/index.tsx` → `index.jsx`
  - `web/pages/devices/[id].tsx` → `[id].jsx`
  - `web/pages/docs.tsx` → `docs.jsx`
  - `web/pages/api/versions.ts` → `versions.js`
  - `web/pages/api/profiles.ts` → `profiles.js`
  - `web/pages/api/profiles/[name].ts` → `[name].js`
  - `web/pages/api/devices/[id]/start.ts` → `start.js`
  - `web/pages/api/swagger.json.ts` → `swagger.json.js`
- 移除 TS 语法：
  - 去掉 `import type {...}`、泛型 `NextApiResponse<...>`、`as Type` 等，改为普通 JS；保留头部 JSDoc 与 `@swagger` 注释。
  - 将 `useState<string>` 等改为普通 `useState`。
- 配置清理与更新：
  - 删除 `web/tsconfig.json`
  - 更新 ESLint：
    - 移除 `@typescript-eslint/no-unused-vars` 规则；保留 `next/core-web-vitals`
    - 保留 `no-console: warn`
  - `web/package.json`：
    - 移除 `typescript` devDependency
    - 保留 `eslint` 与 `eslint-config-next`，`lint` 脚本不变
- 依赖与文档：
  - 保留 `next-swagger-doc` 与 `swagger-ui-react`（均支持 JS 项目）
  - 无需更改 `next.config.js`

## 验证
- 本地/容器内构建 Next.js：`npm run build`、`npm run start -p 8080`
- 访问页面：`/`、`/devices/1`、`/docs`
- 调用 API：`/api/versions`、`/api/profiles`、`/api/devices/1/start`

## 注意
- 所有 `@swagger` 注释保留，next-swagger-doc 继续扫描生成 `swagger.json`
- API 的错误返回统一 `{ ok:false, error:'...' }`，行为不变

## 交付
- 完成上述改名与内容调整、配置清理，并通过构建与运行验证；不影响现有 Docker 构建流程。