package dev.dumbnavigator;

import java.util.ArrayList;
import java.util.List;

final class Tab {
    String url;
    String title = "Nueva pestaña";
    final List<String> history = new ArrayList<>();
    int historyIndex = -1;
    Tab(String initial) { navigate(initial); }
    void navigate(String next) {
        while (history.size() > historyIndex + 1) history.remove(history.size() - 1);
        history.add(next);
        historyIndex = history.size() - 1;
        url = next;
    }
    boolean canBack() { return historyIndex > 0; }
    boolean canForward() { return historyIndex >= 0 && historyIndex + 1 < history.size(); }
    String back() { if (!canBack()) return url; historyIndex--; return url = history.get(historyIndex); }
    String forward() { if (!canForward()) return url; historyIndex++; return url = history.get(historyIndex); }
}
