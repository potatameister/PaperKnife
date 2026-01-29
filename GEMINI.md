# 🧠 GEMINI.md - The PaperKnife "Chameleon" Brain

## 🛡️ 1. Privacy Protocol (THE GOLDEN RULE)
* **Zero-Server Architecture:** PaperKnife is 100% client-side. No PDF data ever leaves the device.
* **No Analytics/Telemetry:** The app must never include tracking scripts or external pings.
* **Local Processing:** All PDF manipulation (Merging, Splitting, Compression) is performed via `pdf-lib` in the browser's memory or the APK's WebView.
* **Data Persistence:** If the user "saves" progress, it must be stored in the browser's `IndexedDB` or `LocalStorage`, never a cloud database.

## 🎭 2. Chameleon Mode & Previews
* **One Codebase, Two Souls:**
    * **Web View:** A "Bento Grid" dashboard. High-density information, desktop-optimized. Hosted on GitHub Pages.
    * **Android View:** A "Native-Style" app. Bottom navigation bar, thumb-friendly buttons, full-screen focus. Built as an APK.
* **Live Simulation:** The project includes a `viewMode` state (`web` | `android`). 
    * In `npm run dev`, a floating toggle allows switching views instantly to test the "Chameleon" shift.

## 🚀 3. Final Products & Deployment
1.  **Web Version:** Built via Vite and auto-pushed to the `gh-pages` branch on GitHub.
2.  **Android APK:** Wrapped via Capacitor. The APK is compiled using GitHub Actions (`create-android.yml`) so the user can download it from GitHub "Releases."

## 📈 4. Evolution Log (Milestones Only)
*Instruction: Gemini must append a brief line here only when a major feature is completed. Do not log small fixes.*

- **[2026-01-29]:** Initialized project in Termux Root. Setup React + Vite + Tailwind.
- **[2026-01-29]:** Defined "Privacy Protocol" and "Chameleon Mode" in GEMINI.md.
- **[2026-01-29]:** Implemented Chameleon Mode (Web/Android views) and Dark/Light theme engine with persistence.
- **[2026-01-29]:** Revamped UI with Rose (#F43F5E) accent and custom PaperKnife airplane logo.
