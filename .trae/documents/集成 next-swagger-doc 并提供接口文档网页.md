## 目标
- 在 Next.js 中集成 next-swagger-doc，自动生成 OpenAPI 规范（swagger.json）
- 提供一个网页（/docs）展示 API 文档（使用 swagger-ui-react），随代码更新自动反映

## 改动内容
- 依赖
  - 在 web 项目添加依赖：next-swagger-doc、swagger-ui-react
- 生成规范
  - 新增路由：`web/pages/api/swagger.json.ts`，使用 `createSwaggerSpec` 基于 `pages/api` 自动生成规范
  - 配置基础信息：title、version、servers（例如 http://localhost:8080）、tags
- 文档页面
  - 新增页面：`web/pages/docs.tsx`，从 `/api/swagger.json` 拉取规范并用 `swagger-ui-react` 渲染
- 注释格式
  - 将已有接口头部说明补充为 swagger JSDoc 注释（`@swagger` 块），涵盖路径、方法、参数（query/body）、响应结构
    - `GET /api/profiles`、`POST /api/profiles`、`DELETE /api/profiles/{name}`
    - `GET /api/versions`
    - `POST /api/devices/{id}/start`
- Docker 构建
  - 在根 Dockerfile 的 Node 构建阶段安装新增依赖并重新 `npm run build`

## 访问
- 构建并运行后，打开 `http://localhost:8080/docs` 即可查看接口文档；规范文件在 `http://localhost:8080/api/swagger.json`

## 说明
- next-swagger-doc 通过扫描 `pages/api` 中的 `@swagger` 注释生成规范；后续新增接口只需补注释即可自动出现在文档中
- swagger-ui-react 纯前端渲染，部署成本低，适合容器内一并提供