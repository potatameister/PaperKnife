# ✈️ PaperKnife

**The Privacy-First PDF Engine.**  
*Android First. Zero-Server Web. Absolute Sovereignty.*

![License](https://img.shields.io/badge/license-AGPL--3.0-rose.svg)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-blue.svg)
![Status](https://img.shields.io/badge/Titan%20Engine-v1.0.0-success.svg)

---

## 🛡️ The "Titan" Protocol

PaperKnife is not just another PDF tool. It is a **Zero-Server Document Engine** built for the era of surveillance.

Most free PDF tools upload your bank statements and contracts to a cloud server. **PaperKnife rejects this trade-off.**
We have engineered a high-performance manipulation engine that runs 100% on your device's CPU (via WebAssembly).

*   **Android First:** A native-feeling, touch-optimized experience available as a high-performance APK.
*   **Zero-Server Web:** A fully functional PWA that runs offline in any modern browser.
*   **Deep Privacy:** Your files **never** leave your device's RAM. We don't even have a database.

## ⚡ Titan UI Engine

PaperKnife v1.0 features the **"Titan" Design System**—a high-density, professional interface that adapts to your environment:

*   **Command Center (Android):** A thumb-friendly, bottom-heavy interface with "History Clipboard" and "Smart Quick-Pick" for rapid mobile workflows.
*   **Bento Dashboard (Web):** A spacious, grid-based layout optimized for desktop productivity and drag-and-drop actions.
*   **Immersion Preview:** A high-fidelity, distortion-free PDF viewer with "Night Vision" and auto-hiding controls.

## 🛠️ Core Capabilities

| Engine Module | Description |
| :--- | :--- |
| **Modification** | Merge, Split, Rotate, Rearrange, Page Numbers. |
| **Optimization** | Intelligent Compression (High/Standard/Smallest), Repair. |
| **Security** | AES-256 Encryption (Protect), Password Removal (Unlock). |
| **Conversion** | PDF to Image (High-Res), Image to PDF, PDF to Text. |
| **Studio** | Watermarking, Metadata Editing, Digital Signatures. |

## 🚀 Getting Started

### Download for Android
Get the latest **Titan APK** from the [Releases Page](https://github.com/potatameister/PaperKnife/releases/latest).

### Run on Web
Visit the official instance (or self-host it):
[**Launch PaperKnife Web**](https://potatameister.github.io/PaperKnife/)

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/potatameister/PaperKnife.git
    cd PaperKnife
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Ignite the Engine:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173/PaperKnife/` to see the Chameleon engine in action.

## 🏗️ Tech Stack

*   **Core:** React 18, Vite, TypeScript
*   **Engine:** `pdf-lib` (WASM), `pdfjs-dist` (Rendering)
*   **Native Wrapper:** Capacitor (Android)
*   **Architecture:** Zero-Server, 100% Client-Side

## 📄 License

This project is protected by the **GNU Affero General Public License v3 (AGPL v3)**. 

### The "Web Loophole" is Closed.
We chose AGPL v3 to guarantee user freedom. If you deploy a modified version of PaperKnife over a network (e.g., as a website), you **must** provide the source code to your users. This ensures PaperKnife can never be turned into a proprietary, privacy-invading "black box" service.

---
*Handcrafted with ❤️ by [potatameister](https://github.com/potatameister)*
