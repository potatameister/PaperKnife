# ✈️ PaperKnife

**A simple, privacy-first PDF utility.**  
*Runs in your browser. Stays on your device.*

![License](https://img.shields.io/badge/license-AGPL--3.0-rose.svg)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-blue.svg)

---

## 🛡️ Why use this?

Most online PDF tools upload your files to their servers. That means your bank statements, contracts, or IDs are being sent to someone else's computer.

**PaperKnife is different.** Everything happens right on your device. Whether you're using the website or the Android app, your PDF files never leave your memory. You can even use it while offline.

### Key Features
*   **Merge & Split:** Combine documents or pick specific pages.
*   **Compress:** Shrink file sizes without sending them to the cloud.
*   **Security:** Password protect or unlock your PDFs locally.
*   **Convert:** Turn PDFs into images or text, and vice versa.
*   **Edit:** Add page numbers, watermarks, or rotate pages.

## 📱 How to use it

### On Android
You can download the latest APK from the [Releases](https://github.com/potatameister/PaperKnife/releases/latest) page. It's built to be fast, thumb-friendly, and works completely offline.

### On the Web
Just visit the [live site](https://potatameister.github.io/PaperKnife/). It works in any modern browser and can be installed as a PWA (web app).

---

## ❤️ Support the project

I'm building PaperKnife as an open-source tool because I believe privacy shouldn't be a premium feature. It's self-funded and has no ads or tracking.

If you find it useful, please consider:
*   **Sponsoring:** You can support the development via [GitHub Sponsors](https://github.com/sponsors/potatameister).
*   **Sharing:** Tell your friends about a safer way to handle their PDFs.
*   **Contributing:** If you're a developer, feel free to report bugs or submit improvements.

---

## 🛠️ How it's built

PaperKnife uses **React** and **TypeScript**. The heavy lifting is done by **pdf-lib** and **pdfjs-dist**, which run in your browser using WebAssembly. For the Android version, we use **Capacitor** to bring the same local engine to your phone.

### License
This project is licensed under the **GNU AGPL v3**. This ensures the project remains transparent and open. If you host a version of this tool, you must share the code with your users.

---
*Made with care by [potatameister](https://github.com/potatameister)*