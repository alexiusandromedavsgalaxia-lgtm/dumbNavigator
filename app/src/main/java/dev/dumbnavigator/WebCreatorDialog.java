package dev.dumbnavigator;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.text.InputType;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.IOException;

/** Native site composer used by dumb://.../new. */
public final class WebCreatorDialog {
    private WebCreatorDialog() {}

    public static void show(Context context, BrowserController controller) {
        LinearLayout box = BrowserUi.vertical(context);
        TextView hint = new TextView(context);
        hint.setText("Crea una página que viva dentro del universo dumb://");
        hint.setTextColor(Color.rgb(158, 171, 193));
        hint.setTextSize(14);
        box.addView(hint);

        EditText domain = field(context, "dominio, por ejemplo miweb.uuu");
        box.addView(domain, match());
        EditText html = field(context, "HTML de tu página");
        html.setGravity(android.view.Gravity.TOP | android.view.Gravity.START);
        html.setMinLines(9);
        html.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        box.addView(html, match(0, 190));
        CheckBox wildcard = new CheckBox(context);
        wildcard.setText("usar también como dominio comodín");
        wildcard.setTextColor(Color.rgb(218, 225, 239));
        box.addView(wildcard);

        new AlertDialog.Builder(context)
                .setTitle("crear una web")
                .setView(box)
                .setNegativeButton("cancelar", null)
                .setPositiveButton("publicar", (dialog, which) -> {
                    try {
                        controller.publish(domain.getText().toString(), html.getText().toString(), wildcard.isChecked());
                        android.widget.Toast.makeText(context, "web publicada", android.widget.Toast.LENGTH_SHORT).show();
                    } catch (IOException e) {
                        android.widget.Toast.makeText(context, e.getMessage(), android.widget.Toast.LENGTH_LONG).show();
                    }
                })
                .show();
    }

    private static EditText field(Context c, String hint) {
        EditText v = new EditText(c);
        v.setHint(hint);
        v.setTextColor(Color.WHITE);
        v.setHintTextColor(Color.rgb(122, 136, 159));
        v.setSingleLine(false);
        v.setPadding(BrowserUi.dp(c, 14), BrowserUi.dp(c, 10), BrowserUi.dp(c, 14), BrowserUi.dp(c, 10));
        return v;
    }

    private static ViewGroup.LayoutParams match() { return match(-1, -2); }
    private static ViewGroup.LayoutParams match(int width, int height) {
        return new LinearLayout.LayoutParams(width, height);
    }
}
