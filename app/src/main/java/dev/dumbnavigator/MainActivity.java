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
    @Override public void onCreate(Bundle b){super.onCreate(b);setContentView(R.layout.activity_main);address=findViewById(R.id.address);engine=new ChromiumEngine(this,this);((FrameLayout)findViewById(R.id.engine)).addView(engine,new FrameLayout.LayoutParams(-1,-1));findViewById(R.id.go).setOnClickListener(v->engine.go(address.getText().toString()));findViewById(R.id.back).setOnClickListener(v->engine.backPage());findViewById(R.id.forward).setOnClickListener(v->engine.forwardPage());String initial=getIntent().getDataString();engine.go(initial==null?"dumb://uuu.une.developeit.dev/":initial);}
    @Override public void onUrl(String u){runOnUiThread(()->{address.setText(u);address.setSelection(address.length());findViewById(R.id.back).setEnabled(engine.canGoBackDumb());findViewById(R.id.forward).setEnabled(engine.canGoForwardDumb());});}
    @Override public void onPublish(String raw,String html,boolean wildcard){runOnUiThread(()->{
        final String h=DumbDomains.publicInternalHost(raw);
        if(h.isEmpty()){Toast.makeText(this,"dominio no válido",Toast.LENGTH_SHORT).show();return;}
        if(DumbDomains.isReserved(h)){Toast.makeText(this,"ese dominio está reservado y no se puede crear",Toast.LENGTH_LONG).show();return;}
        final String page=(html==null||html.trim().isEmpty())?"<!doctype html><html><body><h1>"+h+"</h1><p>mi web dumb ✨</p></body></html>":html;
        try{DumbEngine.Loader.save(getApplicationContext(),h,page,wildcard);Toast.makeText(this,"web publicada: dumb://"+h+"/",Toast.LENGTH_LONG).show();engine.go("dumb://"+h+"/");}
        catch(IOException e){Toast.makeText(this,"no se pudo publicar: "+e.getMessage(),Toast.LENGTH_LONG).show();}
    });}
    @Override public void onBackPressed(){if(engine!=null&&engine.canGoBackDumb())engine.backPage();else super.onBackPressed();}
}
