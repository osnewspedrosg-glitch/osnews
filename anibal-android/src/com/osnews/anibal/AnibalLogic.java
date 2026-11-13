package com.osnews.anibal;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure Java helpers (no Android classes) so they can be unit-tested on the JVM. */
final class AnibalLogic {
  static final String X_INTENT = "https://x.com/intent/post";
  static final String X_OSNEWS = "https://x.com/Osnewsmaygrok";
  static final int MAX_HISTORY = 300;
  static final int MAX_TITLE = 200;
  static final Pattern URL_IN_TEXT = Pattern.compile("(?i)\\bhttps?://[^\\s<>\"]+");

  private AnibalLogic() {}

  /** A saved page: bookmark or history entry. */
  static final class Entry {
    final String url;
    String title;
    long at;

    Entry(String url, String title, long at) {
      this.url = url;
      this.title = title == null ? "" : title;
      this.at = at;
    }
  }

  static String enc(String s) {
    try {
      return URLEncoder.encode(s == null ? "" : s, "UTF-8").replace("+", "%20");
    } catch (UnsupportedEncodingException e) {
      return "";
    }
  }

  static boolean isWebUrl(String s) {
    if (s == null) return false;
    String l = s.trim().toLowerCase(Locale.US);
    return l.startsWith("http://") || l.startsWith("https://");
  }

  /** Official X web intent; the user reviews and posts it himself. */
  static String xIntentUrl(String title, String url) {
    String t = title == null ? "" : title.trim().replaceAll("\\s+", " ");
    if (t.length() > MAX_TITLE) t = t.substring(0, MAX_TITLE - 1).trim() + "…";
    if (t.equals(url)) t = "";
    StringBuilder b = new StringBuilder(X_INTENT).append('?');
    if (!t.isEmpty()) b.append("text=").append(enc(t)).append('&');
    b.append("url=").append(enc(url == null ? "" : url));
    return b.toString();
  }

  /** First http(s) link in shared text, without trailing punctuation; null if none. */
  static String extractUrl(String text) {
    if (text == null) return null;
    Matcher m = URL_IN_TEXT.matcher(text);
    if (!m.find()) return null;
    String u = m.group();
    while (!u.isEmpty() && ".,;:!?)]}'»”’".indexOf(u.charAt(u.length() - 1)) >= 0) {
      u = u.substring(0, u.length() - 1);
    }
    return isWebUrl(u) ? u : null;
  }

  static int indexOf(List<Entry> list, String url) {
    if (url == null) return -1;
    for (int i = 0; i < list.size(); i++) {
      if (url.equals(list.get(i).url)) return i;
    }
    return -1;
  }

  /** Newest first, one entry per URL, capped at max. Returns true if the list changed. */
  static boolean addHistory(List<Entry> list, String url, String title, long now, int max) {
    if (!isWebUrl(url)) return false;
    int i = indexOf(list, url);
    if (i == 0) {
      Entry e = list.get(0);
      if (title != null && !title.isEmpty()) e.title = title;
      e.at = now;
      return true;
    }
    if (i > 0) list.remove(i);
    list.add(0, new Entry(url, title, now));
    while (list.size() > max) list.remove(list.size() - 1);
    return true;
  }

  /** Adds or removes a bookmark. Returns true if it is now bookmarked. */
  static boolean toggleBookmark(List<Entry> list, String url, String title, long now) {
    if (!isWebUrl(url)) return false;
    int i = indexOf(list, url);
    if (i >= 0) {
      list.remove(i);
      return false;
    }
    list.add(0, new Entry(url, title, now));
    return true;
  }

  static boolean isBookmarked(List<Entry> list, String url) {
    return indexOf(list, url) >= 0;
  }

  /** Theme preference: "system", "light" or "dark". */
  static boolean effectiveDark(String mode, boolean systemNight) {
    if ("dark".equals(mode)) return true;
    if ("light".equals(mode)) return false;
    return systemNight;
  }

  static String label(Entry e) {
    String t = e.title == null ? "" : e.title.trim();
    if (t.isEmpty() || t.equals(e.url)) return e.url;
    return t + "\n" + e.url;
  }

  static List<String> labels(List<Entry> list) {
    List<String> out = new ArrayList<String>();
    for (Entry e : list) out.add(label(e));
    return out;
  }
  /** Host of an http(s) URL, lowercase, without a leading www. Null if it is not a web URL. */
  static String hostOf(String url) {
    if (!isWebUrl(url)) return null;
    try {
      String h = new URI(url.trim()).getHost();
      if (h == null) return null;
      h = h.toLowerCase(Locale.US);
      if (h.startsWith("www.")) h = h.substring(4);
      return h;
    } catch (Exception e) {
      return null;
    }
  }

  static boolean hostMatches(String host, String domain) {
    return host != null && (host.equals(domain) || host.endsWith("." + domain));
  }

  static boolean isYoutubeUrl(String url) {
    String h = hostOf(url);
    return hostMatches(h, "youtube.com") || hostMatches(h, "youtu.be")
        || hostMatches(h, "youtube-nocookie.com");
  }

  static boolean isTikTokUrl(String url) {
    return hostMatches(hostOf(url), "tiktok.com");
  }

  static boolean isFacebookUrl(String url) {
    String h = hostOf(url);
    return hostMatches(h, "facebook.com") || hostMatches(h, "fb.com")
        || hostMatches(h, "fb.watch") || hostMatches(h, "fb.me");
  }

  /** Official download sites of the free tools linked from the VPN section. */
  static boolean isVpnToolUrl(String url) {
    String h = hostOf(url);
    return hostMatches(h, "protonvpn.com") || hostMatches(h, "psiphon.ca")
        || hostMatches(h, "torproject.org");
  }

  /** YouTube, official VPN/Tor sites, and Facebook/TikTok if reached: open outside the WebView. */
  static boolean opensOutsideAnibal(String url) {
    return isYoutubeUrl(url) || isTikTokUrl(url) || isFacebookUrl(url) || isVpnToolUrl(url);
  }
}
