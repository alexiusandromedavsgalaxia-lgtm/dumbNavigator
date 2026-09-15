package dev.dumbnavigator;

import android.content.Context;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

final class SiteManager {
    static final class SiteInfo {
        final String host;
        final long bytes;
        final boolean wildcard;
        SiteInfo(String host, long bytes, boolean wildcard) { this.host = host; this.bytes = bytes; this.wildcard = wildcard; }
    }
    private final File root;
    SiteManager(Context context) { root = new File(context.getFilesDir(), "dumb-sites"); }
    void save(String host, String html, boolean wildcard) throws IOException {
        File dir = new File(root, safe(host));
        File target = wildcard ? new File(new File(dir, "wildcard"), "index.html") : new File(dir, "index.html");
        File parent = target.getParentFile();
        if (!parent.exists() && !parent.mkdirs()) throw new IOException("no se pudo crear el sitio");
        try (FileOutputStream out = new FileOutputStream(target)) { out.write(html.getBytes(StandardCharsets.UTF_8)); }
    }
    String read(String host, String relative) throws IOException {
        File f = new File(new File(root, safe(host)), relative);
        if (!f.exists() || !f.isFile()) return null;
        return readFile(f);
    }
    List<SiteInfo> list() {
        if (!root.exists()) return Collections.emptyList();
        File[] dirs = root.listFiles(File::isDirectory);
        if (dirs == null) return Collections.emptyList();
        List<SiteInfo> out = new ArrayList<>();
        for (File d : dirs) {
            File normal = new File(d, "index.html");
            File wild = new File(new File(d, "wildcard"), "index.html");
            File chosen = normal.exists() ? normal : wild;
            if (chosen.exists()) out.add(new SiteInfo(d.getName(), chosen.length(), wild.exists() && !normal.exists()));
        }
        return out;
    }
    void delete(String host) throws IOException { deleteTree(new File(root, safe(host))); }
    long totalBytes() { return size(root); }
    private static String readFile(File f) throws IOException {
        try (FileInputStream in = new FileInputStream(f)) { ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] b = new byte[8192]; int n; while ((n = in.read(b)) != -1) out.write(b, 0, n); return out.toString(StandardCharsets.UTF_8.name()); }
    }
    private static String safe(String h) { return h.toLowerCase().replaceAll("[^a-z0-9._-]", "_"); }
    private static long size(File f) { if (!f.exists()) return 0; if (f.isFile()) return f.length(); File[] xs = f.listFiles(); long n = 0; if (xs != null) for (File x : xs) n += size(x); return n; }
    private static void deleteTree(File f) throws IOException { if (!f.exists()) return; File[] xs = f.listFiles(); if (xs != null) for (File x : xs) deleteTree(x); if (!f.delete()) throw new IOException("no se pudo borrar el sitio"); }
}
