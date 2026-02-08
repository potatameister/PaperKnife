package com.paperknife.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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
                    final String uriString = fileUri.toString();
                    // Ensure we run on the UI thread for WebView access
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.dispatchEvent(new CustomEvent('fileIntent', { detail: { uri: '" + uriString + "' } }));",
                                    null
                                );
                            }
                        }
                    });
                }
            }
        }
    }
}
