package com.paperknife.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "PaperKnife";
    private static final int MAX_RETRIES = 3;
    private static final int RETRY_DELAY_MS = 500;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        handleIntent(getIntent());
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        
        String action = intent.getAction();
        String type = intent.getType();

        if ((Intent.ACTION_SEND.equals(action) || Intent.ACTION_VIEW.equals(action)) && type != null) {
            if ("application/pdf".equals(type)) {
                Uri fileUri = null;
                if (Intent.ACTION_SEND.equals(action)) {
                    fileUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
                } else if (Intent.ACTION_VIEW.equals(action)) {
                    fileUri = intent.getData();
                }

                if (fileUri != null) {
                    // Grant read permission for content:// URIs
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    
                    final String uriString = fileUri.toString();
                    Log.d(TAG, "Received PDF intent: " + uriString);
                    sendToWebview(uriString, 0);
                }
            }
        }
    }

    private void sendToWebview(String uriString, int retryCount) {
        if (retryCount > MAX_RETRIES) {
            Log.e(TAG, "Failed to send intent after " + MAX_RETRIES + " retries");
            return;
        }

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    String js = "window.dispatchEvent(new CustomEvent('fileIntent', { detail: { uri: '" + uriString + "' } }));";
                    getBridge().getWebView().evaluateJavascript(js, null);
                    Log.d(TAG, "Sent fileIntent event to webview");
                } else {
                    Log.d(TAG, "Bridge not ready, retry " + (retryCount + 1) + "/" + MAX_RETRIES);
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        sendToWebview(uriString, retryCount + 1);
                    }, RETRY_DELAY_MS);
                }
            }
        });
    }
}
