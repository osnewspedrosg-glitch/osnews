package com.osnews.anibal;

import java.util.ArrayList;
import java.util.List;

/** Plain JVM checks for AnibalLogic (run: see build.sh test). */
public class AnibalLogicTest {
  static int fails = 0, n = 0;

  static void eq(Object want, Object got, String what) {
    n++;
    if (want == null ? got != null : !want.equals(got)) {
      fails++;
      System.out.println("FAIL " + what + "\n  want: " + want + "\n  got:  " + got);
    }
  }

  public static void main(String[] a) {
    eq("https://x.com/intent/post?text=Hola%20mundo%20%C3%B1&url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1%26c%3D2",
        AnibalLogic.xIntentUrl("  Hola   mundo ñ ", "https://example.com/a?b=1&c=2"), "x intent");
    eq("https://x.com/intent/post?url=https%3A%2F%2Fexample.com%2F",
        AnibalLogic.xIntentUrl("", "https://example.com/"), "x intent no title");
    eq("https://x.com/intent/post?url=https%3A%2F%2Fexample.com%2F",
        AnibalLogic.xIntentUrl("https://example.com/", "https://example.com/"), "x intent title==url");
    StringBuilder longT = new StringBuilder();
    for (int i = 0; i < 300; i++) longT.append('a');
    String li = AnibalLogic.xIntentUrl(longT.toString(), "https://e.com");
    eq(true, li.contains("%E2%80%A6") && li.length() < 300, "x intent long title truncated");

    eq("https://x.com/Osnewsmaygrok/status/1", AnibalLogic.extractUrl("Mira esto: https://x.com/Osnewsmaygrok/status/1."), "extract trailing dot");
    eq("https://elpais.com/a", AnibalLogic.extractUrl("«Titular» (https://elpais.com/a)"), "extract parens");
    eq(null, AnibalLogic.extractUrl("sin enlaces aquí"), "extract none");
    eq(null, AnibalLogic.extractUrl("javascript:alert(1)"), "extract js");
    eq(null, AnibalLogic.extractUrl(null), "extract null");

    eq(true, AnibalLogic.isWebUrl("HTTPS://a.b"), "isWeb https");
    eq(false, AnibalLogic.isWebUrl("file:///sdcard/x"), "isWeb file");
    eq(false, AnibalLogic.isWebUrl("javascript:1"), "isWeb js");

    List<AnibalLogic.Entry> h = new ArrayList<AnibalLogic.Entry>();
    AnibalLogic.addHistory(h, "https://a.es/", "A", 1, 3);
    AnibalLogic.addHistory(h, "https://b.es/", "B", 2, 3);
    AnibalLogic.addHistory(h, "https://a.es/", "A2", 3, 3);
    eq(2, h.size(), "history dedupe size");
    eq("https://a.es/", h.get(0).url, "history newest first");
    eq("A2", h.get(0).title, "history title updated");
    AnibalLogic.addHistory(h, "https://c.es/", "C", 4, 3);
    AnibalLogic.addHistory(h, "https://d.es/", "D", 5, 3);
    eq(3, h.size(), "history capped");
    eq("https://d.es/", h.get(0).url, "history cap keeps newest");
    eq(false, AnibalLogic.addHistory(h, "about:blank", "", 6, 3), "history ignores about:");

    List<AnibalLogic.Entry> b = new ArrayList<AnibalLogic.Entry>();
    eq(true, AnibalLogic.toggleBookmark(b, "https://a.es/", "A", 1), "bookmark add");
    eq(true, AnibalLogic.isBookmarked(b, "https://a.es/"), "bookmark present");
    eq(false, AnibalLogic.toggleBookmark(b, "https://a.es/", "A", 2), "bookmark remove");
    eq(0, b.size(), "bookmark empty");
    eq(false, AnibalLogic.toggleBookmark(b, "file:///x", "x", 3), "bookmark ignores file:");

    eq(true, AnibalLogic.effectiveDark("system", true), "theme system night");
    eq(false, AnibalLogic.effectiveDark("system", false), "theme system day");
    eq(true, AnibalLogic.effectiveDark("dark", false), "theme dark");
    eq(false, AnibalLogic.effectiveDark("light", true), "theme light");

    eq("T\nhttps://a.es/", AnibalLogic.label(new AnibalLogic.Entry("https://a.es/", "T", 0)), "label");
    eq("https://a.es/", AnibalLogic.label(new AnibalLogic.Entry("https://a.es/", "", 0)), "label no title");

    System.out.println((n - fails) + "/" + n + " checks passed");
    if (fails > 0) System.exit(1);
  }
}
