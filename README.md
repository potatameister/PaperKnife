<p align="center">
  <img src="public/icons/logo-github.svg" width="120" alt="PaperKnife Logo">
</p>

# PaperKnife

A privacy-first PDF utility: merge, compress, sign, and protect. Works 100% offline — no servers, no trackers.

[![Download APK](https://img.shields.io/badge/download-APK-green)](https://github.com/potatameister/PaperKnife/releases/latest)
[![Web App](https://img.shields.io/badge/web-live-emerald)](https://potatameister.github.io/PaperKnife/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-rose)](LICENSE)

---

## Screenshots

<p align="center">
  <img src="assets/preview/screenshot1.jpg" width="45%" alt="Web View">
  <img src="assets/preview/screenshot2.jpg" width="45%" alt="Android View">
</p>

---

## Features

- Merge & split PDFs
- Compress with quality presets
- Password protect and unlock PDFs
- Convert PDF pages to images (JPG/PNG, 72–300 DPI)
- Draw, upload, and reuse signatures
- Watermarks, page numbers, metadata cleaning
- Deep OCR text extraction (full version only)
- And more!

All processing happens on your device. Your files never leave your phone.

---

## Download

Get the latest APK: [PaperKnife v1.1.0](https://github.com/potatameister/PaperKnife/releases/latest)

- **Full** (GitHub releases): everything, including offline OCR.
- **Lite** (IzzyOnDroid): same app without the OCR engine — smaller download.

[<img src="https://gitlab.com/IzzyOnDroid/repo/-/raw/master/assets/IzzyOnDroidButtonGreyBorder_nofont.png" height="80" alt="Get it at IzzyOnDroid">](https://apt.izzysoft.de/packages/com.paperknife.app)

Or use the [live site](https://potatameister.github.io/PaperKnife/) — installable as a PWA for offline access.

---

## Run the web version locally

[![Launch on PicoRunner](https://picorunner.com/badges/launch.svg)](https://picorunner.com/launch/?repository=https%3A%2F%2Fgithub.com%2Fpotatameister%2FPaperKnife)

Requirements: **Node.js 22+** and `git`. Everything below runs on your own machine.

```bash
git clone https://github.com/potatameister/PaperKnife.git
cd PaperKnife
npm ci                  # install dependencies (also used by CI)
npm run vendor:ocr      # optional, only needed for Deep OCR (one-time)
npm run dev             # start the local server (http://localhost:3000)
```

Notes:
*   `npm run vendor:ocr` is **optional** — skip it and everything works except Deep OCR. The engine files (~30 MB) are never committed to git, so a fresh clone cannot do OCR until you run it. Re-running later is safe — it skips what is already there.
*   `npm run build` produces a static `dist/` folder you can serve with any static host (`npm run preview` to check it locally). No server component exists — it is plain files.
*   To build the Android APK yourself, you additionally need JDK 21 + Android SDK, then `npx cap sync android` after `npm run build`. The OCR files (if vendored) are bundled into the full APK automatically.

---

## Support

[![Sponsor](https://img.shields.io/badge/Sponsor-potatameister-red?style=for-the-badge&logo=github-sponsors)](https://potatameister.github.io/support)

PaperKnife is a solo project — open-source, ad-free, and tracker-free. All support options live on the [support page](https://potatameister.github.io/support). If it saved you time or kept your data safe: chip in, star the repo, or share it with anyone who handles sensitive documents.

---

## License

GNU AGPL v3 — free forever, auditable by anyone.

---

*Made with care by [potatameister](https://github.com/potatameister)*
