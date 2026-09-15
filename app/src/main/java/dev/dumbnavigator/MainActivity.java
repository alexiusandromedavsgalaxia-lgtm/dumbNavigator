package dev.dumbnavigator;

import android.app.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.util.*;

public class MainActivity extends Activity implements ChromiumEngine.Host {
    private ChromiumEngine engine;
    private EditText address;

    @Override
    public void onCreate(Bundle b) {
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        address = findViewById(R.id.address);
        engine = new ChromiumEngine(this, this);
        ((FrameLayout) findViewById(R.id.engine)).addView(engine,
                new FrameLayout.LayoutParams(-1, -1));

        findViewById(R.id.go).setOnClickListener(v -> engine.go(address.getText().toString()));
        findViewById(R.id.back).setOnClickListener(v -> engine.backPage());
        findViewById(R.id.forward).setOnClickListener(v -> engine.forwardPage());

        String initial = getIntent().getDataString();
        engine.go(initial == null ? "dumb://une.developeit.dev/" : initial);
    }

    @Override
    public void onUrl(String u) {
        runOnUiThread(() -> {
            address.setText(u);
            address.setSelection(address.length());
            findViewById(R.id.back).setEnabled(engine.canGoBackDumb());
            findViewById(R.id.forward).setEnabled(engine.canGoForwardDumb());
        });
    }

    private void newSite() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(24, 24, 24, 24);

        EditText domain = new EditText(this);
        domain.setHint("dominio, ej. miweb.example");
        box.addView(domain);

        EditText html = new EditText(this);
        html.setHint("HTML de tu página");
        html.setGravity(Gravity.TOP);
        html.setMinLines(10);
        box.addView(html);

        CheckBox wildcard = new CheckBox(this);
        wildcard.setText("permitir todos los subdominios");
        box.addView(wildcard);

        new AlertDialog.Builder(this)
                .setTitle("crear web gratis")
                .setMessage("cualquier ruta /algo carga la página principal")
                .setView(box)
                .setNegativeButton("cancelar", null)
                .setPositiveButton("publicar", (d, x) ->
                        publish(domain.getText().toString(), html.getText().toString(), wildcard.isChecked()))
                .show();
    }

    private void publish(String raw, String html, boolean wildcard) {
        String h = raw.trim().toLowerCase(Locale.ROOT)
                .replaceFirst("^dumb://", "").split("/", 2)[0];
        if (h.isEmpty()) h = "miweb.dumb";
        if (!h.matches("[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?")) {
            Toast.makeText(this, "dominio no válido", Toast.LENGTH_SHORT).show();
            return;
        }
        if (html.trim().isEmpty()) {
            html = "<!doctype html><html><body><h1>" + h
                    + "</h1><p>mi primera web dumb ✨</p></body></html>";
        }
        try {
            DumbEngine.Loader.save(getApplicationContext(), h, html, wildcard);
            engine.go("dumb://" + h + "/");
        } catch (IOException e) {
            Toast.makeText(this, "no se pudo publicar", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        if (engine != null && engine.canGoBackDumb()) engine.backPage();
        else super.onBackPressed();
    }
}
