## 目标
- 仅保留根目录 Dockerfile 作为唯一构建入口，避免维护者混淆
- 将 android-docker 目录标注为“镜像资源（脚本/许可证/伪装配置）”，不再是可独立构建的镜像

## 拟做改动
- 删除以下文件：
  - android-docker/android28/Dockerfile
  - android-docker/android29/Dockerfile
  - android-docker/android30/Dockerfile
  - android-docker/android31/Dockerfile
  - android-docker/android32/Dockerfile
  - android-docker/android33/Dockerfile
  - android-docker/android34/Dockerfile
- 新增说明文件：android-docker/README.md
  - 说明该目录仅存放 SDK 安装脚本、许可证、伪装生成器资源；构建入口为项目根 Dockerfile
- 更新根 README（Architecture/Getting Started）
  - 强调“单镜像构建与运行”的流程；注明 android-docker 目录非独立构建

## 不改动的内容
- 保留 android-docker/android34/tools、licenses、common/spoof 等资源供根 Dockerfile COPY
- 保留根 Dockerfile 现有逻辑（EXPOSE/ENV/CMD）与脚本路径

## 结果
- 维护者打开仓库只看到一个构建入口（根 Dockerfile）
- 资源目录含义清晰，后续扩展机型或脚本不影响构建入口

如确认，我将删除上述 Dockerfile 文件，添加说明，并同步 README 架构章节。