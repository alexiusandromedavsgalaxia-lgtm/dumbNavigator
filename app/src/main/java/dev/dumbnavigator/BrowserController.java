package dev.dumbnavigator;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Toast;
import java.util.List;

/** Coordinates navigation state, the native DumbEngine and browser chrome. */
public final class BrowserController implements DumbEngine.Host {
    public interface Listener {
        void onUrl(String url);
        void onTitle(String title);
        void onNavigationState(boolean canBack, boolean canForward);
        void onSpecialPage(String url);
    }

    private static final String HOME = "dumb://une.developeit.dev/";
    private final Context context;
    private final Listener listener;
    private final BrowserStore store;
    private final DumbEngine engine;
    private final Handler main = new Handler(Looper.getMainLooper());
    private String title = "dumbNavigator";

    public BrowserController(Context context, Listener listener) {
        this.context = context;
        this.listener = listener;
        this.store = new BrowserStore(context);
        this.engine = new DumbEngine(context, this);
    }

    public View view() { return engine.view(); }
    public String currentUrl() { return engine.currentUrl(); }
    public boolean canGoBack() { return engine.canBack(); }
    public boolean canGoForward() { return engine.canForward(); }
    public BrowserStore store() { return store; }
    public String title() { return title; }

    public void open(String url) { engine.go(normalizeAddress(url)); }
    public void home() { engine.go(HOME); }
    public void back() { engine.back(); notifyNavigation(); }
    public void forward() { engine.forward(); notifyNavigation(); }
    public void reload() { engine.go(engine.currentUrl()); }

    public void setTitle(String value) {
        title = value == null || value.trim().isEmpty() ? "dumbNavigator" : value.trim();
        main.post(() -> listener.onTitle(title));
    }

    public void toggleBookmark() {
        String url = currentUrl();
        store.toggleBookmark(url, title);
        Toast.makeText(context, store.isBookmarked(url) ? "marcador guardado" : "marcador eliminado", Toast.LENGTH_SHORT).show();
    }

    public boolean isBookmarked() { return store.isBookmarked(currentUrl()); }
    public List<BrowserStore.Bookmark> bookmarks() { return store.bookmarks(); }
    public List<String> history() { return store.history(); }
    public void clearHistory() { store.clearHistory(); }

    private void notifyNavigation() {
        main.post(() -> listener.onNavigationState(engine.canBack(), engine.canForward()));
    }

    private static String normalizeAddress(String raw) {
        if (raw == null || raw.trim().isEmpty()) return HOME;
        String value = raw.trim();
        if (!value.contains("://")) value = "dumb://" + value;
        return value;
    }

    @Override public void onUrl(String url) {
        main.post(() -> {
            listener.onUrl(url);
            listener.onNavigationState(engine.canBack(), engine.canForward());
            store.addHistory(url);
        });
    }

    @Override public void onSpecial(String url) {
        main.post(() -> listener.onSpecialPage(url));
    }
}
