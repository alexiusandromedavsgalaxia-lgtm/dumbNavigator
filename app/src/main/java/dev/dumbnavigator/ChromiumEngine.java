package dev.dumbnavigator;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Locale;

/**
 * Chromium-backed rendering core for dumbNavigator.
 * The browser UI and dumb:// protocol remain ours; Chromium handles HTML,
 * CSS, JavaScript, DOM, layout, media and modern web APIs through Android's
 * Chromium WebView implementation.
 */
@SuppressLint("SetJavaScriptEnabled")
public final class ChromiumEngine extends WebView {
    public interface Host {
        void onUrl(String url);
    }

    private final Host host;
    private final ArrayDeque<String> back = new ArrayDeque<>();
    private final ArrayDeque<String> forward = new ArrayDeque<>();
    private String current = "dumb://une.developeit.dev/";
    private boolean internalNavigation;

    public ChromiumEngine(Context context, Host host) {
        super(context);
        this.host = host;
        configure();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configure() {
        setBackgroundColor(Color.rgb(10, 14, 22));
        setOverScrollMode(View.OVER_SCROLL_NEVER);
        setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings s = getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setLoadsImagesAutomatically(true);
        s.setBlockNetworkImage(false);
        s.setBlockNetworkLoads(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(true);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " dumbNavigator/0.3 Chromium");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(this, true);

        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(s, WebSettingsCompat.FORCE_DARK_OFF);
        }

        setWebChromeClient(new WebChromeClient());
        setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("dumb://")) {
                    go(url);
                    return true;
                }
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    String dumb = toDumb(url);
                    if (!dumb.isEmpty()) {
                        go(dumb);
                        return true;
                    }
                }
                return false;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("dumb".equalsIgnoreCase(u.getScheme())) {
                    return localResponse(u);
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!internalNavigation && (url.startsWith("https://") || url.startsWith("http://"))) {
                    String dumb = toDumb(url);
                    if (!dumb.isEmpty()) {
                        current = dumb;
                        host.onUrl(dumb);
                    }
                }
            }
        });
    }

    public void go(String raw) {
        String u = normalize(raw);
        if (u.isEmpty()) return;
        if (!u.equals(current)) {
            back.push(current);
            forward.clear();
        }
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
        String hostName = Uri.parse(dumb).getHost();
        if (hostName == null) return;
        if ("une.developeit.dev".equals(hostName)) {
            String html = readAsset("developeit/index.html");
            if (html != null) {
                internalNavigation = true;
                loadDataWithBaseURL("https://une.developeit.dev/", html, "text/html", "UTF-8", null);
                internalNavigation = false;
                return;
            }
        }

        File f = new File(getContext().getFilesDir(), "dumb-sites/" + safe(hostName) + "/index.html");
        if (f.exists()) {
            String html = readFile(f);
            if (html != null) {
                internalNavigation = true;
                loadDataWithBaseURL("https://" + hostName + "/", html, "text/html", "UTF-8", null);
                internalNavigation = false;
                return;
            }
        }

        String path = Uri.parse(dumb).getEncodedPath();
        if (path == null || path.isEmpty()) path = "/";
        String query = Uri.parse(dumb).getEncodedQuery();
        String https = "https://" + hostName + path + (query == null ? "" : "?" + query);
        internalNavigation = true;
        loadUrl(https);
        internalNavigation = false;
    }

    private WebResourceResponse localResponse(Uri u) {
        String hostName = u.getHost();
        if (hostName == null) return null;
        File f = new File(getContext().getFilesDir(), "dumb-sites/" + safe(hostName) + "/index.html");
        if (!f.exists()) return null;
        try {
            return new WebResourceResponse("text/html", "UTF-8", new FileInputStream(f));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String toDumb(String url) {
        try {
            Uri u = Uri.parse(url);
            if (u.getHost() == null) return "";
            String path = u.getEncodedPath();
            if (path == null || path.isEmpty()) path = "/";
            return "dumb://" + u.getHost().toLowerCase(Locale.ROOT) + path
                    + (u.getEncodedQuery() == null ? "" : "?" + u.getEncodedQuery());
        } catch (Exception e) {
            return "";
        }
    }

    private static String normalize(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "dumb://une.developeit.dev/";
        String s = raw.trim();
        if (!s.contains("://")) s = "dumb://" + s;
        if (!s.startsWith("dumb://")) return "";
        try {
            Uri u = Uri.parse(s);
            if (u.getHost() == null) return "";
            String p = u.getEncodedPath();
            if (p == null || p.isEmpty()) p = "/";
            return "dumb://" + u.getHost().toLowerCase(Locale.ROOT) + p
                    + (u.getEncodedQuery() == null ? "" : "?" + u.getEncodedQuery());
        } catch (Exception e) {
            return "";
        }
    }

    private String readAsset(String path) {
        try (var in = getContext().getAssets().open(path)) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private static String readFile(File f) {
        try (FileInputStream in = new FileInputStream(f)) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private static String safe(String h) {
        return h.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "_");
    }
}
