# AI Canvas Studio

一个本地无线画布工具，支持文生图、图生图、文生视频、图生视频等节点工作流。

## 使用前配置

仓库不会保存个人 API Key。首次使用时可以复制示例配置：

```powershell
Copy-Item config.example.json config.json
```

然后打开网页里的“设置”，填写自己的 API Key：

- `Maas / Seedance2`：用于文生视频、图生视频
- `Banana`：用于生图
- `Image2`：用于生图

也可以直接编辑 `config.json`，把对应服务的 `apiKey` 填成自己的 key。

## 启动

```powershell
./run_canvas.ps1
```

或双击 `打开AI画布.bat`。

## 注意

`config.json`、上传素材、生成结果、临时密钥和日志已加入 `.gitignore`，不要把自己的 key 提交到 GitHub。
