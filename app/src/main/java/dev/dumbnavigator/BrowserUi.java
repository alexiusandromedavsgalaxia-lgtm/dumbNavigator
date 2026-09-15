package dev.dumbnavigator;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Reusable browser chrome styling. Keeps Activity code focused on lifecycle wiring. */
public final class BrowserUi {
    private BrowserUi() {}

    public static void styleAction(Button button, boolean primary) {
        button.setAllCaps(false);
        button.setTextColor(Color.rgb(239, 244, 255));
        button.setTextSize(17);
        button.setGravity(Gravity.CENTER);
        button.setPadding(0, 0, 0, 0);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(primary ? Color.rgb(48, 67, 94) : Color.rgb(25, 33, 47));
        bg.setCornerRadius(dp(button.getContext(), 13));
        button.setBackground(bg);
        button.setStateListAnimator(null);
        button.setMinHeight(0);
        button.setMinWidth(0);
    }

    public static TextView makeSectionTitle(Context context, String title) {
        TextView v = new TextView(context);
        v.setText(title);
        v.setTextColor(Color.rgb(231, 237, 249));
        v.setTextSize(12);
        v.setTypeface(null, android.graphics.Typeface.BOLD);
        v.setLetterSpacing(.08f);
        v.setPadding(dp(context, 16), dp(context, 10), dp(context, 16), dp(context, 6));
        return v;
    }

    public static LinearLayout vertical(Context context) {
        LinearLayout layout = new LinearLayout(context);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dp(context, 12), dp(context, 10), dp(context, 12), dp(context, 10));
        return layout;
    }

    public static int dp(Context c, float value) {
        return Math.round(value * c.getResources().getDisplayMetrics().density);
    }
}
