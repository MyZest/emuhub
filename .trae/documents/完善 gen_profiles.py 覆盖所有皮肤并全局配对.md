## 现状与问题
- 生成器仅遍历 `models.json` 的键，未枚举皮肤目录：`android-docker/common/spoof/gen_profiles.py:8-13`
- 输出固定到 `/opt/spoof/profiles/<name>.props`：`android-docker/common/spoof/gen_profiles.py:6,13,41-43`
- 运行时按名称配对皮肤与 props：`android-docker/common/tools/run-emulator-with-profile.sh:35-37`，因此未生成对应 `.props` 的皮肤无法配对。

## 改进目标
- 枚举所有皮肤目录并为每个皮肤生成 `.props`（若 `models.json` 未覆盖则生成通用 props）。
- 保持“同名即配对”的规则，确保每个皮肤都有同名 `.props`。
- 保留并优先使用 `models.json` 的精确厂商/指纹配置。

## 技术方案
- 增加皮肤发现：按以下候选根合并去重（与 API 一致）：
  - `process.cwd()/emulator-configuration/skins`
  - `/opt/app/emulator-configuration/skins`
  - `${ANDROID_HOME}/emulator/skins`
  - 环境变量 `EMULATOR_SKINS_DIR`
- 合并集合：`allNames = union(models.keys(), skinDirs)`，遍历 `allNames` 生成 `.props`。
- 生成策略：
  - 命中 `models[name]` → 使用现有字段写入。
  - 否则派生通用 props：
    - `manufacturer/brand` 推断规则：`pixel|nexus|tv|wearos`→`Google/google`；`Galaxy_*`→`Samsung/samsung`；否则 `Generic/generic`。
    - `model` 为名称转空格并首字母大写；`name/device` 为原始目录名。
    - `build_type/tags/flavor`：`user`/`release-keys`/`<name>-user`。
    - 指纹：`<brand>/<name>/<device>:14/UD1A.fake/000000:user/release-keys`（可后续优化）。
    - `vendor_security_patch` 使用安全默认（如 `2024-09-05`）。
    - 保留现有 ABI/native bridge 行（`gen_profiles.py:29-40`）。
- 名称规范：严格使用皮肤目录名作为 `.props` 文件名，避免大小写/字符变更，以保证配对。
- 健壮性：忽略不可访问目录，跳过空名，去重生成，日志打印生成数量与缺省派生数量。

## 验证与回归
- 生成后检查 `/opt/spoof/profiles` 中的 `.props` 数量应与皮肤目录数一致。
- 通过 `web/pages/api/skins.js` 和 `web/pages/api/profiles.js` 的 GET 列表，确认每个皮肤名都能在 `profiles` 集合中出现，并能命中皮肤缩略图：`web/pages/api/profiles.js:75-81`、`web/pages/api/skins.js:58-61`。
- 使用 `android-docker/common/tools/run-emulator-with-profile.sh` 启动任意皮肤同名配置，确认 `-skin` 与 `-prop` 注入生效：`run-emulator-with-profile.sh:31-37`。

## 代码改动点
- 修改 `android-docker/common/spoof/gen_profiles.py`：
  - 新增皮肤根枚举与目录读取函数（与 `skins.js` 逻辑保持一致）。
  - 计算 `allNames` 并遍历生成 `.props`。
  - 新增 `derive_props(name)` 作为通用派生策略（仅在 `models.json` 缺失时使用）。
  - 输出日志：生成总数、命中 `models.json` 的数量与通用派生数量。
- 可选：支持 `ENV` 开关（如 `SKINS_ROOTS`）以便自定义皮肤根列表。

## 交付结果
- 更新后的生成器一次性为所有皮肤生成 `.props`，前后端与运行脚本无需改动即可实现“全局伪装时配对所有设备”。
- 保持向后兼容：已有 `models.json` 条目完全沿用；新增皮肤获得合理默认值。

请确认以上方案，我将按此实施并提交变更。