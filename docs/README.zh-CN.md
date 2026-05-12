<p align="center">
  <img src="public/icons/logo-github.svg" width="120" alt="PaperKnife Logo">
</p>

# PaperKnife

**一个简单、诚实、尊重隐私的 PDF 工具。**

[![License](https://img.shields.io/badge/license-AGPL--3.0-rose.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/potatameister/PaperKnife?style=flat&color=rose)](https://github.com/potatameister/PaperKnife/stargazers)
[![Web App](https://img.shields.io/badge/web-live-emerald.svg)](https://potatameister.github.io/PaperKnife/)
[![Android App](https://img.shields.io/badge/android-apk-blue.svg)](https://github.com/potatameister/PaperKnife/releases/latest)
[![Twitter](https://img.shields.io/badge/twitter-@potatameister-black?logo=x)](https://x.com/potatameister)

---

## 预览

<p align="center">
  <img src="assets/preview/screenshot1.jpg" width="45%" alt="网页端">
  <img src="assets/preview/screenshot2.jpg" width="45%" alt="Android 端">
</p>

---

### 为什么要做这个

大多数 PDF 网站要求你将敏感文件——银行账单、身份证件、合同——上传到它们的服务器。即使它们承诺会删除，你的数据也已经离开了你的设备，穿行在互联网上。

我做 **PaperKnife** 就是为了解决这个问题。这是一套完全在浏览器或手机上运行的工具集合。你的文件永远不会离开你的内存，不会存储在任何数据库中，也没有任何服务器能看到它们。它 100% 离线运行。

### 它能做什么

*   **编辑：** 合并多个文件、拆分页面、旋转和重新排列。
*   **优化：** 通过不同的质量预设减小文件体积。
*   **加密：** 为文件添加密码保护或在本地移除密码。
*   **转换：** 在 PDF 与图片（JPG/PNG）或纯文本之间互相转换。
*   **签名：** 安全地为文档添加电子签名。
*   **清理：** 深度清除元数据（如作者或生成工具信息），保护文件的匿名性。

### 如何使用

*   **Android 端：** 下载[最新 APK](https://github.com/potatameister/PaperKnife/releases/latest) 或从以下渠道获取：

[<img src="https://gitlab.com/IzzyOnDroid/repo/-/raw/master/assets/IzzyOnDroidButtonGreyBorder_nofont.png" height="80" alt="在 IzzyOnDroid 获取">](https://apt.izzysoft.de/packages/com.paperknife.app)

*   **网页端：** 访问[在线站点](https://potatameister.github.io/PaperKnife/)。你可以像使用普通网站一样使用它，也可以将其"安装"为 PWA 以实现离线访问。

---

### 支持这个项目

PaperKnife 是一个独立项目。它开源、无广告、无追踪，因为我相信隐私是一项权利，而非特权。

如果这个工具帮你节省了时间或保护了你的数据安全，请考虑：
*   **赞助：** 通过 [GitHub Sponsors](https://github.com/sponsors/potatameister) 支持开发。
*   **点个 Star：** 这有助于更多人发现这个项目。
*   **分享传播：** 把它推荐给任何需要处理敏感文件的人。

---

### 技术细节

PaperKnife 使用 **React** 和 **TypeScript** 构建。核心处理由 **pdf-lib** 和 **pdfjs-dist** 完成，运行在基于 WebAssembly 的沙盒环境中。Android 版本基于 **Capacitor** 实现。

本项目采用 **GNU AGPL v3** 许可证，以确保它永远保持开源和透明。

---
*由 [potatameister](https://github.com/potatameister) 用心制作*
