package dev.dumbnavigator.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class DumbNode {
    public enum Type { DOCUMENT, ELEMENT, TEXT }
    public final Type type;
    public String name = "";
    public String text = "";
    public final LinkedHashMap<String,String> attributes = new LinkedHashMap<>();
    public final List<DumbNode> children = new ArrayList<>();
    public DumbNode parent;

    public DumbNode(Type type) { this.type = type; }
    public static DumbNode element(String name) { DumbNode n = new DumbNode(Type.ELEMENT); n.name = name.toLowerCase(); return n; }
    public static DumbNode text(String text) { DumbNode n = new DumbNode(Type.TEXT); n.text = text; return n; }
    public void add(DumbNode child) { child.parent = this; children.add(child); }
}
