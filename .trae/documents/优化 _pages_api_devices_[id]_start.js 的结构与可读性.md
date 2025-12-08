## execa `$` 用法与优势
- `$` 是 execa 提供的标签模板，用来以接近原生 shell 的形式执行命令：
  - `const { $ } = await import('execa'); const $$ = $({ stdio: 'inherit', shell: true });`
  - 使用 ``await $$`xvfb :11 -screen 0 1280x800x24``` 可直观展示整条命令
- 优势：
  - 更清晰的命令字符串与参数插值（会自动安全处理参数插值）
  - 统一输出/错误捕获（`stdio: 'inherit'` 直观观察过程；或默认捕获 `stdout/stderr`）
  - Promise 风格，便于按步骤 `await` 串行执行

## 你的 API 中的替换点
- 当前位置（web/pages/api/devices/[id]/start.js）：
  - `spawnSync('/opt/.../sdkmanager', [...])` → 用 `$` 执行并打印完整命令
  - `spawn('Xvfb', ...)`、`spawnSync('bash', ['-lc', ...])`、`spawn('x11vnc', ...)`、`spawn('websockify', ...)`、`spawn('/opt/tools/run-emulator-with-profile.sh', ...)` → 改用 `$` 或 `$$`，提升可读性与日志
- 示例（保持单文件、不拆函数）：
  - 顶部：`const { $ } = await import('execa'); const $$ = $({ stdio: 'inherit', shell: true });`
  - 关键步骤：
    - `await $$`/opt/android-sdk-linux/cmdline-tools/tools/bin/sdkmanager ${sysImg(api)}`
    - `await $$`Xvfb ${display} -screen 0 1280x800x24``
    - `await $$`bash -lc 'x11vnc -storepasswd "${vncPass}" ${passwdFile}'``
    - `await $$`x11vnc -display ${display} -forever -rfbport ${vncPort} -shared -passwdfile ${passwdFile}``
    - `await $$`websockify ${wsPort} localhost:${vncPort}``
    - `await $`('/opt/tools/run-emulator-with-profile.sh', { env })`

## 端口与 id 的“可加解密映射”建议
- 外显层使用短码（如 `hashids` 或 `base36`），API 层统一解码为数字 id 后按现有规则计算 `display/vnc/ws`；
- 好处：美观、可控，且不改变内部端口计算与去冲突策略；后续只需将设备路由从 `devices/:id` 改为 `devices/:short` 并在 API 层解码。

## 安全注意
- execa `$` 会自动对插值参数做安全处理；但仍需保留你已有的校验（`profile` 正则、`vnc_pass` 长度、`api` 白名单）防止注入
- 长命令与后台进程：`stdio: 'inherit'` 适合调试；生产可改为默认捕获并写日志；保持 API 尽快返回并让进程在后台运行

## 接入步骤
1) 在 `web/package.json` 添加依赖 `execa`（ESM-only）；`pages/api` 中使用 `await import('execa')`
2) 在 `start.js` 顶部引入 `$`/`$$`，替换现有 `spawn/spawnSync` 调用；按步骤 `await` 执行，遇错直接 `catch` 并返回 `{ ok:false, error }`
3) （可选）引入设备短码库（如 `hashids`）供 UI 展示与 API 解码
4) 验证：本地构建后打开设备页，观察服务器日志能直观看到每条执行命令；确保启动流程正常

如确认，我将把 `execa` 以最小改动方式接入到 `start.js`，只替换执行部分，整体结构与返回保持不变；可选再加入短码路由与解码逻辑。