package com.paperknife.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
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
                    JSObject ret = new JSObject();
                    ret.put("uri", fileUri.toString());
                    bridge.triggerWindowExecution("window.dispatchEvent(new CustomEvent('fileIntent', { detail: { uri: '" + fileUri.toString() + "' } }));");
                }
            }
        }
    }
}