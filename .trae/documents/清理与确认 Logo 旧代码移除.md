## 检查结论
- 旧的仅查 `/opt/data` 下 PNG/SVG 的逻辑已在两个接口中更新：
  - `web/pages/api/profiles.js:29-67`：`hasLogo(name)` 扩展到 `EMULATOR_SKINS_DIR`、`${ANDROID_HOME}/emulator/skins` 与 `user-configuration/images`，并加入模糊匹配
  - `web/pages/api/profile-logo/[name].js:1-56`：按同样候选路径查找，并支持 `png/svg/webp/jpeg`
- 前端仅通过 `/api/profile-logo/<name>` 加载图片：`web/pages/devices/[id].jsx:89`，未直接依赖旧路径
- 代码库中未发现其他使用旧 logo 路径的接口或工具函数（检索 `profile-logo|hasLogo|spoof/profiles|user-configuration/images|emulator-configuration/skins`）
- 容器构建已复制用户图片目录：`Dockerfile:47` `COPY user-configuration /opt/app/user-configuration`

## 后续动作（如需要）
- 无需删除额外文件；若你希望进一步简化，可将 `hasLogo` 的直连 `spoof/profiles` 路径保留或移除之一，但当前仍有用户自定义 logo 放置到该目录的可能，建议保留。

## 结论
- 旧的无用 logo 代码已移除或覆盖；当前实现统一从新路径集合加载。若确认无需继续清理，我将不做更多更改。