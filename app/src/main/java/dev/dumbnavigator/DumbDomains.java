package dev.dumbnavigator;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Internal dumbNavigator namespace. These names never consult public DNS. */
final class DumbDomains {
    static final String DEFAULT_PREFIX = "uuu";
    static final Set<String> PREFIXES = new HashSet<>(Arrays.asList("uuu", "jit"));
    private static final Set<String> RESERVED = new HashSet<>(Arrays.asList(
        "google.com","google.es","google.co.uk","google.de","google.fr",
        "microsoft.com","apple.com","amazon.com","amazon.es","meta.com","facebook.com","instagram.com",
        "youtube.com","youtu.be","x.com","twitter.com","tiktok.com","netflix.com","spotify.com",
        "adobe.com","nvidia.com","intel.com","amd.com","samsung.com","sony.com","nintendo.com",
        "playstation.com","xbox.com","roblox.com","minecraft.net","mojang.com","discord.com",
        "telegram.org","whatsapp.com","github.com","gitlab.com","cloudflare.com","openai.com",
        "wikipedia.org","reddit.com","linkedin.com","paypal.com","ebay.com","booking.com",
        "airbnb.com","uber.com","ikea.com","nike.com","coca-cola.com","pepsi.com","mcdonalds.com",
        "starbucks.com","bbc.com","cnn.com","nytimes.com","reuters.com","walmart.com","tesla.com",
        "ibm.com","oracle.com","salesforce.com","shopify.com","wordpress.com","wordpress.org",
        "mozilla.org","firefox.com","opera.com","samsung.com","huawei.com","xiaomi.com"
    ));

    static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw.trim().toLowerCase(Locale.ROOT).replaceFirst("^dumb://", "");
        if (s.contains("/") || s.contains("?") || s.contains("#") || s.contains(":")) return "";
        if (s.isEmpty()) return "";
        String[] labels = s.split("\\.");
        if (labels.length < 2 || labels.length > 20) return "";
        for (String label : labels) if (!label.matches("[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?")) return "";
        if (PREFIXES.contains(labels[0])) return s;
        return DEFAULT_PREFIX + "." + s;
    }

    static boolean hasPrefix(String host) {
        if (host == null) return false;
        int dot = host.indexOf('.');
        return dot > 0 && PREFIXES.contains(host.substring(0, dot));
    }

    static boolean isReserved(String host) {
        if (host == null) return true;
        String h = host.toLowerCase(Locale.ROOT);
        if (h.equals("une.developeit.dev") || h.equals("uuu.une.developeit.dev")) return true;
        String bare = hasPrefix(h) ? h.substring(h.indexOf('.') + 1) : h;
        if (RESERVED.contains(bare)) return true;
        for (String r : RESERVED) if (bare.endsWith("." + r)) return true;
        return false;
    }

    static boolean canCreate(String raw) {
        String h = normalize(raw);
        return !h.isEmpty() && hasPrefix(h) && !isReserved(h);
    }

    static String publicInternalHost(String raw) {
        return normalize(raw);
    }
}
