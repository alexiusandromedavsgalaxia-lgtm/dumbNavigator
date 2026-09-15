package dev.dumbnavigator;

import java.util.*;

/** Internal dumb:// namespace registry. It never resolves hosts through the public Internet. */
final class DomainRegistry {
    private static final Set<String> RESERVED = new HashSet<>(Arrays.asList(
        "google.com","youtube.com","microsoft.com","apple.com","amazon.com","facebook.com",
        "instagram.com","tiktok.com","x.com","twitter.com","github.com","gitlab.com",
        "wikipedia.org","reddit.com","discord.com","whatsapp.com","telegram.org",
        "openai.com","netflix.com","spotify.com","roblox.com","paypal.com","adobe.com",
        "samsung.com","sony.com","nintendo.com","xbox.com","playstation.com"
    ));

    static boolean isReserved(String host) {
        if (host == null) return true;
        String h = host.toLowerCase(Locale.ROOT).trim();
        for (String r : RESERVED) if (h.equals(r) || h.endsWith("." + r)) return true;
        return false;
    }

    static boolean validHost(String host) {
        if (host == null || host.length() < 1 || host.length() > 253 || isReserved(host)) return false;
        if (host.startsWith("uuu.") || host.startsWith("jit.")) host = host.substring(4);
        if (host.isEmpty() || host.startsWith(".") || host.endsWith(".")) return false;
        for (String label : host.split("\\.", -1)) {
            if (label.isEmpty() || label.length() > 63 || label.startsWith("-") || label.endsWith("-")) return false;
            if (!label.matches("[a-zA-Z0-9-]+")) return false;
        }
        return true;
    }

    static String normalize(String input) {
        if (input == null) return "";
        String h = input.trim().toLowerCase(Locale.ROOT);
        if (h.startsWith("dumb://")) h = h.substring(7);
        if (h.startsWith("uuu.") || h.startsWith("jit.")) return h;
        return "uuu." + h;
    }

    private DomainRegistry() {}
}
