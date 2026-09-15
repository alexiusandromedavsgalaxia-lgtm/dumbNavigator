package dev.dumbnavigator;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

final class DevTools {
    private final SharedPreferences prefs;
    DevTools(Context c) { prefs = c.getSharedPreferences("devtools", Context.MODE_PRIVATE); }
    boolean javascript() { return prefs.getBoolean("javascript", false); }
    boolean images() { return prefs.getBoolean("images", true); }
    boolean dark() { return prefs.getBoolean("dark", true); }
    void set(String key, boolean value) { prefs.edit().putBoolean(key, value).apply(); }
    String diagnostics() {
        return "dumbNavigator diagnostics\n" +
                "Android: " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")\n" +
                "Renderer: native DumbEngine / Canvas\n" +
                "HTML/CSS parser: enabled\n" +
                "JavaScript: " + javascript() + " (not executed by the native renderer)\n" +
                "Images: " + images() + "\n" +
                "Network navigation: controlled by DumbEngine\n" +
                "Namespace: dumb://\n" +
                "Storage: private app storage";
    }
}
