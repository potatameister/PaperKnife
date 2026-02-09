# ✈️ PaperKnife

**The Swiss Army Knife for PDFs.**  
*100% Client-Side. Zero Servers. Absolute Privacy.*

![License](https://img.shields.io/badge/license-AGPL--3.0-rose.svg)
![Privacy](https://img.shields.io/badge/Privacy-100%25-green.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

---

## 🛡️ Why PaperKnife?

Most PDF tools upload your sensitive documents to a cloud server to process them. This means your bank statements, contracts, and medical records leave your device.

**PaperKnife is different.**
It runs entirely in your browser using WebAssembly. Your files **never** leave your device's memory. You can even turn off your Wi-Fi and use it offline.

## ✨ Features

PaperKnife includes 9 professional-grade tools:

| Tool | Description | Status |
| :--- | :--- | :--- |
| **Merge PDF** | Combine multiple files into one document. | ✅ Ready |
| **Split PDF** | Visually extract specific pages or ranges. | ✅ Ready |
| **Compress PDF** | Optimize file size for sharing (High/Med/Low). | ✅ Ready |
| **Repair PDF** | Attempt to fix corrupted or unreadable files. | ✅ Ready |
| **Image to PDF** | Convert images (JPG/PNG) into a professional PDF. | ✅ Ready |
| **PDF to Image** | Convert pages to high-quality JPG/PNG (ZIP). | ✅ Ready |
| **Signature** | Add your electronic signature securely. | ✅ Ready |
| **Protect PDF** | Encrypt documents with strong passwords. | ✅ Ready |
| **Unlock PDF** | Remove passwords from protected files. | ✅ Ready |
| **Rotate PDF** | Fix page orientation permanently. | ✅ Ready |
| **Watermark** | Overlay custom text for branding/security. | ✅ Ready |
| **Page Numbers** | Automatically add custom numbering. | ✅ Ready |
| **Metadata** | Edit Title, Author, Keywords for privacy. | ✅ Ready |
| **Rearrange** | Drag and drop pages to reorder them. | ✅ Ready |
| **PDF to Text** | Extract plain text for editing. | ✅ Ready |

## 🎭 Chameleon Mode

PaperKnife features a unique "Chameleon" architecture that adapts its entire UI paradigm based on the device:

*   **Web View (Bento Grid):** A desktop-optimized dashboard for high productivity.
*   **Android View (Native):** A thumb-friendly, mobile-first interface that feels like a native app.

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/potatameister/PaperKnife.git
    cd PaperKnife
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173/PaperKnife/` in your browser.

### Building for Production

**Web (PWA):**
```bash
npm run build
# Output is in /dist
```

**Android (APK):**
PaperKnife uses Capacitor to wrap the web app.
```bash
npm run build
npx cap sync
npx cap open android
```

## 🛠️ Tech Stack

*   **Core:** React 18, Vite, TypeScript
*   **PDF Engine:** `pdf-lib` (Manipulation), `pdfjs-dist` (Rendering)
*   **UI:** Tailwind CSS, Lucide React, Framer Motion (via CSS animations)
*   **PWA:** `vite-plugin-pwa`
*   **Mobile:** Capacitor

## 🔒 Privacy Protocol

*   **Zero-Server Architecture:** No backend API.
*   **No Analytics:** No Google Analytics or tracking scripts.
*   **Local Processing:** All logic executes in the browser's Main Thread or Web Workers.

## 📄 License

This project is licensed under the **GNU Affero General Public License v3 (AGPL v3)**. 

PaperKnife is a privacy-first utility. To ensure the integrity and transparency of all versions of this software, any modified versions hosted on a network must provide a link to their source code.

---
*Built with ❤️ by [potatameister](https://github.com/potatameister)*
