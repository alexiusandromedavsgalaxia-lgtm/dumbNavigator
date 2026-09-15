package dev.dumbnavigator;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Locale;

@SuppressLint("SetJavaScriptEnabled")
public final class ChromiumEngine extends WebView {
    public interface Host {
        void onUrl(String url);
        void onTitle(String title);
        void onProgress(int progress);
        void onPublish(String domain, String html, boolean wildcard);
    }

    private final Host host;
    private final ArrayDeque<String> back = new ArrayDeque<>();
    private final ArrayDeque<String> forward = new ArrayDeque<>();
    private String current = "dumb://uuu.une.developeit.dev/";

    public ChromiumEngine(Context context, Host host) {
        super(context);
        this.host = host;
        configure();
    }

    private void configure() {
        setBackgroundColor(Color.rgb(10, 14, 22));
        setOverScrollMode(OVER_SCROLL_NEVER);
        setLayerType(LAYER_TYPE_HARDWARE, null);
        WebSettings s = getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setLoadsImagesAutomatically(true);
        s.setBlockNetworkImage(true);
        s.setBlockNetworkLoads(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " dumbNavigator/0.5 Chromium-Internal");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, false);
        addJavascriptInterface(new CreatorBridge(), "Android");
        setWebChromeClient(new WebChromeClient() {
            @Override public void onReceivedTitle(WebView view, String title) { host.onTitle(title == null ? "dumbNavigator" : title); }
            @Override public void onProgressChanged(WebView view, int progress) { host.onProgress(progress); }
        });
        setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("dumb://")) { go(url); return true; }
                return true;
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("dumb".equalsIgnoreCase(u.getScheme())) return localResponse(u);
                return emptyBlockedResponse();
            }
        });
    }

    public void go(String raw) {
        String u = normalize(raw);
        if (u.isEmpty()) return;
        if (!u.equals(current)) { back.push(current); forward.clear(); }
        current = u;
        host.onUrl(u);
        loadDumb(u);
    }

    public void backPage() {
        if (back.isEmpty()) return;
        forward.push(current);
        current = back.pop();
        host.onUrl(current);
        loadDumb(current);
    }

    public void forwardPage() {
        if (forward.isEmpty()) return;
        back.push(current);
        current = forward.pop();
        host.onUrl(current);
        loadDumb(current);
    }

    public boolean canGoBackDumb() { return !back.isEmpty(); }
    public boolean canGoForwardDumb() { return !forward.isEmpty(); }
    public String currentUrl() { return current; }

    private void loadDumb(String dumb) {
        Uri uri = Uri.parse(dumb);
        String hostName = uri.getHost();
        if (hostName == null) return;
        String path = uri.getPath();
        if (path == null || path.isEmpty()) path = "/";

        if (hostName.equals("uuu.une.developeit.dev") || hostName.equals("une.developeit.dev")) {
            String asset = "/".equals(path) ? "developeit/index.html" :
                    ("/new".equals(path) ? "developeit/new/index.html" :
                    ("/help".equals(path) ? "developeit/help/index.html" :
                    ("/about".equals(path) ? "developeit/about/index.html" : null)));
            if (asset != null) {
                String html = readAsset(asset);
                if (html != null) { loadInternal(dumb, html); return; }
            }
        }

        File root = new File(getContext().getFilesDir(), "dumb-sites/" + safe(hostName));
        File exact = new File(root, "index.html");
        if (exact.exists()) {
            String html = readFile(exact);
            if (html != null) { loadInternal(dumb, html); return; }
        }

        String[] labels = hostName.split("\\.");
        for (int i = 1; i < labels.length - 1; i++) {
            String parent = String.join(".", Arrays.copyOfRange(labels, i, labels.length));
            File wild = new File(getContext().getFilesDir(), "dumb-sites/" + safe(parent) + "/wildcard/index.html");
            if (wild.exists()) {
                String html = readFile(wild);
                if (html != null) { loadInternal(dumb, html); return; }
            }
        }

        String missing = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>404 · dumbNavigator</title></head><body style='font-family:system-ui;background:#080b12;color:white;padding:32px'><h1>404</h1><p>Esta web todavía no existe dentro de dumbNavigator.</p><p><b>" + escape(hostName) + "</b></p><p>Todo lo que ves aquí pertenece al espacio interno de dumbNavigator.</p></body></html>";
        loadInternal(dumb, missing);
    }

    private void loadInternal(String base, String html) {
        loadDataWithBaseURL(base, html, "text/html", "UTF-8", null);
    }

    private WebResourceResponse localResponse(Uri u) {
        String h = u.getHost();
        if (h == null) return null;
        String path = u.getPath();
        if (path == null || path.equals("/")) path = "/index.html";

        if (h.equals("uuu.une.developeit.dev") || h.equals("une.developeit.dev")) {
            String asset = assetPath(path);
            if (asset != null) {
                try { return responseForStream(mime(path), getContext().getAssets().open(asset)); }
                catch (Exception ignored) { }
            }
        }

        File f = new File(getContext().getFilesDir(), "dumb-sites/" + safe(h) + path);
        if (!f.exists()) {
            String[] labels = h.split("\\.");
            for (int i = 1; i < labels.length - 1 && !f.exists(); i++) {
                String parent = String.join(".", Arrays.copyOfRange(labels, i, labels.length));
                f = new File(getContext().getFilesDir(), "dumb-sites/" + safe(parent) + "/wildcard" + path);
            }
        }
        if (!f.exists()) return null;
        try { return responseForStream(mime(f.getName()), new FileInputStream(f)); }
        catch (Exception ignored) { return null; }
    }

    private static WebResourceResponse responseForStream(String type, InputStream input) {
        return new WebResourceResponse(type, "UTF-8", input);
    }

    private String assetPath(String path) {
        if (path.equals("/index.html")) return "developeit/index.html";
        if (path.equals("/new") || path.equals("/new/")) return "developeit/new/index.html";
        if (path.equals("/help") || path.equals("/help/")) return "developeit/help/index.html";
        if (path.equals("/about") || path.equals("/about/")) return "developeit/about/index.html";
        return null;
    }

    private static WebResourceResponse emptyBlockedResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
    }

    private static String mime(String n) {
        n = n.toLowerCase(Locale.ROOT);
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".js")) return "application/javascript";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".gif")) return "image/gif";
        if (n.endsWith(".webp")) return "image/webp";
        return "text/html";
    }

    private static String normalize(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "dumb://uuu.une.developeit.dev/";
        String s = raw.trim().toLowerCase(Locale.ROOT);
        if (!s.contains("://")) s = "dumb://" + s;
        if (!s.startsWith("dumb://")) return "";
        Uri u = Uri.parse(s);
        String host = u.getHost();
        if (host == null) return "";
        String h = DumbDomains.publicInternalHost(host);
        if (h.isEmpty()) return "";
        String p = u.getEncodedPath();
        if (p == null || p.isEmpty()) p = "/";
        return "dumb://" + h + p + (u.getEncodedQuery() == null ? "" : "?" + u.getEncodedQuery()) + (u.getEncodedFragment() == null ? "" : "#" + u.getEncodedFragment());
    }

    private String readAsset(String p) { try (InputStream in = getContext().getAssets().open(p)) { return read(in); } catch (Exception e) { return null; } }
    private static String readFile(File f) { try (FileInputStream in = new FileInputStream(f)) { return read(in); } catch (Exception e) { return null; } }
    private static String read(InputStream in) throws Exception { ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] b = new byte[8192]; int n; while ((n = in.read(b)) != -1) out.write(b, 0, n); return out.toString(StandardCharsets.UTF_8.name()); }
    private static String safe(String h) { return h.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "_"); }
    private static String escape(String s) { return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"); }

    private final class CreatorBridge {
        @JavascriptInterface public void publish(String domain, String html, boolean wildcard) { host.onPublish(domain, html, wildcard); }
    }
}
