package dev.dumbnavigator;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

/** Persistent local browser data. Nothing is sent to the public Internet. */
final class BrowserStore {
    static final class Bookmark {
        final String url;
        final String title;
        Bookmark(String url, String title) { this.url = url; this.title = title; }
    }

    private static final String PREFS = "dumb_browser_store_v1";
    private static final String HISTORY = "history";
    private static final String BOOKMARKS = "bookmarks";
    private final SharedPreferences prefs;

    BrowserStore(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    synchronized void addHistory(String url) {
        if (url == null || url.isEmpty()) return;
        LinkedHashSet<String> set = readSet(HISTORY);
        set.remove(url);
        set.add(url);
        while (set.size() > 100) set.remove(set.iterator().next());
        writeSet(HISTORY, set);
    }

    synchronized List<String> history() { return new ArrayList<>(readSet(HISTORY)); }
    synchronized void clearHistory() { prefs.edit().remove(HISTORY).apply(); }

    synchronized void toggleBookmark(String url, String title) {
        if (url == null || url.isEmpty()) return;
        LinkedHashSet<String> set = readSet(BOOKMARKS);
        String prefix = url + "\t";
        String found = null;
        for (String item : set) if (item.equals(url) || item.startsWith(prefix)) { found = item; break; }
        if (found != null) set.remove(found);
        else set.add(url + "\t" + cleanTitle(title));
        writeSet(BOOKMARKS, set);
    }

    synchronized boolean isBookmarked(String url) {
        for (String item : readSet(BOOKMARKS)) if (item.equals(url) || item.startsWith(url + "\t")) return true;
        return false;
    }

    synchronized List<Bookmark> bookmarks() {
        List<Bookmark> result = new ArrayList<>();
        for (String item : readSet(BOOKMARKS)) {
            int tab = item.indexOf('\t');
            if (tab < 0) result.add(new Bookmark(item, item));
            else result.add(new Bookmark(item.substring(0, tab), item.substring(tab + 1)));
        }
        return result;
    }

    private LinkedHashSet<String> readSet(String key) {
        LinkedHashSet<String> result = new LinkedHashSet<>();
        String raw = prefs.getString(key, "");
        if (raw == null || raw.isEmpty()) return result;
        for (String line : raw.split("\\n")) if (!line.trim().isEmpty()) result.add(line.trim());
        return result;
    }

    private void writeSet(String key, LinkedHashSet<String> set) {
        StringBuilder b = new StringBuilder();
        for (String value : set) {
            if (b.length() > 0) b.append('\n');
            b.append(value.replace("\n", " "));
        }
        prefs.edit().putString(key, b.toString()).apply();
    }

    private static String cleanTitle(String title) {
        if (title == null || title.trim().isEmpty()) return "dumb site";
        return title.replace('\t', ' ').replace('\n', ' ').trim().toLowerCase(Locale.ROOT);
    }
}
