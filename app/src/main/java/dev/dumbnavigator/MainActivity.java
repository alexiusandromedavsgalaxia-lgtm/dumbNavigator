package dev.dumbnavigator;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.mozilla.geckoview.*;

public class MainActivity extends Activity {
    private static GeckoRuntime runtime;
    private GeckoSession session;
    private GeckoView view;
    private EditText address;
    private final Map<String,String> virtualUrls = new HashMap<>();
    private String displayedDumbUrl = "dumb://une.developeit.dev/";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);
        view = findViewById(R.id.gecko);
        address = findViewById(R.id.address);
        findViewById(R.id.go).setOnClickListener(v -> navigate(address.getText().toString()));
        findViewById(R.id.back).setOnClickListener(v -> { if (session != null) session.goBack(); });
        findViewById(R.id.forward).setOnClickListener(v -> { if (session != null) session.goForward(); });

        if (runtime == null) runtime = GeckoRuntime.create(this);
        session = new GeckoSession();
        session.setContentDelegate(new GeckoSession.ContentDelegate() {});
        session.setNavigationDelegate(new DumbNavigationDelegate());
        session.open(runtime);
        view.setSession(session);

        String start = getIntent().getDataString();
        if (start == null || !start.startsWith("dumb://")) start = "dumb://une.developeit.dev/";
        navigate(start);
    }

    private void navigate(String raw) {
        String u = raw.trim();
        if (u.isEmpty()) u = "dumb://une.developeit.dev/";
        if (!u.contains("://")) u = "dumb://" + u;
        if (u.startsWith("dumb://")) { displayedDumbUrl = u; address.setText(u); }
        session.loadUri(resolveDumb(u));
    }

    private String resolveDumb(String dumb) {
        Uri u = Uri.parse(dumb);
        String host = u.getHost() == null ? "" : u.getHost().toLowerCase(Locale.ROOT);
        String path = u.getPath() == null || u.getPath().isEmpty() ? "/" : u.getPath();

        if (host.equals("une.developeit.dev")) {
            return "file:///android_asset/developeit/index.html";
        }

        File site = new File(getFilesDir(), "sites/" + safeHost(host) + "/index.html");
        if (site.exists()) {
            // A published dumb site is an origin, not a collection of unrelated paths.
            // /, /about, /anything and other SPA-style paths all resolve to its main page.
            return Uri.fromFile(site).toString();
        }

        String scheme = "https";
        String query = u.getQuery() == null ? "" : "?" + u.getQuery();
        String fragment = u.getFragment() == null ? "" : "#" + u.getFragment();
        return scheme + "://" + host + path + query + fragment;
    }

    private String safeHost(String host) { return host.replaceAll("[^a-zA-Z0-9._-]", "_"); }

    private void showNewSiteEditor() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int p = 24; box.setPadding(p,p,p,p);
        EditText name = new EditText(this); name.setHint("nombre-del-sitio"); box.addView(name);
        EditText html = new EditText(this); html.setHint("HTML de tu página"); html.setGravity(Gravity.TOP); html.setMinLines(10); box.addView(html);
        new AlertDialog.Builder(this).setTitle("crear web gratis")
            .setMessage("se guarda localmente como dumb://NOMBRE.dumb/ y no cuesta nada")
            .setView(box).setNegativeButton("cancelar", null)
            .setPositiveButton("publicar", (d,w) -> publishSite(name.getText().toString(), html.getText().toString())).show();
    }

    private void publishSite(String rawName, String html) {
        String slug = rawName.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-").replaceAll("-+", "-");
        if (slug.isEmpty()) slug = "mi-web";
        String host = slug + ".dumb";
        File dir = new File(getFilesDir(), "sites/" + safeHost(host));
        if (!dir.exists()) dir.mkdirs();
        if (html.trim().isEmpty()) html = "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body><h1>" + slug + "</h1><p>mi primera web dumb ✨</p></body></html>";
        try (FileOutputStream out = new FileOutputStream(new File(dir, "index.html"))) {
            out.write(html.getBytes(StandardCharsets.UTF_8));
            navigate("dumb://" + host + "/");
            Toast.makeText(this, "publicada en dumb://" + host + "/", Toast.LENGTH_LONG).show();
        } catch (IOException e) { Toast.makeText(this, "no se pudo guardar la web", Toast.LENGTH_LONG).show(); }
    }

    private class DumbNavigationDelegate implements GeckoSession.NavigationDelegate {
        @Override public GeckoResult<AllowOrDeny> onLoadRequest(GeckoSession s, LoadRequest request) {
            String uri = request.uri == null ? "" : request.uri;
            if (uri.startsWith("dumb://")) {
                Uri u = Uri.parse(uri);
                if ("une.developeit.dev".equalsIgnoreCase(u.getHost()) && "/new".equals(u.getPath())) {
                    runOnUiThread(() -> showNewSiteEditor());
                    return GeckoResult.deny();
                }
                String resolved = resolveDumb(uri);
                displayedDumbUrl = uri;
                runOnUiThread(() -> address.setText(uri));
                s.loadUri(resolved);
                return GeckoResult.deny();
            }
            return GeckoResult.allow();
        }

        @Override public void onLocationChange(GeckoSession s, String url, List<GeckoSession.PermissionDelegate.ContentPermission> permissions, Boolean hasUserGesture) {
            if (url == null) return;
            Uri u = Uri.parse(url);
            if ("file".equalsIgnoreCase(u.getScheme()) && displayedDumbUrl.startsWith("dumb://")) {
                runOnUiThread(() -> address.setText(displayedDumbUrl));
            } else if ("https".equalsIgnoreCase(u.getScheme())) {
                String dumb = "dumb://" + (u.getHost() == null ? "" : u.getHost()) + (u.getPath() == null ? "/" : u.getPath());
                if (u.getQuery() != null) dumb += "?" + u.getQuery();
                if (u.getFragment() != null) dumb += "#" + u.getFragment();
                displayedDumbUrl = dumb;
                runOnUiThread(() -> address.setText(dumb));
            }
        }
        @Override public void onCanGoBack(GeckoSession s, boolean can) { findViewById(R.id.back).setEnabled(can); }
        @Override public void onCanGoForward(GeckoSession s, boolean can) { findViewById(R.id.forward).setEnabled(can); }
        @Override public GeckoResult<GeckoSession> onNewSession(GeckoSession s, String uri) { s.loadUri(uri); return GeckoResult.fromValue(s); }
    }
}
