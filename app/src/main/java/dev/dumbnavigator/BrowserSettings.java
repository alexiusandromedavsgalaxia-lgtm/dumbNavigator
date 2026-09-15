package dev.dumbnavigator;

import android.content.Context;
import android.content.SharedPreferences;

final class BrowserSettings {
    private final SharedPreferences p;
    BrowserSettings(Context c) { p = c.getSharedPreferences("browser_settings_v1", Context.MODE_PRIVATE); }
    boolean darkMode() { return p.getBoolean("dark", true); }
    boolean javaScript() { return p.getBoolean("js", true); }
    boolean images() { return p.getBoolean("images", true); }
    boolean desktop() { return p.getBoolean("desktop", false); }
    boolean doNotTrack() { return p.getBoolean("dnt", true); }
    void set(String key, boolean value) { p.edit().putBoolean(key, value).apply(); }
    void reset() { p.edit().clear().apply(); }
}
