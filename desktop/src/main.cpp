#include <gtk/gtk.h>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

namespace {
const char* HOME_URL = "about:blank";

struct Browser {
    GtkWidget* window{};
    GtkWidget* address{};
    GtkWidget* title{};
    GtkWidget* view{};
    std::vector<std::string> history{HOME_URL};
    std::size_t history_index{0};
};

std::string html_escape(const std::string& s) {
    std::string out;
    for (char c : s) {
        if (c == '&') out += "&amp;";
        else if (c == '<') out += "&lt;";
        else if (c == '>') out += "&gt;";
        else if (c == '\"') out += "&quot;";
        else out += c;
    }
    return out;
}

std::string normalize(std::string input) {
    while (!input.empty() && std::isspace(static_cast<unsigned char>(input.front()))) input.erase(input.begin());
    while (!input.empty() && std::isspace(static_cast<unsigned char>(input.back()))) input.pop_back();
    if (input.empty()) return HOME_URL;
    if (input.rfind("dumb://", 0) != 0) input = "dumb://uuu." + input;
    return input;
}

std::string built_in(const std::string& url) {
    auto path = std::string("app/src/main/assets/developeit/index.html");
    if (url.find("/new") != std::string::npos) path = "app/src/main/assets/developeit/new/index.html";
    else if (url.find("/help") != std::string::npos) path = "app/src/main/assets/developeit/help/index.html";
    else if (url.find("/about") != std::string::npos) path = "app/src/main/assets/developeit/about/index.html";
    else if (url.find("/studio") != std::string::npos) path = "app/src/main/assets/developeit/studio/index.html";
    else if (url.find("/docs") != std::string::npos) path = "app/src/main/assets/developeit/docs/index.html";
    else if (url.find("/gallery") != std::string::npos) path = "app/src/main/assets/developeit/gallery/index.html";
    else if (url.find("/calculator") != std::string::npos) path = "app/src/main/assets/developeit/calculator/index.html";
    else if (url.find("/notes") != std::string::npos) path = "app/src/main/assets/developeit/notes/index.html";
    std::ifstream file(path);
    if (!file) return "<h1>dumbNavigator</h1><p>No se pudo encontrar la página interna.</p>";
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

void render(Browser* b, const std::string& raw, bool push_history = true) {
    const auto url = normalize(raw);
    if (push_history) {
        if (b->history_index + 1 < b->history.size()) b->history.erase(b->history.begin() + b->history_index + 1, b->history.end());
        if (b->history.empty() || b->history.back() != url) b->history.push_back(url);
        b->history_index = b->history.size() - 1;
    }
    gtk_entry_set_text(GTK_ENTRY(b->address), url.c_str());
    gtk_label_set_text(GTK_LABEL(b->title), url.c_str());
    const std::string html = built_in(url);
    std::string body = "<html><body style='background:#0b1018;color:#edf3ff;font:16px sans-serif;padding:32px'>" + html + "</body></html>";
    gtk_label_set_text(GTK_LABEL(b->view), body.c_str());
}

void go_clicked(GtkWidget*, gpointer data) { auto* b = static_cast<Browser*>(data); render(b, gtk_entry_get_text(GTK_ENTRY(b->address))); }
void home_clicked(GtkWidget*, gpointer data) { render(static_cast<Browser*>(data), HOME_URL); }
void back_clicked(GtkWidget*, gpointer data) { auto* b = static_cast<Browser*>(data); if (b->history_index > 0) { --b->history_index; render(b, b->history[b->history_index], false); } }
void forward_clicked(GtkWidget*, gpointer data) { auto* b = static_cast<Browser*>(data); if (b->history_index + 1 < b->history.size()) { ++b->history_index; render(b, b->history[b->history_index], false); } }
void address_activate(GtkWidget*, gpointer data) { go_clicked(nullptr, data); }

} // namespace

int main(int argc, char** argv) {
    gtk_init(&argc, &argv);
    Browser b;
    b.window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_default_size(GTK_WINDOW(b.window), 1120, 760);
    gtk_window_set_title(GTK_WINDOW(b.window), "dumbNavigator for Debian");
    g_signal_connect(b.window, "destroy", G_CALLBACK(gtk_main_quit), nullptr);

    auto* root = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    auto* tabs = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    gtk_widget_set_margin_start(tabs, 10); gtk_widget_set_margin_end(tabs, 10);
    gtk_widget_set_margin_top(tabs, 8); gtk_widget_set_margin_bottom(tabs, 8);
    b.title = gtk_label_new("Nueva pestaña");
    gtk_box_pack_start(GTK_BOX(tabs), b.title, FALSE, FALSE, 0);

    auto* toolbar = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
    b.address = gtk_entry_new();
    gtk_entry_set_text(GTK_ENTRY(b.address), HOME_URL);
    gtk_box_pack_start(GTK_BOX(toolbar), b.address, TRUE, TRUE, 0);
    const char* labels[] = {"←", "→", "⌂", "Ir"};
    void (*callbacks[])(GtkWidget*, gpointer) = {back_clicked, forward_clicked, home_clicked, go_clicked};
    for (int i = 0; i < 4; ++i) {
        auto* button = gtk_button_new_with_label(labels[i]);
        g_signal_connect(button, "clicked", G_CALLBACK(callbacks[i]), &b);
        gtk_box_pack_end(GTK_BOX(toolbar), button, FALSE, FALSE, 0);
    }

    b.view = gtk_label_new("");
    gtk_label_set_selectable(GTK_LABEL(b.view), TRUE);
    gtk_label_set_line_wrap(GTK_LABEL(b.view), TRUE);
    auto* scroll = gtk_scrolled_window_new(nullptr, nullptr);
    gtk_container_add(GTK_CONTAINER(scroll), b.view);

    gtk_box_pack_start(GTK_BOX(root), tabs, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(root), toolbar, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(root), scroll, TRUE, TRUE, 0);
    gtk_container_add(GTK_CONTAINER(b.window), root);
    g_signal_connect(b.address, "activate", G_CALLBACK(address_activate), &b);
    render(&b, argc > 1 ? argv[1] : HOME_URL);
    gtk_widget_show_all(b.window);
    gtk_main();
    return 0;
}
