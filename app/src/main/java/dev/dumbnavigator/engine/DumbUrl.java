package dev.dumbnavigator.engine;

import java.util.Locale;

/** Native dumb:// URL parser. No HTTP engine involved. */
public final class DumbUrl {
    public final String host;
    public final String path;
    public final String query;
    public final String fragment;

    private DumbUrl(String host, String path, String query, String fragment) {
        this.host = host.toLowerCase(Locale.ROOT);
        this.path = path.isEmpty() ? "/" : (path.startsWith("/") ? path : "/" + path);
        this.query = query;
        this.fragment = fragment;
    }

    public static DumbUrl parse(String raw) {
        String s = raw == null ? "" : raw.trim();
        if (s.startsWith("dumb://")) s = s.substring(7);
        int hash = s.indexOf('#');
        String fragment = hash >= 0 ? s.substring(hash + 1) : "";
        if (hash >= 0) s = s.substring(0, hash);
        int q = s.indexOf('?');
        String query = q >= 0 ? s.substring(q + 1) : "";
        if (q >= 0) s = s.substring(0, q);
        int slash = s.indexOf('/');
        String host = slash >= 0 ? s.substring(0, slash) : s;
        String path = slash >= 0 ? s.substring(slash) : "/";
        return new DumbUrl(host, path, query, fragment);
    }

    public String origin() { return "dumb://" + host; }
    public String toString() {
        return "dumb://" + host + path + (query.isEmpty() ? "" : "?" + query) + (fragment.isEmpty() ? "" : "#" + fragment);
    }
}
