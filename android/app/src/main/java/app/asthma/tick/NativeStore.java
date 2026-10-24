package app.asthma.tick;

import android.content.*;
import android.database.*;
import android.database.sqlite.*;
import android.net.Uri;
import java.io.*;
import org.json.*;

/** Opens the same internal database; importing never replaces the live file. */
final class NativeStore extends SQLiteOpenHelper {
  private final Context context;
  NativeStore(Context context) {
    super(context, "asthmatick.db", null, 1);
    this.context = context.getApplicationContext();
  }
  @Override
  public void onCreate(SQLiteDatabase db) {
    for (String table : Records.TABLES)
      db.execSQL("CREATE TABLE " + table + " (id TEXT PRIMARY KEY, data TEXT NOT NULL)");
    db.execSQL("CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL)");
    db.execSQL("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    db.execSQL("INSERT INTO metadata (key,value) VALUES ('initialized','1')");
  }
  @Override
  public void onUpgrade(SQLiteDatabase db, int old, int next) {}
  synchronized JSONObject load() throws JSONException {
    return read(getReadableDatabase());
  }
  private static JSONObject read(SQLiteDatabase db) throws JSONException {
    JSONObject snapshot = new JSONObject();
    for (int t = 0; t < 3; t++) {
      JSONArray a = new JSONArray();
      try (Cursor c = db.rawQuery("SELECT data FROM " + Records.TABLES[t], null)) {
        while (c.moveToNext()) a.put(new JSONObject(c.getString(0)));
      }
      snapshot.put(Records.KEYS[t], a);
    }
    try (Cursor c = db.rawQuery("SELECT data FROM settings WHERE id=1", null)) {
      snapshot.put("settings", c.moveToFirst() ? new JSONObject(c.getString(0)) : new JSONObject());
    }
    return snapshot;
  }
  synchronized void save(JSONObject snapshot) throws JSONException {
    Records.validate(snapshot);
    SQLiteDatabase db = getWritableDatabase();
    db.beginTransaction();
    try {
      for (int t = 0; t < 3; t++) {
        db.delete(Records.TABLES[t], null, null);
        JSONArray a = snapshot.getJSONArray(Records.KEYS[t]);
        for (int i = 0; i < a.length(); i++) {
          JSONObject o = a.getJSONObject(i);
          ContentValues v = new ContentValues();
          v.put("id", o.getString("id"));
          v.put("data", o.toString());
          db.insertOrThrow(Records.TABLES[t], null, v);
        }
      }
      db.execSQL("INSERT OR REPLACE INTO settings (id,data) VALUES (1,?)",
          new Object[] {snapshot.getJSONObject("settings").toString()});
      db.execSQL("INSERT OR REPLACE INTO metadata (key,value) VALUES ('initialized','1')");
      db.setTransactionSuccessful();
    } finally {
      db.endTransaction();
    }
  }
  synchronized void exportTo(Uri uri) throws Exception {
    try (Cursor checkpoint = getWritableDatabase().rawQuery("PRAGMA wal_checkpoint(FULL)", null)) {
      if (checkpoint.moveToFirst() && checkpoint.getInt(0) != 0)
        throw new IOException("Database is busy");
    }
    close();
    try (InputStream in = new FileInputStream(context.getDatabasePath("asthmatick.db"));
        OutputStream out = context.getContentResolver().openOutputStream(uri, "wt")) {
      if (out == null)
        throw new IOException("Cannot open destination");
      copy(in, out, Long.MAX_VALUE);
    }
  }
  synchronized JSONObject importFrom(Uri uri) throws Exception {
    File tmp = File.createTempFile("restore-", ".db", context.getCacheDir());
    try {
      try (InputStream in = context.getContentResolver().openInputStream(uri);
          OutputStream out = new FileOutputStream(tmp)) {
        if (in == null)
          throw new IOException("Cannot open backup");
        copy(in, out, 32L * 1024 * 1024);
      }
      JSONObject snapshot;
      try (SQLiteDatabase backup =
               SQLiteDatabase.openDatabase(tmp.toString(), null, SQLiteDatabase.OPEN_READONLY)) {
        try (Cursor c = backup.rawQuery("PRAGMA integrity_check", null)) {
          if (!c.moveToFirst() || !"ok".equals(c.getString(0)))
            throw new IOException("Invalid SQLite backup");
        }
        try (Cursor c =
                 backup.rawQuery("SELECT value FROM metadata WHERE key='initialized'", null)) {
          if (!c.moveToFirst())
            throw new IOException("Not an Asthmatick backup");
        }
        snapshot = read(backup);
        Records.validate(snapshot);
      }
      save(snapshot);
      return snapshot;
    } finally {
      tmp.delete();
    }
  }
  private static void copy(InputStream in, OutputStream out, long limit) throws IOException {
    byte[] buffer = new byte[8192];
    long size = 0;
    int n;
    while ((n = in.read(buffer)) != -1) {
      size += n;
      if (size > limit)
        throw new IOException("Backup exceeds 32 MiB");
      out.write(buffer, 0, n);
    }
  }
}
