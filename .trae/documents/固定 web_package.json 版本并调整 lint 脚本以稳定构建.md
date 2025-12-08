## 目标
- 去掉依赖与开发依赖中的版本范围符号（^），全部固定为已验证版本，确保可重复构建
- 将 `lint` 脚本从 `next lint` 改为直接使用 ESLint（Next.js 16 已移除 next lint），与我们刚添加的 flat config 对齐
- 可选增加 engines，声明 Node 版本范围（22.x）以提升一致性

## 将进行的修改
- web/package.json
  - dependencies 固定：
    - next: 16.0.0
    - react: 18.2.0
    - react-dom: 18.2.0
    - next-swagger-doc: 0.3.2
    - swagger-ui-react: 5.15.0
    - execa: 9.2.0
  - devDependencies 固定：
    - eslint: 10.0.0
    - eslint-config-next: 16.0.0
    - eslint-plugin-import: 2.29.1
    - eslint-config-prettier: 9.0.0
    - prettier: 3.3.3
  - scripts：`lint` 改为 `eslint .`
  - engines：`{"node":"22.x"}`（提示使用 Node 22）

## 说明
- ESLint 8.x 已 EOL，10.x 为当前维护线；固定版本可避免未来次版本变更带来的规则差异
- 固定版本后，建议在 CI 使用 `npm ci`（需要 lockfile）；我们的 Docker 构建仍保留 `(npm ci || npm install)` 以在没有 lockfile 时自动安装，但锁定版本已保障一致性

确认后我会直接更新 web/package.json 为固定版本。