package dev.dumbnavigator;

import android.content.Context;
import android.graphics.*;
import android.graphics.drawable.*;
import android.net.Uri;
import android.text.*;
import android.text.style.*;
import android.view.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

/**
 * Native DumbEngine. It deliberately does not use WebView, Chromium or GeckoView.
 * This is a real parser/layout/paint pipeline, not an HTML-to-WebView wrapper.
 */
public final class DumbEngine {
  public interface Host { void onUrl(String u); void onSpecial(String u); }
  private final Context c; private final Host host; private final DumbView view;
  private final ArrayList<String> back=new ArrayList<>(), forward=new ArrayList<>();
  private String current="dumb://une.developeit.dev/";

  public DumbEngine(Context c,Host h){this.c=c.getApplicationContext();host=h;view=new DumbView(c);view.engine=this;}
  public DumbView view(){return view;} public boolean canBack(){return !back.isEmpty();} public boolean canForward(){return !forward.isEmpty();}
  public void go(String raw){load(norm(raw),true);}
  public void back(){if(!back.isEmpty()){forward.add(current);load(back.remove(back.size()-1),false);}}
  public void forward(){if(!forward.isEmpty()){back.add(current);load(forward.remove(forward.size()-1),false);}}

  private void load(String u,boolean history){
    if(u.isEmpty())return;
    if(u.equals("dumb://une.developeit.dev/new")){host.onSpecial(u);return;}
    if(history&&!u.equals(current)){back.add(current);forward.clear();}
    current=u;host.onUrl(u);view.loading=true;view.invalidate();
    new Thread(()->{try{
      String html=Loader.get(c,u); Doc d=Parser.parse(html); d.base=u;
      view.post(()->{view.doc=d;view.loading=false;view.scroll=0;view.invalidate();});
    }catch(Exception e){
      Doc d=new Doc();d.base=u;N h=new N("h1",null,null);h.kids.add(new N("text","Dumb Engine no pudo cargar la página",null));d.root.add(h);
      N p=new N("p",null,null);p.kids.add(new N("text",String.valueOf(e.getMessage()),null));d.root.add(p);
      view.post(()->{view.doc=d;view.loading=false;view.invalidate();});
    }},"dumb-load").start();
  }

  private void click(String h){if(h==null||h.startsWith("#"))return;load(resolve(current,h),true);}
  private static String norm(String s){
    if(s==null||s.trim().isEmpty())return "dumb://une.developeit.dev/";
    s=s.trim();if(!s.contains("://"))s="dumb://"+s;if(!s.startsWith("dumb://"))return "";
    Uri u=Uri.parse(s);if(u.getHost()==null)return "";String p=u.getPath();if(p==null||p.isEmpty())p="/";
    return "dumb://"+u.getHost().toLowerCase(Locale.ROOT)+p+(u.getQuery()==null?"":"?"+u.getQuery())+(u.getFragment()==null?"":"#"+u.getFragment());
  }
  private static String resolve(String base,String href){
    if(href==null||href.isEmpty())return base;if(href.startsWith("#"))return base;if(href.startsWith("dumb://"))return norm(href);
    Uri b=Uri.parse(base);if(href.startsWith("/"))return norm("dumb://"+b.getHost()+href);
    String p=b.getPath()==null?"/":b.getPath();int i=p.lastIndexOf('/');return norm("dumb://"+b.getHost()+p.substring(0,i+1)+href);
  }

  static final class Loader{
    static String get(Context c,String u)throws Exception{
      String h=Uri.parse(u).getHost().toLowerCase(Locale.ROOT);
      if(h.equals("une.developeit.dev"))return asset(c,"developeit/index.html");
      File f=new File(c.getFilesDir(),"dumb-sites/"+safe(h)+"/index.html");if(f.exists())return read(f);
      String[] a=h.split("\\.");for(int i=1;i<a.length-1;i++){String p=String.join(".",Arrays.copyOfRange(a,i,a.length));f=new File(c.getFilesDir(),"dumb-sites/"+safe(p)+"/wildcard/index.html");if(f.exists())return read(f);}
      Uri x=Uri.parse(u);String remote="https://"+h+(x.getPath()==null?"/":x.getPath())+(x.getQuery()==null?"":"?"+x.getQuery());
      HttpURLConnection q=(HttpURLConnection)new URL(remote).openConnection();q.setConnectTimeout(10000);q.setReadTimeout(15000);q.setRequestProperty("User-Agent","dumbNavigator-DumbEngine/1.0");
      if(q.getResponseCode()>=400)throw new IOException("HTTP "+q.getResponseCode());try(InputStream in=q.getInputStream()){return new String(in.readAllBytes(),StandardCharsets.UTF_8);}
    }
    static void save(Context c,String host,String html,boolean wildcard)throws IOException{File d=new File(c.getFilesDir(),"dumb-sites/"+safe(host)+(wildcard?"/wildcard":""));if(!d.exists()&&!d.mkdirs())throw new IOException("mkdir");try(FileOutputStream o=new FileOutputStream(new File(d,"index.html"))){o.write(html.getBytes(StandardCharsets.UTF_8));}}
    static String safe(String h){return h.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]","_");}
    static String read(File f)throws IOException{try(InputStream i=new FileInputStream(f)){return new String(i.readAllBytes(),StandardCharsets.UTF_8);}}
    static String asset(Context c,String p)throws IOException{try(InputStream i=c.getAssets().open(p)){return new String(i.readAllBytes(),StandardCharsets.UTF_8);}}
  }

  static final class Style{float size=16;int color=Color.rgb(30,32,38);int bg=Color.TRANSPARENT;boolean bold=false,italic=false,underline=false;float marginTop=4,marginBottom=8,padding=0;String display="block";}
  static final class N{String tag,text,href,id,clazz,src;List<N> kids=new ArrayList<>();Style style;N(String t,String x,String h){tag=t;text=x;href=h;}}
  static final class Doc{List<N> root=new ArrayList<>();String css="",base="";}

  static final class Parser{
    static Doc parse(String source){
      Doc d=new Doc();String s=source==null?"":source.replace("\r","");
      Matcher sm=Pattern.compile("<style[^>]*>([\\s\\S]*?)</style>",Pattern.CASE_INSENSITIVE).matcher(s);StringBuffer sb=new StringBuffer();while(sm.find()){d.css+=sm.group(1)+"\n";sm.appendReplacement(sb,"");}sm.appendTail(sb);s=sb.toString();
      ArrayDeque<N> st=new ArrayDeque<>();N root=new N("root",null,null);st.push(root);
      Matcher m=Pattern.compile("<!--[\\s\\S]*?-->|<![^>]*>|<[^>]+>|[^<]+",Pattern.MULTILINE).matcher(s);
      while(m.find()){
        String t=m.group();if(t.startsWith("<!--")||t.startsWith("<!"))continue;
        if(t.startsWith("</")){if(st.size()>1)st.pop();continue;}
        if(t.startsWith("<")){
          Matcher x=Pattern.compile("<\\s*([A-Za-z0-9]+)([^>]*)>").matcher(t);if(!x.find())continue;String tag=x.group(1).toLowerCase(Locale.ROOT);String attrs=x.group(2);
          String href=attr(attrs,"href"),id=attr(attrs,"id"),cl=attr(attrs,"class"),src=attr(attrs,"src");N n=new N(tag,null,href);n.id=id;n.clazz=cl;n.src=src;n.style=new Style();applyStyle(n,d.css,attr(attrs,"style"));st.peek().kids.add(n);
          if(!Arrays.asList("meta","link","img","br","hr","input","source","area","base","embed","param","wbr").contains(tag))st.push(n);
        }else{String z=decode(t).replaceAll("\\s+"," ").trim();if(!z.isEmpty())st.peek().kids.add(new N("text",z,null));}
      }
      d.root=root.kids;return d;
    }
    static String attr(String a,String key){Matcher m=Pattern.compile("(?:^|\\s)"+Pattern.quote(key)+"\\s*=\\s*(?:\\\"([^\\\"]*)\\\"|'([^']*)'|([^\\s>]+))",Pattern.CASE_INSENSITIVE).matcher(a);if(!m.find())return null;return m.group(1)!=null?m.group(1):m.group(2)!=null?m.group(2):m.group(3);}
    static String decode(String s){return s.replace("&amp;","&").replace("&lt;","<").replace("&gt;",">").replace("&quot;","\"").replace("&#39;","'").replace("&nbsp;"," ");}
    static void applyStyle(N n,String css,String inline){String q="";if(css!=null){for(String rule:css.split("\\}")){int k=rule.indexOf('{');if(k<0)continue;String sel=rule.substring(0,k).trim();boolean hit=sel.equals(n.tag)||sel.equals("."+n.clazz)||sel.equals("#"+n.id);if(hit)q+=rule.substring(k+1);}}if(inline!=null)q+=inline;for(String z:q.split(";")){String[] p=z.split(":",2);if(p.length<2)continue;String k=p[0].trim().toLowerCase(Locale.ROOT),v=p[1].trim();try{if(k.equals("font-size"))n.style.size=Float.parseFloat(v.replace("px",""));else if(k.equals("color"))n.style.color=parseColor(v,n.style.color);else if(k.equals("background")||k.equals("background-color"))n.style.bg=parseColor(v,n.style.bg);else if(k.equals("font-weight"))n.style.bold=v.contains("bold")||Integer.parseInt(v)>=600;else if(k.equals("font-style"))n.style.italic=v.contains("italic");else if(k.equals("text-decoration"))n.style.underline=v.contains("underline");else if(k.equals("margin-top"))n.style.marginTop=Float.parseFloat(v.replace("px",""));else if(k.equals("margin-bottom"))n.style.marginBottom=Float.parseFloat(v.replace("px",""));else if(k.equals("padding"))n.style.padding=Float.parseFloat(v.replace("px",""));else if(k.equals("display"))n.style.display=v;}catch(Exception ignored){}}
    }
    static int parseColor(String v,int fallback){v=v.trim().toLowerCase(Locale.ROOT);try{if(v.startsWith("#"))return Color.parseColor(v);if(v.equals("transparent"))return Color.TRANSPARENT;if(v.equals("white"))return Color.WHITE;if(v.equals("black"))return Color.BLACK;if(v.equals("red"))return Color.RED;if(v.equals("blue"))return Color.BLUE;if(v.equals("green"))return Color.GREEN;}catch(Exception ignored){}return fallback;}
  }

  public final class DumbView extends View{
    DumbEngine engine;Doc doc=new Doc();Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);float scroll,down,last,content;boolean moved,loading;final ArrayList<Hit> hits=new ArrayList<>();
    DumbView(Context c){super(c);setBackgroundColor(Color.rgb(10,14,22));setFocusable(true);}
    protected void onDraw(Canvas c){super.onDraw(c);hits.clear();c.save();c.translate(0,-scroll);float y=24;for(N n:doc.root)y=draw(c,n,20,y,getWidth()-40);content=y+30;c.restore();if(loading){p.setColor(Color.rgb(120,160,255));c.drawRect(0,0,getWidth()/3f,3,p);}}
    float draw(Canvas c,N n,float x,float y,float max){
      if(n.style==null)n.style=new Style();
      if(n.style.display.equals("none"))return y;
      y+=n.style.marginTop;
      if(n.style.bg!=Color.TRANSPARENT){p.setColor(n.style.bg);c.drawRoundRect(x,y,max+x,y+Math.max(36,n.style.padding*2+36),14,14,p);}
      if(n.tag.equals("br"))return y+22;
      if(n.tag.equals("hr")){p.setColor(Color.rgb(65,75,92));c.drawRect(x,y,max+x,y+1,p);return y+15;}
      if(n.tag.equals("img")){Bitmap b=ImageCache.get(n.src);if(b!=null){float w=Math.min(max,b.getWidth());float h=w*b.getHeight()/Math.max(1,b.getWidth());c.drawBitmap(b,null,new RectF(x,y,x+w,y+h),p);return y+h+12;}p.setColor(Color.rgb(35,44,58));c.drawRoundRect(x,y,x+Math.min(300,max),y+180,16,16,p);p.setColor(Color.rgb(150,160,180));p.setTextSize(14);c.drawText("image",x+14,y+30,p);return y+192;}
      if(n.tag.equals("input")){p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);p.setColor(Color.rgb(70,85,110));c.drawRoundRect(x,y,x+Math.min(420,max),y+48,12,12,p);p.setStyle(Paint.Style.FILL);return y+60;}
      if(n.tag.equals("button")||n.tag.equals("a")){if(n.href!=null){p.setColor(Color.rgb(75,145,255));p.setUnderlineText(true);}else p.setColor(n.style.color);}
      if(n.tag.equals("text")){TextPaint tp=new TextPaint(Paint.ANTI_ALIAS_FLAG);tp.setColor(n.style.color);tp.setTextSize(n.style.size);tp.setTypeface(Typeface.create(Typeface.DEFAULT,n.style.bold?Typeface.BOLD:n.style.italic?Typeface.ITALIC:Typeface.NORMAL));if(n.style.underline)tp.setUnderlineText(true);StaticLayout s=new StaticLayout(n.text,tp,Math.max(1,(int)max),Layout.Alignment.ALIGN_NORMAL,1.15f,0,false);s.draw(c);return y+s.getHeight()+n.style.marginBottom;}
      if(n.tag.matches("h[1-6]")){n.style.bold=true;n.style.size=34-(Integer.parseInt(n.tag.substring(1))-1)*4;}
      float yy=y+n.style.padding;for(N k:n.kids)yy=draw(c,k,x+n.style.padding,yy,Math.max(1,max-n.style.padding*2));
      if(n.href!=null){hits.add(new Hit(n.href,new RectF(x,y,max+x,yy)));}
      return yy+n.style.marginBottom;
    }
    public boolean onTouchEvent(MotionEvent e){float y=e.getY();if(e.getAction()==MotionEvent.ACTION_DOWN){down=last=y;moved=false;return true;}if(e.getAction()==MotionEvent.ACTION_MOVE){float dy=last-y;if(Math.abs(y-down)>6)moved=true;scroll=Math.max(0,Math.min(Math.max(0,content-getHeight()),scroll+dy));last=y;invalidate();return true;}if(e.getAction()==MotionEvent.ACTION_UP&&!moved){float cy=y+scroll;for(Hit h:hits)if(h.r.contains(e.getX(),cy)){engine.click(h.href);return true;}}return true;}
    final class Hit{String href;RectF r;Hit(String h,RectF x){href=h;r=x;}}
  }
  static final class ImageCache{static final HashMap<String,Bitmap> cache=new HashMap<>();static Bitmap get(String src){if(src==null||src.isEmpty())return null;return cache.get(src);}}
}
