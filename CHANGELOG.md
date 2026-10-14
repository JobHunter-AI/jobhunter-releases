# Changelog

## 2026-10-14

- 新增 macOS 0.6.32 签名发行说明，App 与 DMG 双公证通过；按 owner 的本轮授权先发行 macOS，保留 Windows 0.6.0 下载和旧版本记录。

## 2026-10-09

- 撤回 Mac 单平台 0.6.7 的正式标记并恢复 0.6.0 Latest，保留安装包和发布记录，恢复双平台统一正式发布规则。

- 支持按平台提供下载，Mac 独立发布时保留 Windows 既有 0.6.0 下载，修正签名、公证与自动更新说明。

## 2026-10-14 · 官方下载域名

- 接入 jobhunter.jracademy.ai：Route 53 CNAME 指向 GitHub Pages，下载页声明官方 canonical，部署同步 CNAME。发行安装包与签名更新清单沿用同一官方二进制仓。
- 完成 GitHub Pages 证书签发、强制 HTTPS 和浏览器验收：新域名 HTTPS 返回 200，旧 Pages 地址 301 跳转，Mac 下载指向已核验的 0.6.32 正式安装包。
