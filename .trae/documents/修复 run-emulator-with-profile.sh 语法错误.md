## 问题定位
- 文件 `android-docker/common/tools/run-emulator-with-profile.sh` 在第10行存在语法错误：`if [ ! -f "$PROP_FILE" ]; then` 的结束标记误写为 `}`，应为 `fi`。
- 该错误会导致 Bash 解析失败（例如 `bash: syntax error near unexpected token '}'`）。

## 修改内容
- 将第10行 `}` 更正为 `fi`，不改变任何其他逻辑与行为。
- 保持已有的数组与参数拼接（`ARGS`、`PROP_ARGS`）与变量默认值（`PROFILE`、`API` 等）不变。

## 验证步骤
- 语法检查：运行 `bash -n android-docker/common/tools/run-emulator-with-profile.sh`，确保无语法错误。
- 静态分析：运行 `shellcheck android-docker/common/tools/run-emulator-with-profile.sh`，观察是否有额外可改进项（不作为本次必改）。
- 运行自测：在具备 `ANDROID_HOME` 与 `avdmanager`、`emulator` 的环境中执行脚本，确认：
  - 当 `profiles/<PROFILE>.props` 存在时，`-prop` 参数生成正常；当不存在时，能正确报错退出。
  - 首次运行时能自动创建 AVD；后续运行检测到已存在不会重复创建。

## 代码片段（更正处）
- 旧：
```
if [ ! -f "$PROP_FILE" ]; then
  echo "profile not found: $PROFILE ($PROP_FILE)" >&2
  exit 1
}
```
- 新：
```
if [ ! -f "$PROP_FILE" ]; then
  echo "profile not found: $PROFILE ($PROP_FILE)" >&2
  exit 1
fi
```

## 回归检查要点
- `set -euo pipefail` 下所有使用的变量均设置了默认值或被明确赋值，避免未绑定变量错误。
- 数组展开 `${ARGS[@]}` 与 `${PROP_ARGS[@]}` 保持原样，确保参数中含有空格或特殊字符时仍能正确传递。

## 交付
- 应用上述单行修复后提交脚本，随后完成语法与运行验证。