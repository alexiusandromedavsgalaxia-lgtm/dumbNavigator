package dev.dumbnavigator;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.util.List;

/** Thin activity shell. Rendering and navigation live in separate components. */
public final class MainActivity extends Activity implements BrowserController.Listener {
    private EditText address;
    private TextView tabTitle;
    private TextView tabCount;
    private Button back;
    private Button forward;
    private Button bookmark;
    private BrowserController browser;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);

        bindViews();
        browser = new BrowserController(this, this);
        ((FrameLayout) findViewById(R.id.engine)).addView(browser.view(),
                new FrameLayout.LayoutParams(-1, -1));
        wireActions();
        browser.open(getIntent().getDataString() == null ? "dumb://une.developeit.dev/" : getIntent().getDataString());
    }

    private void bindViews() {
        address = findViewById(R.id.address);
        tabTitle = findViewById(R.id.tabTitle);
        tabCount = findViewById(R.id.tabCount);
        back = findViewById(R.id.back);
        forward = findViewById(R.id.forward);
        bookmark = findViewById(R.id.bookmark);
        BrowserUi.styleAction(back, false);
        BrowserUi.styleAction(forward, false);
        BrowserUi.styleAction(findViewById(R.id.go), true);
        BrowserUi.styleAction(findViewById(R.id.reload), false);
        BrowserUi.styleAction(findViewById(R.id.home), false);
        BrowserUi.styleAction(bookmark, false);
        BrowserUi.styleAction(findViewById(R.id.menu), true);
        BrowserUi.styleAction(findViewById(R.id.newTab), true);
    }

    private void wireActions() {
        findViewById(R.id.go).setOnClickListener(v -> navigateFromAddress());
        findViewById(R.id.back).setOnClickListener(v -> browser.back());
        findViewById(R.id.forward).setOnClickListener(v -> browser.forward());
        findViewById(R.id.reload).setOnClickListener(v -> browser.reload());
        findViewById(R.id.home).setOnClickListener(v -> browser.home());
        findViewById(R.id.newTab).setOnClickListener(v -> browser.home());
        bookmark.setOnClickListener(v -> {
            browser.toggleBookmark();
            updateBookmark();
        });
        findViewById(R.id.menu).setOnClickListener(v -> showMenu());
        address.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE
                    || (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                navigateFromAddress();
                return true;
            }
            return false;
        });
    }

    private void navigateFromAddress() {
        String raw = address.getText().toString().trim();
        browser.open(raw.isEmpty() ? "dumb://une.developeit.dev/" : raw);
    }

    private void updateBookmark() {
        bookmark.setText(browser.isBookmarked() ? "★" : "☆");
    }

    private void showMenu() {
        String[] options = {
                "marcadores", "historial", "copiar dirección", "recargar",
                "crear una web", "ayuda", "acerca de", "borrar historial"
        };
        new android.app.AlertDialog.Builder(this)
                .setTitle("dumbNavigator")
                .setItems(options, (dialog, which) -> {
                    switch (which) {
                        case 0: showBookmarks(); break;
                        case 1: showHistory(); break;
                        case 2: copyCurrentUrl(); break;
                        case 3: browser.reload(); break;
                        case 4: WebCreatorDialog.show(this, browser); break;
                        case 5: browser.open("dumb://une.developeit.dev/help"); break;
                        case 6: browser.open("dumb://une.developeit.dev/about"); break;
                        case 7:
                            browser.clearHistory();
                            Toast.makeText(this, "historial borrado", Toast.LENGTH_SHORT).show();
                            break;
                        default: break;
                    }
                })
                .show();
    }

    private void showBookmarks() {
        List<BrowserStore.Bookmark> items = browser.bookmarks();
        if (items.isEmpty()) {
            Toast.makeText(this, "no tienes marcadores todavía", Toast.LENGTH_SHORT).show();
            return;
        }
        String[] labels = new String[items.size()];
        for (int i = 0; i < items.size(); i++) labels[i] = items.get(i).title + "\n" + items.get(i).url;
        new android.app.AlertDialog.Builder(this)
                .setTitle("marcadores")
                .setItems(labels, (d, which) -> browser.open(items.get(which).url))
                .show();
    }

    private void showHistory() {
        List<String> items = browser.history();
        if (items.isEmpty()) {
            Toast.makeText(this, "historial vacío", Toast.LENGTH_SHORT).show();
            return;
        }
        String[] labels = items.toArray(new String[0]);
        new android.app.AlertDialog.Builder(this)
                .setTitle("historial reciente")
                .setItems(labels, (d, which) -> browser.open(labels[which]))
                .show();
    }

    private void copyCurrentUrl() {
        ClipboardManager manager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        manager.setPrimaryClip(ClipData.newPlainText("dumb URL", browser.currentUrl()));
        Toast.makeText(this, "dirección copiada", Toast.LENGTH_SHORT).show();
    }

    @Override public void onUrl(String url) {
        address.setText(url);
        address.setSelection(address.length());
        updateBookmark();
    }

    @Override public void onTitle(String title) {
        tabTitle.setText(title);
    }

    @Override public void onNavigationState(boolean canBack, boolean canForward) {
        back.setEnabled(canBack);
        forward.setEnabled(canForward);
        back.setAlpha(canBack ? 1f : .45f);
        forward.setAlpha(canForward ? 1f : .45f);
    }

    @Override public void onSpecialPage(String url) {
        if (url.endsWith("/new")) WebCreatorDialog.show(this, browser);
    }

    @Override public void onBackPressed() {
        if (browser != null && browser.canGoBack()) browser.back();
        else super.onBackPressed();
    }
}
