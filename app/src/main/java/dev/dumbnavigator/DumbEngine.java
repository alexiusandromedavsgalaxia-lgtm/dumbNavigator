package dev.dumbnavigator;

import android.content.Context;
import android.graphics.*;
import android.net.Uri;
import android.text.*;
import android.view.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

public final class DumbEngine {
  public interface Host { void onUrl(String u); void onSpecial(String u); }
  private final Context c; private final Host host; private final DumbView view;
  private final ArrayList<String> back=new ArrayList<>(), forward=new ArrayList<>(); private String current="dumb://une.developeit.dev/";
  public DumbEngine(Context c,Host h){this.c=c.getApplicationContext();host=h;view=new DumbView(c);view.engine=this;}
  public DumbView view(){return view;} public boolean canBack(){return !back.isEmpty();} public boolean canForward(){return !forward.isEmpty();}
  public void go(String raw){load(norm(raw),true);} public void back(){if(!back.isEmpty()){forward.add(current);load(back.remove(back.size()-1),false);}} public void forward(){if(!forward.isEmpty()){back.add(current);load(forward.remove(forward.size()-1),false);}}
  private void load(String u,boolean history){if(u.isEmpty())return;if(u.equals("dumb://une.developeit.dev/new")){host.onSpecial(u);return;}if(history&&!u.equals(current)){back.add(current);forward.clear();}current=u;host.onUrl(u);new Thread(()->{try{String html=Loader.get(c,u);Doc d=Parser.parse(html);view.post(()->view.doc=d);view.postInvalidate();}catch(Exception e){Doc d=new Doc();d.root.add(new N("h1","Dumb Engine",null));d.root.add(new N("p","No se pudo cargar "+u+"\\n"+e.getMessage(),null));view.post(()->view.doc=d);view.postInvalidate();}},"dumb-load").start();}
  private void click(String h){load(resolve(current,h),true);}
  private static String norm(String s){if(s==null||s.trim().isEmpty())return "dumb://une.developeit.dev/";s=s.trim();if(!s.contains("://"))s="dumb://"+s;if(!s.startsWith("dumb://"))return "";Uri u=Uri.parse(s);if(u.getHost()==null)return "";String p=u.getPath();if(p==null||p.isEmpty())p="/";return "dumb://"+u.getHost().toLowerCase(Locale.ROOT)+p+(u.getQuery()==null?"":"?"+u.getQuery())+(u.getFragment()==null?"":"#"+u.getFragment());}
  private static String resolve(String base,String href){if(href==null||href.isEmpty())return base;if(href.startsWith("dumb://"))return norm(href);Uri b=Uri.parse(base);if(href.startsWith("/"))return norm("dumb://"+b.getHost()+href);String p=b.getPath()==null?"/":b.getPath();int i=p.lastIndexOf('/');return norm("dumb://"+b.getHost()+p.substring(0,i+1)+href);}
  static final class Loader{
    static String get(Context c,String u)throws Exception{String h=Uri.parse(u).getHost().toLowerCase(Locale.ROOT);if(h.equals("une.developeit.dev"))return asset(c,"developeit/index.html");File f=new File(c.getFilesDir(),"dumb-sites/"+safe(h)+"/index.html");if(f.exists())return read(f);String[] a=h.split("\\.");for(int i=1;i<a.length-1;i++){String p=String.join(".",Arrays.copyOfRange(a,i,a.length));f=new File(c.getFilesDir(),"dumb-sites/"+safe(p)+"/wildcard/index.html");if(f.exists())return read(f);}Uri x=Uri.parse(u);String remote="https://"+h+(x.getPath()==null?"/":x.getPath())+(x.getQuery()==null?"":"?"+x.getQuery());HttpURLConnection q=(HttpURLConnection)new URL(remote).openConnection();q.setConnectTimeout(8000);q.setReadTimeout(12000);q.setRequestProperty("User-Agent","dumbNavigator-DumbEngine/0.2");if(q.getResponseCode()>=400)throw new IOException("HTTP "+q.getResponseCode());try(InputStream in=q.getInputStream()){return new String(in.readAllBytes(),StandardCharsets.UTF_8);}}
    static void save(Context c,String host,String html,boolean wildcard)throws IOException{File d=new File(c.getFilesDir(),"dumb-sites/"+safe(host)+(wildcard?"/wildcard":""));if(!d.exists()&&!d.mkdirs())throw new IOException("mkdir");try(FileOutputStream o=new FileOutputStream(new File(d,"index.html"))){o.write(html.getBytes(StandardCharsets.UTF_8));}}
    static String safe(String h){return h.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]","_");}static String read(File f)throws IOException{try(InputStream i=new FileInputStream(f)){return new String(i.readAllBytes(),StandardCharsets.UTF_8);}}static String asset(Context c,String p)throws IOException{try(InputStream i=c.getAssets().open(p)){return new String(i.readAllBytes(),StandardCharsets.UTF_8);}}
  }
  static final class N{String tag,text,href;List<N> kids=new ArrayList<>();N(String t,String x,String h){tag=t;text=x;href=h;}}
  static final class Doc{List<N> root=new ArrayList<>();}
  static final class Parser{
    static Doc parse(String s){Doc d=new Doc();ArrayDeque<N> st=new ArrayDeque<>();N root=new N("root","",null);st.push(root);Matcher m=Pattern.compile("<!--[\\s\\S]*?-->|<[^>]+>|[^<]+",Pattern.MULTILINE).matcher(s);while(m.find()){String t=m.group();if(t.startsWith("<!--"))continue;if(t.startsWith("</")){if(st.size()>1)st.pop();continue;}if(t.startsWith("<")){Matcher x=Pattern.compile("<\\s*([A-Za-z0-9]+)([^>]*)>").matcher(t);if(!x.find())continue;String tag=x.group(1).toLowerCase(Locale.ROOT);String attrs=x.group(2);String href=null;Matcher a=Pattern.compile("href\\s*=\\s*[\\\"']([^\\\"']+)").matcher(attrs);if(a.find())href=a.group(1);N n=new N(tag,"",href);st.peek().kids.add(n);if(!Arrays.asList("meta","link","img","br","hr","input","source").contains(tag))st.push(n);}else{String z=t.replaceAll("\\s+"," ").trim();if(!z.isEmpty())st.peek().kids.add(new N("text",z,null));}}d.root=root.kids;return d;}
  }
  public final class DumbView extends View{
    DumbEngine engine;Doc doc=new Doc();Paint p=new Paint(3);float scroll,down,last;boolean moved;float content;
    DumbView(Context c){super(c);setBackgroundColor(Color.WHITE);}
    protected void onDraw(Canvas c){super.onDraw(c);c.save();c.translate(0,-scroll);float y=24;for(N n:doc.root)y=draw(c,n,20,y,getWidth()-40);content=y+30;c.restore();}
    float draw(Canvas c,N n,float x,float y,float max){if(n.tag.equals("img")){p.setColor(Color.LTGRAY);c.drawRect(x,y,x+220,y+140,p);return y+155;}if(n.tag.equals("text")){p.setColor(Color.rgb(30,30,35));p.setTextSize(16);StaticLayout s=new StaticLayout(n.text,new TextPaint(p),Math.max(1,(int)max),Layout.Alignment.ALIGN_NORMAL,1.15f,0,false);s.draw(c);return y+s.getHeight()+10;}if(n.tag.matches("h[1-6]")){p.setColor(Color.rgb(20,20,25));p.setTypeface(Typeface.DEFAULT_BOLD);p.setTextSize(34-(Integer.parseInt(n.tag.substring(1))-1)*4);}else{p.setTypeface(Typeface.DEFAULT);p.setTextSize(16);}if(n.href!=null){p.setColor(Color.rgb(35,90,210));}float yy=y;for(N k:n.kids)yy=draw(c,k,x,yy,max);return yy+(n.tag.matches("h[1-6]")?14:4);}
    public boolean onTouchEvent(MotionEvent e){float y=e.getY();if(e.getAction()==0){down=last=y;moved=false;return true;}if(e.getAction()==2){float dy=last-y;if(Math.abs(y-down)>5)moved=true;scroll=Math.max(0,Math.min(Math.max(0,content-getHeight()),scroll+dy));last=y;invalidate();return true;}if(e.getAction()==1&&!moved){float cy=y+scroll,yy=24;for(N n:doc.root){if(n.href!=null&&cy>=yy&&cy<=yy+55){click(n.href);return true;}yy+=55;}}return true;}
  }
}
