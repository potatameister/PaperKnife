<p align="center">
  <img src="public/icons/logo-github.svg" width="80" alt="PaperKnife Logo">
</p>

# 🧠 GEMINI.md - The PaperKnife "Chameleon" Brain

> [!IMPORTANT]
> **CRITICAL MAINTENANCE PROTOCOL:** 
> 1. DONT ADD UNLESS ITS SOMETHING IMPORTANT OR WOULD BE USEFUL FOR THE FUTURE YOU. 
> 2. THINK TWICE BEFORE REMOVING/REPLACING INFO; YOU MIGHT DELETE IMPORTANT DATA.
> 3. NEVER use `grep` via `run_shell_command`. Always use the provided `search_file_content` tool for searching code.
> 4. **RELEASE PROTOCOL:** Gemini must NEVER create git tags or push to origin automatically. The user will handle tagging and pushing manually upon release.
> 5. **STABILITY RULE:** NEVER "Retag" or force-push a tag. If a fix is needed after tagging, bump the version (e.g., v1.0.9 -> v1.0.10).
> 6. **NAMING CONVENTION:** Store-compatible APKs must PERMANENTLY be named `paperknife-lite-vX.X.X.apk`. Full versions are `paperknife-vX.X.X.apk`.
> 7. **GIT PROTOCOL:** Gemini MUST NEVER push to GitHub or any remote repository without explicit user permission.
> 8. **VERSION INTEGRITY:** Before every release, Gemini MUST perform an exhaustive search for the previous version string and update it in ALL UI components, footers, settings, and metadata files.

## 🛡️ 1. Privacy Protocol (THE GOLDEN RULE)
* **Zero-Server Architecture:** PaperKnife is 100% client-side. No PDF data ever leaves the device.
* **No Analytics/Telemetry:** The app must never include tracking scripts or external pings.
* **Hardened Offline Status:** All `http`/`https` intent filters are removed from `AndroidManifest.xml`. The OCR engine (Tesseract) is fully localized.
* **Local Processing:** All PDF manipulation is performed via `pdf-lib` in volatile memory (RAM).

## 🎭 2. Chameleon Mode & Previews
* **One Codebase, Two Souls:**
    * **Web View:** Bento Grid dashboard, desktop-optimized.
    * **Android View:** Native-Style app, Material Design 3 / "Titan" standards. Built as an APK via Capacitor.

## 🚀 3. Final Products & Deployment
1.  **Web Version:** Vite build pushed to `gh-pages`.
2.  **Android APK:** Compiled via GitHub Actions (`android-release.yml`). 
3.  **F-Droid & IzzyOnDroid:** Fully integrated. Metadata in `fastlane/metadata/android/en-US/`. Official YAML recipes in root (`fdroid.yml`, `com.paperknife.app.yml`).

## 📉 4. Manual Release Protocol (IzzyOnDroid / F-Droid)
*Instruction: To trigger an update on stores, follow these manual steps:*
1.  **Bump Version:** Update `package.json` and `android/app/build.gradle` (synchronize `versionName` and `versionCode`).
2.  **Changelog:** Create a new file in `fastlane/metadata/android/en-US/changelogs/` (e.g., `10010.txt`).
3.  **Sync Metadata:** Update `fdroid.yml` and `com.paperknife.app.yml`.
4.  **Local Commit:** Commit all changes locally.
5.  **Manual Tagging:** Run `git tag v1.0.x`.
6.  **Manual Push:** Run `git push origin main --tags`. 
    * *Note: IzzyOnDroid detects the tag automatically. F-Droid also requires a GitHub Release with the signed APK artifact.*

## 📈 5. Evolution Log (Milestones Only)
- **[2026-01-29]:** Initialized project. Setup React + Vite + Tailwind + Chameleon Mode.
- **[2026-02-12]:** Official v1.0.4 Release: Standardized versioning, fixed routing (HashRouter).
- **[2026-02-12]:** Official v1.0.5 Release: Achieved **Verified Reproducible (RB)** status. Implemented Portal architecture.
- **[2026-02-13]:** **Lila Launch:** PaperKnife is officially **LIVE** on the [IzzyOnDroid Repository](https://apt.izzysoft.de/fdroid/index/apk/com.paperknife.app).
- **[2026-02-13]:** Official v1.0.6 Release: Fixed critical OCR 'NetworkError'. Optimized base64 for large files.
- **[2026-02-14]:** Binary Hardening: Removed WASM binaries from source. Implemented CI-fetch strategy for F-Droid compliance.
- **[2026-02-15]:** Official v1.0.8 Release: Implemented **"Two-Tier APK" release strategy** (Global vs Lite). Added **Monochrome Icons**.
- **[2026-02-15]:** Official v1.0.10 Release: **Standardization Milestone.** Locked the `paperknife-lite` naming convention, fixed Material You icon scaling, and perfected store metadata (scandelete/scanignore) for 100% automated store compliance. Established the strict "No-Retag" policy to maintain maintainer trust.

## 🏗️ 6. Architectural Notes
*   **Dual-Build Strategy:** Uses `VITE_DISABLE_OCR`. If true, the OCR tool is hidden for binary-free store compliance.
*   **Artifact Logic:** GitHub Actions produces two signed APKs: `paperknife-vX.apk` (Full) and `paperknife-lite-vX.apk` (Store).
*   **OCR Localization:** Workers and lang data hosted in `public/tesseract/`. Paths MUST use `${window.location.origin}`.

## 🧱 7. Technical Quirks & RB Requirements
*   **Reproducible Builds:** Mandatory settings in `build.gradle`: `shrinkResources false`, `v1SigningEnabled true`, and metadata stripping.
*   **Edge-to-Edge:** Bottom action bars must use `pb-[calc(env(safe-area-inset-bottom)+1rem)]`.

## ⚠️ 8. Critical Dev Notes
*   **Scanner Defense:** Always use `scandelete: node_modules` and `scanignore` in store recipes to prevent false positives from build tools.
*   **YAML Formatting:** `Binaries: ` requires a trailing space and 2-space URL indentation for F-Droid linter (`rewritemeta`) compliance.

---
**Current Goal:** Maintain v1.0.10 stable release and monitor F-Droid MR.
