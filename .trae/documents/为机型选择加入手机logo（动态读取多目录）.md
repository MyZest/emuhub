## 目标
- 在设备页的机型选择中显示对应手机 logo
- 支持内置机型目录与动态热插拔目录中的 logo 文件，无需重建镜像

## 后端改动
- 扩展 /api/profiles 返回 [{ name, hasLogo }] 并提供 logo 访问接口：
  - 新增 /api/profile-logo/[name]：按顺序查找并返回图片（二进制）：
    1) /data/spoof/profiles/<name>.png|.svg
    2) /opt/spoof/profiles/<name>.png|.svg
  - /api/profiles 中为每个 name 返回 hasLogo: true/false，前端决定是否展示占位图

## 前端改动
- 将机型下拉替换为带图片的可选列表（自定义下拉）：
  - 每项显示：logo 图（src=/api/profile-logo/<name>）+ 文本 name
  - 选中后更新 profile 状态；保留原 select 的值用于提交（或直接由列表点击选中）
- 若 hasLogo=false，显示占位图（内置 assets）

## 约定与使用
- 为某机型添加 logo：将同名图片（<name>.png 或 .svg）放到：
  - 热插拔目录：/data/spoof/profiles/
  - 或内置目录：/opt/spoof/profiles/
- 文件命名与机型名一致，例如 pixel_8_pro.png；前端自动读取

## 验证
- 启动服务后访问 /devices/1，确认机型列表显示 logo
- 为动态机型上传 props 后，将同名 .png 放入挂载的 profiles 目录，刷新能看到新图

## 说明
- 选择使用 API 端点返回图片，避免要求图片必须在 Next 公共目录；更灵活地支持容器内多目录