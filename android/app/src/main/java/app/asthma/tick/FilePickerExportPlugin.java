package app.asthma.tick;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FilePickerExport")
public class FilePickerExportPlugin extends Plugin {

    @PluginMethod
    public void exportFile(PluginCall call) {
        String filename = call.getString("filename", "asthmatick_backup.json");
        String data = call.getString("data", "");
        String mimeType = call.getString("mimeType", "application/json");

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        saveCall(call);
        startActivityForResult(call, intent, "handleSaveFileResult");
    }

    @ActivityCallback
    private void handleSaveFileResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri uri = result.getData().getData();
            if (uri != null) {
                try {
                    String data = call.getString("data", "");
                    OutputStream os = getContext().getContentResolver().openOutputStream(uri);
                    if (os != null) {
                        os.write(data.getBytes(StandardCharsets.UTF_8));
                        os.flush();
                        os.close();
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("uri", uri.toString());
                        call.resolve(ret);
                        return;
                    }
                } catch (Exception e) {
                    call.reject("Ошибка записи файла: " + e.getMessage(), e);
                    return;
                }
            }
        }

        JSObject ret = new JSObject();
        ret.put("success", false);
        ret.put("cancelled", true);
        call.resolve(ret);
    }
}
