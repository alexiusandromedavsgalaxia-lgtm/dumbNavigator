package dev.dumbnavigator;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity implements ChromiumEngine.Host {
    private static final String HOME = "dumb://uuu.une.developeit.dev/";
    private ChromiumEngine engine;
    private BrowserStore store;
    private EditText address;
    private TextView tabTitle;
    private Button bookmark;
    private String pageTitle = "dumbNavigator";

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        store = new BrowserStore(this);
        address = findViewById(R.id.address);
        tabTitle = findViewById(R.id.tabTitle);
        bookmark = findViewById(R.id.bookmark);
        engine = new ChromiumEngine(this, this);
        ((FrameLayout) findViewById(R.id.engine)).addView(engine, new FrameLayout.LayoutParams(-1, -1));

        findViewById(R.id.go).setOnClickListener(v -> navigateFromAddress());
        findViewById(R.id.back).setOnClickListener(v -> engine.backPage());
        findViewById(R.id.forward).setOnClickListener(v -> engine.forwardPage());
        findViewById(R.id.home).setOnClickListener(v -> engine.go(HOME));
        findViewById(R.id.newTab).setOnClickListener(v -> engine.go(HOME));
        bookmark.setOnClickListener(v -> toggleBookmark());
        findViewById(R.id.menu).setOnClickListener(v -> showMenu());
        address.setOnEditorActionListener((v, actionId, event) -> { navigateFromAddress(); return true; });

        String initial = getIntent().getDataString();
        engine.go(initial == null ? HOME : initial);
    }

    private void navigateFromAddress() {
        String raw = address.getText().toString().trim();
        if (raw.isEmpty()) { engine.go(HOME); return; }
        if (!raw.toLowerCase().startsWith("dumb://")) raw = "dumb://" + raw;
        engine.go(raw);
    }

    private void toggleBookmark() {
        String url = engine.currentUrl();
        store.toggleBookmark(url, pageTitle);
        updateBookmarkIcon();
        Toast.makeText(this, store.isBookmarked(url) ? "guardado en marcadores" : "marcador eliminado", Toast.LENGTH_SHORT).show();
    }

    private void updateBookmarkIcon() {
        bookmark.setText(store.isBookmarked(engine.currentUrl()) ? "★" : "☆");
    }

    private void showMenu() {
        final String[] options = {"Marcadores", "Historial", "Copiar dirección", "Recargar", "Crear una web", "Ayuda", "Acerca de", "Borrar historial"};
        new AlertDialog.Builder(this)
                .setTitle("dumbNavigator")
                .setItems(options, (d, which) -> {
                    switch (which) {
                        case 0: showBookmarks(); break;
                        case 1: showHistory(); break;
                        case 2: copyCurrentUrl(); break;
                        case 3: engine.reload(); break;
                        case 4: engine.go("dumb://uuu.une.developeit.dev/new"); break;
                        case 5: engine.go("dumb://uuu.une.developeit.dev/help"); break;
                        case 6: engine.go("dumb://uuu.une.developeit.dev/about"); break;
                        case 7: store.clearHistory(); Toast.makeText(this, "historial borrado", Toast.LENGTH_SHORT).show(); break;
                    }
                }).show();
    }

    private void showBookmarks() {
        List<BrowserStore.Bookmark> items = store.bookmarks();
        if (items.isEmpty()) { Toast.makeText(this, "no tienes marcadores todavía", Toast.LENGTH_SHORT).show(); return; }
        String[] labels = new String[items.size()];
        for (int i = 0; i < items.size(); i++) labels[i] = items.get(i).title + "\n" + items.get(i).url;
        new AlertDialog.Builder(this).setTitle("Marcadores").setItems(labels, (d, which) -> engine.go(items.get(which).url)).show();
    }

    private void showHistory() {
        List<String> items = store.history();
        if (items.isEmpty()) { Toast.makeText(this, "historial vacío", Toast.LENGTH_SHORT).show(); return; }
        String[] labels = items.toArray(new String[0]);
        new AlertDialog.Builder(this).setTitle("Historial reciente").setItems(labels, (d, which) -> engine.go(labels[which])).show();
    }

    private void copyCurrentUrl() {
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        cm.setPrimaryClip(ClipData.newPlainText("dumb URL", engine.currentUrl()));
        Toast.makeText(this, "dirección copiada", Toast.LENGTH_SHORT).show();
    }

    @Override public void onUrl(String u) {
        runOnUiThread(() -> {
            address.setText(u);
            address.setSelection(address.length());
            findViewById(R.id.back).setEnabled(engine.canGoBackDumb());
            findViewById(R.id.forward).setEnabled(engine.canGoForwardDumb());
            store.addHistory(u);
            updateBookmarkIcon();
        });
    }

    @Override public void onTitle(String title) {
        runOnUiThread(() -> {
            pageTitle = title == null || title.trim().isEmpty() ? "dumbNavigator" : title.trim();
            tabTitle.setText("  " + pageTitle);
        });
    }

    @Override public void onProgress(int progress) {
        runOnUiThread(() -> tabTitle.setAlpha(progress >= 100 ? 1f : 0.72f));
    }

    @Override public void onPublish(String raw, String html, boolean wildcard) {
        runOnUiThread(() -> {
            final String h = DumbDomains.publicInternalHost(raw);
            if (h.isEmpty()) { Toast.makeText(this, "dominio no válido", Toast.LENGTH_SHORT).show(); return; }
            if (DumbDomains.isReserved(h)) { Toast.makeText(this, "ese dominio está reservado y no se puede crear", Toast.LENGTH_LONG).show(); return; }
            final String page = (html == null || html.trim().isEmpty())
                    ? "<!doctype html><html><body><h1>" + h + "</h1><p>mi web dumb ✨</p></body></html>" : html;
            try {
                DumbEngine.Loader.save(getApplicationContext(), h, page, wildcard);
                Toast.makeText(this, "web publicada: dumb://" + h + "/", Toast.LENGTH_LONG).show();
                engine.go("dumb://" + h + "/");
            } catch (IOException e) {
                Toast.makeText(this, "no se pudo publicar: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    @Override public void onBackPressed() {
        if (engine != null && engine.canGoBackDumb()) engine.backPage();
        else super.onBackPressed();
    }
}
