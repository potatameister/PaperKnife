package com.paperknife.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tom_roush.pdfbox.pdmodel.PDDocument;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Native PDF decryptor. pdf-lib (JS) cannot decrypt password-protected
 * files, so Unlock delegates here on Android. Source-only dependency
 * (pdfbox-android), no binaries, no new permissions.
 *
 * Contract: input/output files live in the app cache dir. TS writes the
 * locked bytes, passes the file name + password, reads back the clean file.
 */
@CapacitorPlugin(name = "PdfUnlock")
public class PdfUnlockPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod()
    public void unlock(PluginCall call) {
        String name = call.getString("name");
        String outName = call.getString("outName");
        String password = call.getString("password", "");
        if (name == null || outName == null) {
            call.reject("Missing file reference.");
            return;
        }
        if (password == null) password = "";
        final String pw = password;
        executor.execute(() -> {
            PDDocument doc = null;
            try {
                File cacheDir = getContext().getCacheDir();
                File inFile = new File(cacheDir, new File(name).getName());
                if (!inFile.exists()) {
                    call.reject("Input file not found.");
                    return;
                }
                try {
                    doc = PDDocument.load(inFile, pw);
                } catch (IOException first) {
                    // Owner-restriction-only files open with an empty password;
                    // a wrong user password fails both attempts.
                    if (!pw.isEmpty()) {
                        try {
                            doc = PDDocument.load(inFile, "");
                        } catch (IOException second) {
                            call.reject("INCORRECT_PASSWORD");
                            return;
                        }
                    } else {
                        call.reject("INCORRECT_PASSWORD");
                        return;
                    }
                }
                doc.setAllSecurityToBeRemoved(true);
                File outFile = new File(cacheDir, new File(outName).getName());
                try {
                    doc.save(outFile);
                } catch (IOException e) {
                    call.reject("Could not rebuild unlocked copy.");
                    return;
                }
                JSObject ret = new JSObject();
                ret.put("name", outName);
                ret.put("pages", doc.getNumberOfPages());
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Unlock failed.");
            } finally {
                if (doc != null) {
                    try { doc.close(); } catch (IOException ignored) { /* ignore */ }
                }
            }
        });
    }
}
