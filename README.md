# 求职匠 · 发布

**AI 私人求职顾问**（桌面 App，macOS / Windows）。这个仓库只放安装包和自动更新清单 —— 源码不在这里。

## 下载

- [打开求职匠下载页](https://jobhunter-ai.github.io/jobhunter-releases/)
- [查看全部 Releases](../../releases)

下载页读取 GitHub 正式 Latest 版本：有 `.dmg` 才开放 macOS 按钮，有 `.exe` 才开放 Windows 按钮。历史版本和内测版请到 Releases 查看。

## 装完第一次打开

macOS 会提示「无法验证开发者」——因为这个版本**还没做代码签名和公证**。
右键点 App → 打开 → 再点一次「打开」即可。本版沿用此前的安装包发行方式。

Windows 可能显示 Microsoft Defender SmartScreen。确认下载来源是本仓库后，点「更多信息」→「仍要运行」。

## 自动更新

App 每次启动会静默查一次更新，装好后提示重启，**不会自动重启**打断你正在跑的任务。
更新包必须通过签名校验才装得上——伪造的包装不进来。

## 你的数据在哪

全部在你自己电脑的 `~/求职匠/` 下（目录权限 0700，同机其他账号读不到），
**我们的服务器一个字节也收不到**。

一件要说清楚的事：生成简历时，内容会送进**你自己装的 AI 引擎**（Claude Code），
也就是会到 Anthropic 那边——走你自己的账号和订阅，不经过我们。
介意的话，别把不想让任何模型看到的东西写进资料库。

## 已知限制

- 未签名未公证（首次打开要右键 → 打开）
- 当前可用平台与架构以[下载页](https://jobhunter-ai.github.io/jobhunter-releases/)显示为准
- 需要本机装 [Claude Code](https://claude.com/claude-code) 才能生成简历
