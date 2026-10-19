package app.asthma.tick;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "AsthmatickDatabase")
public class DatabasePlugin extends Plugin {
    private static final String[] TABLES = {"schedule_events", "attacks", "notes"};

    private static class Database extends SQLiteOpenHelper {
        Database(Context context) { super(context, "asthmatick.db", null, 1); }
        @Override public void onCreate(SQLiteDatabase db) {
            for (String table : TABLES) db.execSQL("CREATE TABLE " + table + " (id TEXT PRIMARY KEY, data TEXT NOT NULL)");
            db.execSQL("CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL)");
            db.execSQL("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
        }
        @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) { }
    }

    private JSONObject readSnapshot(SQLiteDatabase db) throws Exception {
        JSONObject result = new JSONObject();
        String[] names = {"scheduleEvents", "attacks", "notes"};
        for (int i = 0; i < TABLES.length; i++) {
            JSONArray items = new JSONArray();
            try (Cursor cursor = db.rawQuery("SELECT data FROM " + TABLES[i], null)) {
                while (cursor.moveToNext()) items.put(new JSONObject(cursor.getString(0)));
            }
            result.put(names[i], items);
        }
        try (Cursor cursor = db.rawQuery("SELECT data FROM settings WHERE id = 1", null)) {
            result.put("settings", cursor.moveToFirst() ? new JSONObject(cursor.getString(0)) : new JSONObject());
        }
        return result;
    }

    private void writeSnapshot(SQLiteDatabase db, JSONObject snapshot) throws Exception {
        String[] names = {"scheduleEvents", "attacks", "notes"};
        for (int i = 0; i < TABLES.length; i++) {
            db.execSQL("DELETE FROM " + TABLES[i]);
            JSONArray items = snapshot.optJSONArray(names[i]);
            if (items == null) continue;
            for (int j = 0; j < items.length(); j++) {
                JSONObject item = items.getJSONObject(j);
                String id = item.getString("id");
                db.execSQL("INSERT INTO " + TABLES[i] + " (id, data) VALUES (?, ?)", new Object[]{id, item.toString()});
            }
        }
        db.execSQL("INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)",
            new Object[]{snapshot.optJSONObject("settings") == null ? "{}" : snapshot.getJSONObject("settings").toString()});
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try (Database helper = new Database(getContext())) {
            SQLiteDatabase db = helper.getWritableDatabase();
            db.beginTransaction();
            try {
                boolean initialized;
                try (Cursor cursor = db.rawQuery("SELECT value FROM metadata WHERE key = 'initialized'", null)) {
                    initialized = cursor.moveToFirst();
                }
                if (!initialized) {
                    String legacy = call.getString("legacy");
                    if (legacy != null) writeSnapshot(db, new JSONObject(legacy));
                    db.execSQL("INSERT INTO metadata (key, value) VALUES ('initialized', '1')");
                }
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
            JSObject result = new JSObject();
            result.put("snapshot", readSnapshot(db).toString());
            call.resolve(result);
        } catch (Exception error) { call.reject("Database initialization failed", error); }
    }

    @PluginMethod
    public void exportDatabase(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/octet-stream");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "asthmatick_backup.db"));
        saveCall(call);
        startActivityForResult(call, intent, "handleExportResult");
    }

    @ActivityCallback
    private void handleExportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Uri uri = result.getResultCode() == Activity.RESULT_OK && result.getData() != null
            ? result.getData().getData() : null;
        if (uri == null) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }
        try {
            // The JS caller waits for pending writes before opening the picker. The
            // helper is closed before copying so the exported file is self-contained.
            File source = getContext().getDatabasePath("asthmatick.db");
            try (InputStream input = new FileInputStream(source);
                 OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException("Cannot open destination");
                byte[] buffer = new byte[8192];
                int length;
                while ((length = input.read(buffer)) != -1) output.write(buffer, 0, length);
                output.flush();
            }
            JSObject response = new JSObject();
            response.put("success", true);
            call.resolve(response);
        } catch (Exception error) { call.reject("Database export failed", error); }
    }

    @PluginMethod
    public void importDatabase(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        saveCall(call);
        startActivityForResult(call, intent, "handleImportResult");
    }

    @ActivityCallback
    private void handleImportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Uri uri = result.getResultCode() == Activity.RESULT_OK && result.getData() != null
            ? result.getData().getData() : null;
        if (uri == null) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }
        File temporary = null;
        try {
            temporary = File.createTempFile("asthmatick-import-", ".db", getContext().getCacheDir());
            try (InputStream input = getContext().getContentResolver().openInputStream(uri);
                 OutputStream output = new FileOutputStream(temporary)) {
                if (input == null) throw new IllegalStateException("Cannot open backup");
                byte[] buffer = new byte[8192];
                int length;
                while ((length = input.read(buffer)) != -1) output.write(buffer, 0, length);
            }
            JSONObject imported;
            try (SQLiteDatabase backup = SQLiteDatabase.openDatabase(
                    temporary.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY)) {
                try (Cursor check = backup.rawQuery("PRAGMA integrity_check", null)) {
                    if (!check.moveToFirst() || !"ok".equalsIgnoreCase(check.getString(0)))
                        throw new IllegalArgumentException("Invalid SQLite backup");
                }
                try (Cursor marker = backup.rawQuery("SELECT value FROM metadata WHERE key = 'initialized'", null)) {
                    if (!marker.moveToFirst()) throw new IllegalArgumentException("Not an Asthmatick backup");
                }
                imported = readSnapshot(backup);
            }
            try (Database helper = new Database(getContext())) {
                SQLiteDatabase live = helper.getWritableDatabase();
                live.beginTransaction();
                try {
                    writeSnapshot(live, imported);
                    live.setTransactionSuccessful();
                } finally { live.endTransaction(); }
            }
            JSObject response = new JSObject();
            response.put("success", true);
            response.put("snapshot", imported.toString());
            call.resolve(response);
        } catch (Exception error) { call.reject("Database import failed", error); }
        finally { if (temporary != null) temporary.delete(); }
    }

    @PluginMethod
    public void save(PluginCall call) {
        try (Database helper = new Database(getContext())) {
            String raw = call.getString("snapshot");
            if (raw == null) throw new IllegalArgumentException("Missing snapshot");
            SQLiteDatabase db = helper.getWritableDatabase();
            db.beginTransaction();
            try {
                writeSnapshot(db, new JSONObject(raw));
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
            call.resolve();
        } catch (Exception error) { call.reject("Database save failed", error); }
    }
}
