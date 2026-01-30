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
    * In `npm run dev`, a floating toggle (bottom-right) allows switching views instantly to test the "Chameleon" shift. This toggle is protected by `import.meta.env.DEV` and is invisible in production.

## 🚀 3. Final Products & Deployment
1.  **Web Version:** Built via Vite and auto-pushed to the `gh-pages` branch on GitHub via `.github/workflows/deploy.yml`.
2.  **Android APK:** Wrapped via Capacitor. The APK is compiled using GitHub Actions (`create-android.yml`) so the user can download it from GitHub "Releases."

## 📈 4. Evolution Log (Milestones Only)
*Instruction: Gemini must append a brief line here only when a major feature is completed. Do not log small fixes.*

- **[2026-01-29]:** Initialized project in Termux Root. Setup React + Vite + Tailwind.
- **[2026-01-29]:** Defined "Privacy Protocol" and "Chameleon Mode" in GEMINI.md.
- **[2026-01-29]:** Implemented Chameleon Mode (Web/Android views) and Dark/Light theme engine with persistence.
- **[2026-01-29]:** Revamped UI with Rose (#F43F5E) accent and custom PaperKnife airplane logo.
- **[2026-01-29]:** Optimized performance with Code Splitting (React.lazy) and integrated Plus Jakarta Sans typography.
- **[2026-01-29]:** Automated GitHub Pages deployment and sanitized repository tracking (removed node_modules/dist).
- **[2026-01-30]:** Migrated to React Router for SEO and unique URLs (e.g., /merge, /about).
- **[2026-01-30]:** Implemented functional Merge PDF tool with local processing via `pdf-lib`.
- **[2026-01-30]:** Added advanced Merge features: PDF thumbnails (pdfjs-dist) and drag-and-drop reordering (@dnd-kit).
- **[2026-01-30]:** Refined UI/UX: Minimalist branding, mobile optimization, and seamless theme transitions.

## 🏗️ 5. Architectural Notes
*   **Routing:** Uses `react-router-dom` with a `/PaperKnife/` basename for GitHub Pages compatibility.
*   **PDF Core:** `pdf-lib` handles all manipulation (creation, copying pages, merging).
*   **PDF Rendering:** `pdfjs-dist` (v5+) used for thumbnail generation via local worker URL.
*   **UI Components:** 
    *   `Logo.tsx`: Centralized brand logo to prevent circular dependencies.
    *   `WebView.tsx`: Main Bento Dashboard.
    *   `AndroidView.tsx`: Mobile-first dashboard with bottom nav.
    *   `tools/`: Directory for individual tool implementations.
*   **State Management:** Local React state + localStorage for persistence (Theme).
*   **Transitions:** GPU-accelerated CSS transforms for page slides and theme fading.
