<p align="center">
  <img src="public/icons/logo-github.svg" width="80" alt="PaperKnife Logo">
</p>

# 🧠 GEMINI.md - The PaperKnife "Chameleon" Brain

> [!IMPORTANT]
> **CRITICAL MAINTENANCE PROTOCOL:** 
> 1. DONT ADD UNLESS ITS SOMETHING IMPORTANT OR WOULD BE USEFUL FOR THE FUTURE YOU. 
> 2. THINK TWICE BEFORE REMOVING/REPLACING INFO; YOU MIGHT DELETE IMPORTANT DATA.
> 3. NEVER use `grep` via `run_shell_command`. Always use the provided `search_file_content` tool for searching code.

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
- **[2026-01-29]:** Implemented Chameleon Mode (Web/Android views) and Dark/Light theme engine with persistence.
- **[2026-01-29]:** Revamped UI with Rose (#F43F5E) accent and custom PaperKnife airplane logo.
- **[2026-01-30]:** Migrated to React Router for SEO and unique URLs (e.g., /merge, /about).
- [2026-01-30]: Implemented functional Merge PDF tool with local processing via `pdf-lib`.
- [2026-01-31]: Implemented Visual Splitter (Split PDF) with support for single-file extraction and individual-page ZIP export.
- [2026-01-31]: Added functional client-side encryption to Protect PDF tool using `@pdfsmaller/pdf-encrypt-lite`.
- [2026-01-31]: Added Compress PDF tool with multi-level quality presets (Low, Medium, High).
- [2026-01-31]: Resolved critical `pdf-lib` encryption loading bug with "Last Resort" retry strategy.
- [2026-02-01]: Completed implementation of all 15 professional tools (Signature, Repair, Metadata, etc.).
- [2026-02-01]: Standardized UI with shared components (`ToolHeader`, `SuccessState`, `PrivacyBadge`) and `sonner` toasts.
- [2026-02-01]: Implemented Dashboard 2.0: Category-based bento colors, tool search, recent activity history, and global "Quick Drop" zone.
- [2026-02-01]: Integrated Web Workers (`pdfWorker.ts`) for non-blocking background PDF merging.
- [2026-02-01]: Refined PDF Preview quality using `devicePixelRatio` and high-quality rendering scale.
- **[2026-02-02]:** Integrated PWA support, Tool Pipelines, and Batch Processing capabilities.
- **[2026-02-02]:** Redesigned "About" page as a professional Technical Specification Protocol.
- **[2026-02-02]:** Reverted custom theme engine and Supporter Keys. Standardized on clean Light/Dark modes with trademark Rose accents.
- **[2026-02-06]:** Implemented Direct Tool Drop (Dashboard), Smart Pipeline Chaining, and Visual Quality Comparison slider.
- **[2026-02-06]:** Integrated Workspace Persistence (Privacy Vault), Background Web Workers (Multi-threading), and Privacy Deep Clean sanitizer. Added refined Micro-Interactions and Offline status indicators.
- **[2026-02-06]:** Refined Android View to Material Design 3 standards: Collapsing large headers, category chips, touch-optimized list items, and native navigation patterns (FAB, back buttons).
- **[2026-02-06]:** Finalized Android APK UI with a pro-grade 5-tab bottom navigation (Home, Tools, Process FAB, History, Privacy) and dedicated sub-views for a truly native multi-activity feel.
- **[2026-02-07]:** Set up automated GitHub Actions workflow for building and signing production APKs. Updated project version to v0.5.0-beta.
- **[2026-02-07]:** Implemented dedicated "Special Thanks" page with acknowledgments for Termux, OpenCode, and Gemini CLI. Integrated links across Web and Android views.
- **[2026-02-08]:** Migrated from MIT to GPL v3 license to prevent proprietary forks and clones.
- **[2026-02-08]:** Implemented "Titan" Android UI overhaul: Compact headers, grounded navigation, and Smart Quick-Pick FAB.
- **[2026-02-08]:** Integrated Capacitor Haptics for tactile feedback and implemented a native Pro-Grade Settings Dashboard with system theme and auto-wipe persistence.
- **[2026-02-08]:** Comprehensive "Titan" UI refinement: Fixed settings toggles, history UI, drag-and-drop, global pipeline handoff, and resolved multiple Android layout overlaps. Resolved 10+ build-time TypeScript errors regarding unused variables and structural integrity.
- **[2026-02-09]:** Major Milestone: v1.0.0-beta. Overhauled Home and About pages for professional-grade "Titan" aesthetic. Migrated to static imports for all core tools and views to eliminate "Failed to fetch" dynamic import errors on Android. Implemented pipeline file-type validation (PDF vs ZIP) and enhanced the Quick-Pick FAB with full colorized catalog access.
- **[2026-02-09]:** Upgraded to **GNU AGPL v3** license to close the "Web Loophole" and ensure absolute transparency for both Web and Android versions.
- **[2026-02-09]:** Finalized v1.0.0-beta "Titan" Release: Implemented high-density compact UI, theme-aware dynamic icons, and a humanized About specification. Perfected the "Deep Clean" metadata protocol (purging Producer/Creator/XMP). Integrated an airtight internal PDF Preview system triggered directly from task completion states. Solidified legal protection with AGPL v3 headers in all core source files.
- **[2026-02-10]:** Humanized "Titan" UI Phase: Redesigned Home and About heros for high-impact professional messaging ("Stop Uploading Your Privacy"). Implemented a high-density "Bento" footer for Web. Standardized Lucide icon aliasing (GHIcon, HeartIcon) to prevent global namespace collisions. Re-integrated tool-level privacy badges for on-device processing assurance.
- **[2026-02-10]:** Implemented Simplified Bug Reporting: Added direct links to the GitHub Issues tracker in both Settings and About pages for community-driven bug tracking and feedback.
- **[2026-02-10]:** Differentiated "About" Experience: Created a high-density "Technical Specification" landing page for Web version and preserved the thumb-friendly Material Design view for the Android APK.
- **[2026-02-10]:** Implemented High-Fidelity Lazy Rendering (1200px) in PDF Preview and optimized Grid Thumbnails for large-scale document handling (200+ pages). Standardized background-aware Branding Protocol and refined Core Engine subtitles for APK Home. Resolved multiple `ReferenceError` bugs and header cropping issues.
- **[2026-02-10]:** Official v1.0.0 "Titan" Stable Release. Finalized all versioning across Web and APK distributions.
- **[2026-02-10]:** Polished "Titan" UI Evolution: Comprehensive overhaul of About, Settings, and Privacy pages with high-density technical specifications. Fixed critical APK bug in file selection logic and refined Home View with History Clipboard and Secure Status indicators. Standardized internal asset naming and optimized memory usage for 100+ page documents.
- **[2026-02-11]:** Finalized "Titan" UI Polish: Overhauled PDF Preview with Immersion Mode and floating page tracking. Redesigned web version into a modern SaaS-style multi-column footer. Implemented intelligent "GET APK" CTAs for mobile web users. Refined APK branding with "Secure Engine" Rose accents and pulsing indicators. Completed global README overhaul for dual-platform focus.
- **[2026-02-11]:** Humanized Branding & Stability: Simplified README to use honest, human language and removed gimmicky branding. Integrated GitHub Sponsors via FUNDING.yml. Fixed critical isNative ReferenceError in AndroidView. Added social badges and direct support call-to-actions to the project homepage.
- **[2026-02-11]:** F-Droid Ready: Removed proprietary Google Play Services logic from Gradle, implemented Fastlane metadata structure, and created an AGPL-compliant `fdroid.yml` build recipe for community-driven inclusion.
- **[2026-02-11]:** Official v1.0.0 Stable Release: Finalized all versioning, metadata, and production assets. Submitted to F-Droid and IzzyOnDroid. Implemented professional "Dark Engineering" branding and high-res social preview generators. Ready for community-driven growth.
- **[2026-02-12]:** Official v1.0.1 Maintenance Release: Addressed IzzyOnDroid feedback for repository inclusion. Hardened "Zero-Server" architecture by removing all network permissions (INTERNET). Standardized Fastlane metadata, optimized store descriptions, and updated the icon for better visibility and compliance. Updated technical credits to acknowledge upstream engines (PDF.js, Tesseract.js).

## 🏗️ 5. Architectural Notes
*   **Chameleon Engine:** Uses `viewMode` state in `App.tsx` to hot-swap between `WebView.tsx` and `AndroidView.tsx`.
*   **Routing:** Uses `react-router-dom` with a `/PaperKnife/` basename for GitHub Pages compatibility.
*   **PDF Core:** `pdf-lib` handles all manipulation. **Note:** Always use the `degrees()` helper for rotation.
*   **Background Workers:** Use `src/utils/pdfWorker.ts` for CPU-intensive PDF tasks to keep the UI responsive.
*   **UI Components:** 
    *   `src/components/tools/shared/`: Centralized Tool UI components.
    *   `src/utils/pdfHelpers.ts`: High-level wrappers for pdf-lib and pdfjs-dist.
*   **State Management:** IndexedDB (via `recentActivity.ts`) stores the last 10 processed file metadata locally.

## 🧱 6. Tool Development Checklist (For Future Gemini)
*   **Base Layout:** Wrap tools in `<div className="flex-1">` and use `<main className="max-w-4xl mx-auto px-6 py-6 md:py-10">`.
*   **Shared UI:** Use `<ToolHeader>`, `<SuccessState>`, and `<PrivacyBadge>` in every tool.
*   **Toasts:** Use `toast` from `sonner` instead of standard alerts.
*   **Security:** If a tool processes a locked file, display a "Security Note" (amber box) regarding unprotected output.

## 🛠️ 7. Technical Quirks (CRITICAL)
*   **pdf-lib Encryption Bug:** Use a `try/catch` retry pattern. If the first load fails, retry with `{ password, ignoreEncryption: true }`.
*   **PDF.js Worker:** Import via: `import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`.
*   **CMap Paths:** Always point `cMapUrl` to `/PaperKnife/cmaps/` for local font support.

## ⚠️ 8. Critical Dev Notes (Maintenance)
*   **TypeScript Strictness:** Project uses `--max-warnings 0`. Unused imports or props WILL break the build.
*   **Rollup Chunking:** `vite.config.ts` uses `manualChunks` to split `pdf-lib` and `pdfjs-dist`.
*   **Worker URL:** Always use `new URL('../../utils/pdfWorker.ts', import.meta.url)` for worker instantiation in Vite.

---
**Current Goal:** Maintenance of v1.0.0 and gathering community feedback for the final v1.1 evolution.
