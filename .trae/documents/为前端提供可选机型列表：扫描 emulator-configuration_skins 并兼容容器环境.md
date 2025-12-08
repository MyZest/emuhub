## 目标
- 提供一个接口返回可选的所有机型（skin 名称），扫描 `emulator-configuration/skins` 目录。
- 在 Docker 镜像/容器内读取不到该目录时，优雅回退到其他位置或默认列表，保证接口稳定。

## 扫描策略
- 目录候选（按优先级）：
  1. `EMULATOR_SKINS_DIR` 环境变量（可在容器中配置成 `/opt/app/emulator-configuration/skins`）
  2. 仓库路径：`<project>/emulator-configuration/skins`
  3. 容器内应用路径：`/opt/app/emulator-configuration/skins`
  4. SDK 自带路径：`$ANDROID_HOME/emulator/skins`
- 解析规则：列出候选目录下的一级子目录名（如 `pixel_8_pro`、`tv_4k`、`Galaxy_S24_Ultra`）。
- 回退：若所有目录都不可用，返回空列表或一个最小内置列表（推荐空列表，由前端提示）。

## 代码设计
- 新增 `web/lib/skins.js`：
  - `discoverSkins()`：按上述候选路径读取 skins 名称数组，去重并排序。
  - `hasSkin(name)`：检查某个 skin 是否在候选路径或 `$ANDROID_HOME/emulator/skins` 存在。
- 新增接口 `web/pages/api/skins.js`：
  - 返回 `{ skins: [ { name, available } ] }`，其中 `available` 来源于 `hasSkin(name)`。
  - 兼容容器：如果无法读取任何路径，`skins` 返回空数组且 HTTP 200。

## 与现有逻辑的关系
- 不更改 `start.js` 的行为，仅提供可选机型列表供前端展示（如选择 `profile`）。
- 若后续需要将 skin 应用于 emulator 运行，可在 `run-emulator-with-profile.sh` 增加 `-skindir` 与 `-skin` 参数，这次不改动运行逻辑。

## 验证
- 本地仓库环境：能扫描到 `<project>/emulator-configuration/skins` 的所有机型，示例包括 `pixel_8_pro`、`Galaxy_S24_Ultra` 等。
- 容器环境：若 `COPY web /opt/app`，则可通过 `/opt/app/emulator-configuration/skins` 读取；否则依赖 `$ANDROID_HOME/emulator/skins` 或返回空列表。

若确认，我将按以上文件结构添加 `web/lib/skins.js` 与 `web/pages/api/skins.js`，并保持接口稳定返回。