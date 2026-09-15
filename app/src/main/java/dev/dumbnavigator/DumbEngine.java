package dev.dumbnavigator;

import android.content.Context;
import android.graphics.*;
import android.net.Uri;
import android.text.Layout;
import android.text.TextPaint;
import android.text.StaticLayout;
import android.view.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/** Native HTML/CSS parser, layout and Canvas renderer. No WebView/Chromium/GeckoView. */
public final class DumbEngine {
  public interface Host { void onUrl(String u); void onSpecial(String u); }
  private final Context c; private final Host host; private final DumbView view;
  private final ArrayList<String> back=new ArrayList<>(), forward=new ArrayList<>();
  private String current="dumb://une.developeit.dev/";
  public DumbEngine(Context c,Host h){this.c=c.getApplicationContext();host=h;view=new DumbView(c);view.engine=this;}
  public DumbView view(){return view;} public boolean canBack(){return !back.isEmpty();} public boolean canForward(){return !forward.isEmpty();}
  public void go(String raw){load(norm(raw),true);} public void back(){if(!back.isEmpty()){forward.add(current);load(back.remove(back.size()-1),false);}}
  public void forward(){if(!forward.isEmpty()){back.add(current);load(forward.remove(forward.size()-1),false);}}
  private void load(String u,boolean history){
    if(u.isEmpty())return;if(u.equals("dumb://une.developeit.dev/new")){host.onSpecial(u);return;}
    if(history&&!u.equals(current)){back.add(current);forward.clear();} current=u;host.onUrl(u);view.loading=true;view.invalidate();
    new Thread(()->{try{String html=Loader.get(c,u);Doc d=Parser.parse(html);d.base=u;view.post(()->{view.doc=d;view.loading=false;view.scroll=0;view.invalidate();});}
      catch(Exception e){Doc d=Parser.error("Dumb Engine no pudo cargar la página",String.valueOf(e.getMessage()));view.post(()->{view.doc=d;view.loading=false;view.invalidate();});}},"dumb-load").start();
  }
  private void click(String h){if(h==null||h.startsWith("#"))return;load(resolve(current,h),true);}
  private static String norm(String s){
    if(s==null||s.trim().isEmpty())return "dumb://une.developeit.dev/";s=s.trim();if(!s.contains("://"))s="dumb://"+s;if(!s.startsWith("dumb://"))return "";
    Uri u=Uri.parse(s);if(u.getHost()==null)return "";String p=u.getEncodedPath();if(p==null||p.isEmpty())p="/";
    return "dumb://"+u.getHost().toLowerCase(Locale.ROOT)+p+(u.getEncodedQuery()==null?"":"?"+u.getEncodedQuery())+(u.getEncodedFragment()==null?"":"#"+u.getEncodedFragment());
  }
  private static String resolve(String base,String href){
    if(href==null||href.trim().isEmpty())return base;href=href.trim();if(href.startsWith("#"))return base;if(href.startsWith("dumb://"))return norm(href);
    Uri b=Uri.parse(base);String host=b.getHost();if(href.startsWith("/"))return norm("dumb://"+host+href);
    String p=b.getPath()==null?"/":b.getPath();int i=p.lastIndexOf('/');return norm("dumb://"+host+p.substring(0,i+1)+href);
  }

  static final class Loader{
    static String get(Context c,String u)throws Exception{
      String h=Uri.parse(u).getHost().toLowerCase(Locale.ROOT);
      if(h.equals("une.developeit.dev"))return asset(c,"developeit/index.html");
      File f=new File(c.getFilesDir(),"dumb-sites/"+safe(h)+"/index.html");if(f.exists())return read(f);
      String[] a=h.split("\\.");for(int i=1;i<a.length-1;i++){String p=String.join(".",Arrays.copyOfRange(a,i,a.length));f=new File(c.getFilesDir(),"dumb-sites/"+safe(p)+"/wildcard/index.html");if(f.exists())return read(f);}
      Uri x=Uri.parse(u);String remote="https://"+h+(x.getEncodedPath()==null?"/":x.getEncodedPath())+(x.getEncodedQuery()==null?"":"?"+x.getEncodedQuery());
      HttpURLConnection q=(HttpURLConnection)new URL(remote).openConnection();q.setConnectTimeout(10000);q.setReadTimeout(15000);q.setInstanceFollowRedirects(true);q.setRequestProperty("User-Agent","dumbNavigator/0.3 DumbEngine");
      if(q.getResponseCode()>=400)throw new IOException("HTTP "+q.getResponseCode());try(InputStream in=q.getInputStream()){return new String(in.readAllBytes(),StandardCharsets.UTF_8);}
    }
    static void save(Context c,String host,String html,boolean wildcard)throws IOException{File d=new File(c.getFilesDir(),"dumb-sites/"+safe(host)+(wildcard?"/wildcard":""));if(!d.exists()&&!d.mkdirs())throw new IOException("mkdir");try(FileOutputStream o=new FileOutputStream(new File(d,"index.html"))){o.write(html.getBytes(StandardCharsets.UTF_8));}}
    static String safe(String h){return h.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]","_");}
    static String read(File f)throws IOException{try(InputStream i=new FileInputStream(f)){return new String(i.readAllBytes(),StandardCharsets.UTF_8);}}
    static String asset(Context c,String p)throws IOException{try(InputStream i=c.getAssets().open(p)){return new String(i.readAllBytes(),StandardCharsets.UTF_8);}}
    static byte[] bytes(String u)throws Exception{HttpURLConnection q=(HttpURLConnection)new URL(u).openConnection();q.setConnectTimeout(10000);q.setReadTimeout(15000);q.setRequestProperty("User-Agent","dumbNavigator/0.3");if(q.getResponseCode()>=400)throw new IOException("HTTP "+q.getResponseCode());try(InputStream i=q.getInputStream()){return i.readAllBytes();}}
  }

  static final class Style{
    float size=16,marginTop=0,marginBottom=8,padding=0,gap=8;int color=Color.rgb(30,32,38),bg=Color.TRANSPARENT;
    boolean bold=false,italic=false,underline=false;String display="block",align="left",width="auto";
    Style copy(){Style s=new Style();s.size=size;s.marginTop=marginTop;s.marginBottom=marginBottom;s.padding=padding;s.gap=gap;s.color=color;s.bg=bg;s.bold=bold;s.italic=italic;s.underline=underline;s.display=display;s.align=align;s.width=width;return s;}
    void inherit(Style p){color=p.color;size=p.size;bold=p.bold;italic=p.italic;underline=p.underline;}
  }
  static final class Rule{String sel,body;int specificity;Rule(String s,String b){sel=s.trim();body=b;specificity=specificity(sel);}static int specificity(String s){int n=0;for(String z:s.split("\\s+|>")){if(z.startsWith("#"))n+=100;else if(z.startsWith("."))n+=10;else n++;}return n;}}
  static final class N{String tag,text,href,id,clazz,src,value;List<N> kids=new ArrayList<>();Style style;N(String t,String x,String h){tag=t;text=x;href=h;}}
  static final class Doc{List<N> root=new ArrayList<>();List<Rule> rules=new ArrayList<>();String base="";}

  static final class Parser{
    static Doc parse(String source){
      Doc d=new Doc();String s=(source==null?"":source).replace("\r","").replaceAll("<!--[\\s\\S]*?-->","");
      Matcher sm=Pattern.compile("<style[^>]*>([\\s\\S]*?)</style>",Pattern.CASE_INSENSITIVE).matcher(s);StringBuffer sb=new StringBuffer();while(sm.find()){parseRules(sm.group(1),d.rules);sm.appendReplacement(sb,"");}sm.appendTail(sb);s=sb.toString();
      ArrayDeque<N> st=new ArrayDeque<>();N root=new N("root",null,null);root.style=new Style();st.push(root);
      Matcher m=Pattern.compile("<![^>]*>|</?[^>]+>|[^<]+",Pattern.MULTILINE).matcher(s);
      while(m.find()){
        String t=m.group();if(t.startsWith("<!"))continue;if(t.startsWith("</")){if(st.size()>1)st.pop();continue;}
        if(t.startsWith("<")){Matcher x=Pattern.compile("<\\s*([A-Za-z0-9]+)([^>]*)>").matcher(t);if(!x.find())continue;String tag=x.group(1).toLowerCase(Locale.ROOT),a=x.group(2);
          N n=new N(tag,null,attr(a,"href"));n.id=attr(a,"id");n.clazz=attr(a,"class");n.src=attr(a,"src");n.value=attr(a,"value");n.style=new Style();apply(n,d.rules,attr(a,"style"));st.peek().kids.add(n);if(!voidTag(tag))st.push(n);
        }else{String z=decode(t).replaceAll("[\\t\\n\\r ]+"," ");if(!z.trim().isEmpty()){N n=new N("text",z,null);n.style=new Style();st.peek().kids.add(n);}}
      }
      inherit(root,new Style());d.root=root.kids;return d;
    }
    static boolean voidTag(String t){return Arrays.asList("meta","link","img","br","hr","input","source","area","base","embed","param","wbr","track","col").contains(t);}
    static void parseRules(String css,List<Rule> out){for(String z:css.split("\\}")){int k=z.indexOf('{');if(k<0)continue;String b=z.substring(k+1).trim();for(String sel:z.substring(0,k).split(","))if(!sel.trim().isEmpty())out.add(new Rule(sel,b));}}
    static void inherit(N n,Style parent){if(n.style==null)n.style=parent.copy();else if(n.tag.equals("text"))n.style.inherit(parent);for(N k:n.kids)inherit(k,n.style);}
    static boolean matches(N n,String sel){sel=sel.trim();if(sel.contains(">"))sel=sel.substring(sel.lastIndexOf('>')+1).trim();if(sel.contains(" "))sel=sel.substring(sel.lastIndexOf(' ')+1).trim();if(sel.equals("*"))return true;if(sel.startsWith("#"))return sel.substring(1).equals(n.id);if(sel.startsWith("."))return n.clazz!=null&&Arrays.asList(n.clazz.split("\\s+")).contains(sel.substring(1));return sel.equalsIgnoreCase(n.tag);}
    static void apply(N n,List<Rule> rules,String inline){ArrayList<Rule> hit=new ArrayList<>();for(Rule r:rules)if(matches(n,r.sel))hit.add(r);hit.sort(Comparator.comparingInt(a->a.specificity));String q="";for(Rule r:hit)q+=r.body+";";if(inline!=null)q+=inline;for(String z:q.split(";")){String[] p=z.split(":",2);if(p.length<2)continue;String k=p[0].trim().toLowerCase(Locale.ROOT),v=p[1].trim();try{
      if(k.equals("font-size"))n.style.size=unit(v,n.style.size);else if(k.equals("color"))n.style.color=parseColor(v,n.style.color);else if(k.equals("background")||k.equals("background-color"))n.style.bg=parseColor(v,n.style.bg);
      else if(k.equals("font-weight"))n.style.bold=v.equalsIgnoreCase("bold")||v.matches("[6-9]00");else if(k.equals("font-style"))n.style.italic=v.contains("italic");else if(k.equals("text-decoration"))n.style.underline=v.contains("underline");
      else if(k.equals("margin-top"))n.style.marginTop=unit(v,0);else if(k.equals("margin-bottom"))n.style.marginBottom=unit(v,8);else if(k.equals("padding"))n.style.padding=unit(v,0);else if(k.equals("display"))n.style.display=v.toLowerCase(Locale.ROOT);else if(k.equals("text-align"))n.style.align=v.toLowerCase(Locale.ROOT);else if(k.equals("gap"))n.style.gap=unit(v,8);else if(k.equals("width"))n.style.width=v;
    }catch(Exception ignored){}}
    }
    static float unit(String v,float f){return Float.parseFloat(v.replace("px","").replace("sp",""));}
    static String attr(String a,String key){Matcher m=Pattern.compile("(?:^|\\s)"+Pattern.quote(key)+"\\s*=\\s*(?:\\\"([^\\\"]*)\\\"|'([^']*)'|([^\\s>]+))",Pattern.CASE_INSENSITIVE).matcher(a);if(!m.find())return null;return m.group(1)!=null?m.group(1):m.group(2)!=null?m.group(2):m.group(3);}
    static String decode(String s){return s.replace("&amp;","&").replace("&lt;","<").replace("&gt;",">").replace("&quot;","\"").replace("&#39;", "'").replace("&nbsp;"," ");}
    static int parseColor(String v,int f){v=v.trim().toLowerCase(Locale.ROOT);try{if(v.startsWith("#"))return Color.parseColor(v);if(v.startsWith("rgb")){Matcher m=Pattern.compile("(\\d+)\\D+(\\d+)\\D+(\\d+)").matcher(v);if(m.find())return Color.rgb(Integer.parseInt(m.group(1)),Integer.parseInt(m.group(2)),Integer.parseInt(m.group(3)));}if(v.equals("transparent"))return Color.TRANSPARENT;if(v.equals("white"))return Color.WHITE;if(v.equals("black"))return Color.BLACK;if(v.equals("red"))return Color.RED;if(v.equals("blue"))return Color.BLUE;if(v.equals("green"))return Color.GREEN;if(v.equals("gray")||v.equals("grey"))return Color.GRAY;}catch(Exception ignored){}return f;}
    static Doc error(String a,String b){Doc d=new Doc();N h=new N("h1",null,null);h.kids.add(new N("text",a,null));d.root.add(h);N p=new N("p",null,null);p.kids.add(new N("text",b,null));d.root.add(p);return d;}
  }

  public final class DumbView extends View{
    DumbEngine engine;Doc doc=new Doc();Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);float scroll,down,last,content;boolean moved,loading;final ArrayList<Hit> hits=new ArrayList<>();
    DumbView(Context c){super(c);setBackgroundColor(Color.rgb(10,14,22));setFocusable(true);}
    protected void onDraw(Canvas c){super.onDraw(c);hits.clear();c.save();c.translate(0,-scroll);float y=22;for(N n:doc.root)y=drawBlock(c,n,18,y,getWidth()-36);content=y+30;c.restore();if(loading){p.setColor(Color.rgb(105,160,255));c.drawRect(0,0,getWidth()/3f,3,p);}}
    float drawBlock(Canvas c,N n,float x,float y,float w){
      if(n.style==null)n.style=new Style();if(n.style.display.equals("none"))return y;y+=n.style.marginTop;
      if(n.style.bg!=Color.TRANSPARENT){p.setColor(n.style.bg);c.drawRoundRect(x,y,x+w,y+Math.max(42,n.style.padding*2+42),16,16,p);}
      if(n.tag.equals("br"))return y+22;if(n.tag.equals("hr")){p.setColor(Color.rgb(75,86,105));c.drawRect(x,y,x+w,y+1,p);return y+15;}
      if(n.tag.equals("img"))return drawImage(c,n,x,y,w);
      if(n.tag.equals("input")||n.tag.equals("button")){p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);p.setColor(Color.rgb(80,98,125));c.drawRoundRect(x,y,x+Math.min(w,420),y+48,12,12,p);p.setStyle(Paint.Style.FILL);p.setColor(n.style.color);p.setTextSize(15);c.drawText(n.value==null?(n.tag.equals("button")?"button":""):n.value,x+14,y+30,p);return y+60;}
      if(n.style.display.equals("flex"))return drawFlex(c,n,x,y,w);
      if(n.tag.matches("h[1-6]")){int level=Integer.parseInt(n.tag.substring(1));n.style.bold=true;n.style.size=34-(level-1)*4;}
      if(n.tag.equals("li")){p.setColor(n.style.color);c.drawCircle(x+6,y+n.style.size*.55f,3,p);x+=18;w-=18;}
      float yy=y+n.style.padding;StringBuilder inline=new StringBuilder();
      for(N k:n.kids){if(k.tag.equals("text"))inline.append(k.text);else{if(inline.length()>0){yy=drawText(c,inline.toString(),n,x,yy,w);inline.setLength(0);}yy=drawBlock(c,k,x,yy,w);}}
      if(inline.length()>0)yy=drawText(c,inline.toString(),n,x,yy,w);
      if(n.href!=null)hits.add(new Hit(n.href,new RectF(x,y,x+w,yy)));return yy+n.style.marginBottom;
    }
    float drawText(Canvas c,String text,N parent,float x,float y,float w){TextPaint tp=new TextPaint(Paint.ANTI_ALIAS_FLAG);tp.setColor(parent.style.color);tp.setTextSize(parent.style.size);int face=Typeface.NORMAL;if(parent.style.bold)face|=Typeface.BOLD;if(parent.style.italic)face|=Typeface.ITALIC;tp.setTypeface(Typeface.create(Typeface.DEFAULT,face));tp.setUnderlineText(parent.style.underline);StaticLayout s=new StaticLayout(text,tp,Math.max(1,(int)w),Layout.Alignment.ALIGN_NORMAL,1.18f,0,false);c.save();c.translate(x,y);s.draw(c);c.restore();return y+s.getHeight()+2;}
    float drawFlex(Canvas c,N n,float x,float y,float w){int num=n.kids.size();if(num==0)return y+20;float gap=n.style.gap,each=Math.max(1,(w-gap*(num-1))/num),maxH=0;for(N k:n.kids){float before=y,after=drawBlock(c,k,x,y,each);maxH=Math.max(maxH,after-before);x+=each+gap;}return y+maxH+n.style.marginBottom;}
    float drawImage(Canvas c,N n,float x,float y,float w){Bitmap b=ImageCache.get(n.src);if(b!=null){float ww=Math.min(w,b.getWidth()),hh=ww*b.getHeight()/Math.max(1,b.getWidth());c.drawBitmap(b,null,new RectF(x,y,x+ww,y+hh),p);return y+hh+12;}p.setColor(Color.rgb(34,44,60));c.drawRoundRect(x,y,x+Math.min(420,w),y+180,16,16,p);p.setColor(Color.rgb(155,166,184));p.setTextSize(14);c.drawText("cargando imagen…",x+14,y+30,p);if(n.src!=null)ImageCache.load(n.src,this);return y+192;}
    public boolean onTouchEvent(MotionEvent e){float y=e.getY();if(e.getAction()==MotionEvent.ACTION_DOWN){down=last=y;moved=false;return true;}if(e.getAction()==MotionEvent.ACTION_MOVE){float dy=last-y;if(Math.abs(y-down)>6)moved=true;scroll=Math.max(0,Math.min(Math.max(0,content-getHeight()),scroll+dy));last=y;invalidate();return true;}if(e.getAction()==MotionEvent.ACTION_UP&&!moved){float cy=y+scroll;for(Hit h:hits)if(h.r.contains(e.getX(),cy)){engine.click(h.href);return true;}}return true;}
    final class Hit{String href;RectF r;Hit(String h,RectF x){href=h;r=x;}}
  }
  static final class ImageCache{
    static final HashMap<String,Bitmap> cache=new HashMap<>();static final HashSet<String> loading=new HashSet<>();static final ExecutorService pool=Executors.newCachedThreadPool();
    static synchronized Bitmap get(String s){return s==null?null:cache.get(s);}
    static void load(String src,DumbView view){if(src==null||src.isEmpty())return;synchronized(ImageCache.class){if(loading.contains(src)||cache.containsKey(src))return;loading.add(src);}pool.execute(()->{try{byte[] b;if(src.startsWith("data:image/")){int k=src.indexOf("base64,");if(k<0)throw new IOException("bad data image");b=Base64.getDecoder().decode(src.substring(k+7));}else b=Loader.bytes(src.startsWith("http")?src:"https://"+src);Bitmap bm=BitmapFactory.decodeByteArray(b,0,b.length);if(bm!=null)synchronized(ImageCache.class){cache.put(src,bm);}}catch(Exception ignored){}finally{synchronized(ImageCache.class){loading.remove(src);}view.post(view::invalidate);}});}
  }
}
