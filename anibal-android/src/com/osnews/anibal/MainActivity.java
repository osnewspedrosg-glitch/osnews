package com.osnews.anibal;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebView.WebViewTransport;
import android.webkit.WebViewClient;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.Toast;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity {
  static final String HOME = "https://osnewspedrosg-glitch.github.io/osnews/anibal/";
  static final String OSNEWS_SITE = "https://osnewspedrosg-glitch.github.io/osnews/";
  static final String X_PACKAGE = "com.twitter.android";
  static final String GROK_PACKAGE = "ai.x.grok";
  static final String GROK_URL = "https://grok.com/";
  static final String PREFS = "anibal";
  static final String K_THEME = "theme";
  static final String K_BOOKMARKS = "bookmarks";
  static final String K_HISTORY = "history";
  static final int REQ_STORAGE = 1001;
  static final Pattern HOST = Pattern.compile(
      "(?i)^(?:[a-z0-9-]+\\.)+[a-z]{2,}(?::\\d+)?(?:[/?#].*)?$");
  static final Pattern IPV4 = Pattern.compile(
      "^(?:\\d{1,3}\\.){3}\\d{1,3}(?::\\d+)?(?:[/?#].*)?$");
  static final Pattern LOCAL = Pattern.compile(
      "(?i)^localhost(?::\\d+)?(?:[/?#].*)?$");

  WebView web;
  EditText address;
  ProgressBar progress;
  ImageButton btnBack, btnForward;
  boolean userEditing;
  long lastGoAt;
  String pendingUrl, pendingUa, pendingCd, pendingMime;
  SharedPreferences prefs;
  boolean dark = true;
  final List<AnibalLogic.Entry> bookmarks = new ArrayList<AnibalLogic.Entry>();
  final List<AnibalLogic.Entry> history = new ArrayList<AnibalLogic.Entry>();
  Button btnBookmark;
  View bottomBar;

  @Override
  protected void onCreate(Bundle saved) {
    prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
    dark = AnibalLogic.effectiveDark(prefs.getString(K_THEME, "system"), systemNight());
    setTheme(dark ? android.R.style.Theme_DeviceDefault_NoActionBar
        : android.R.style.Theme_DeviceDefault_Light_NoActionBar);
    super.onCreate(saved);
    setContentView(R.layout.activity_main);
    loadList(K_BOOKMARKS, bookmarks);
    loadList(K_HISTORY, history);

    web = findViewById(R.id.webview);
    address = findViewById(R.id.address);
    progress = findViewById(R.id.progress);
    btnBack = findViewById(R.id.btn_back);
    btnForward = findViewById(R.id.btn_forward);
    Button btnGo = findViewById(R.id.btn_go);
    btnBookmark = findViewById(R.id.btn_bookmark);
    bottomBar = findViewById(R.id.bottom_bar);
    applyPalette();

    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    s.setBuiltInZoomControls(true);
    s.setDisplayZoomControls(false);
    s.setSupportMultipleWindows(true);
    s.setJavaScriptCanOpenWindowsAutomatically(true);
    s.setMediaPlaybackRequiresUserGesture(true);
    s.setAllowFileAccess(false);
    s.setAllowContentAccess(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
    s.setUserAgentString(s.getUserAgentString() + " AnibalOSNews/1.2");
    CookieManager cookies = CookieManager.getInstance();
    cookies.setAcceptCookie(true);
    cookies.setAcceptThirdPartyCookies(web, true);

    web.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
        return handleUrl(req.getUrl().toString());
      }

      @Override
      public boolean shouldOverrideUrlLoading(WebView v, String url) {
        return handleUrl(url);
      }

      @Override
      public void onPageStarted(WebView v, String url, android.graphics.Bitmap fav) {
        if (!userEditing) showUrl(url);
        updateNav();
        applyPageTheme(v, url);
      }

      @Override
      public void onPageFinished(WebView v, String url) {
        if (!userEditing) showUrl(url);
        updateNav();
        applyPageTheme(v, url);
        recordHistory(url, v.getTitle());
      }

      @Override
      public void doUpdateVisitedHistory(WebView v, String url, boolean reload) {
        if (!userEditing) showUrl(url);
        updateNav();
      }
    });

    web.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onReceivedTitle(WebView v, String title) {
        recordHistory(v.getUrl(), title);
      }

      @Override
      public void onProgressChanged(WebView v, int p) {
        if (p >= 100) {
          progress.setVisibility(View.INVISIBLE);
          progress.setProgress(0);
        } else {
          progress.setVisibility(View.VISIBLE);
          progress.setProgress(p);
        }
      }

      @Override
      public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUser, Message result) {
        WebView tmp = new WebView(MainActivity.this);
        tmp.setWebViewClient(new WebViewClient() {
          @Override
          public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
            String u = req.getUrl().toString();
            if (!handleUrl(u)) web.loadUrl(u);
            return true;
          }
        });
        WebViewTransport t = (WebViewTransport) result.obj;
        t.setWebView(tmp);
        result.sendToTarget();
        return true;
      }
    });

    web.setDownloadListener(new DownloadListener() {
      @Override
      public void onDownloadStart(String url, String ua, String cd, String mime, long len) {
        maybeDownload(url, ua, cd, mime);
      }
    });

    findViewById(R.id.btn_back).setOnClickListener(v -> {
      if (web.canGoBack()) web.goBack();
    });
    findViewById(R.id.btn_forward).setOnClickListener(v -> {
      if (web.canGoForward()) web.goForward();
    });
    findViewById(R.id.btn_reload).setOnClickListener(v -> web.reload());
    findViewById(R.id.btn_home).setOnClickListener(v -> {
      userEditing = false;
      web.loadUrl(HOME);
    });
    btnGo.setOnClickListener(v -> goFromBar());
    address.setOnEditorActionListener((v, action, ev) -> {
      if (isImeGo(action, ev)) {
        goFromBar();
        return true;
      }
      return false;
    });
    address.setOnFocusChangeListener((v, has) -> {
      userEditing = has;
      if (bottomBar != null) bottomBar.setVisibility(has ? View.GONE : View.VISIBLE);
    });
    findViewById(R.id.btn_share_x).setOnClickListener(v -> shareToX());
    btnBookmark.setOnClickListener(v -> toggleBookmark());
    findViewById(R.id.btn_bookmarks).setOnClickListener(v -> showBookmarks());
    findViewById(R.id.btn_history).setOnClickListener(v -> showHistory());
    findViewById(R.id.btn_theme).setOnClickListener(v -> chooseTheme());
    findViewById(R.id.btn_grok).setOnClickListener(v -> openGrok());
    address.setOnClickListener(v -> userEditing = true);

    if (saved != null) {
      web.restoreState(saved);
    } else {
      String incoming = incomingUrl(getIntent());
      web.loadUrl(incoming != null ? incoming : HOME);
    }
    updateNav();
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    String incoming = incomingUrl(intent);
    if (incoming != null && web != null) {
      userEditing = false;
      if (address != null) address.clearFocus();
      web.loadUrl(incoming);
    }
  }

  /** URL to open from another app: VIEW of an http(s) link, or SEND of text with a link. */
  String incomingUrl(Intent intent) {
    if (intent == null) return null;
    String action = intent.getAction();
    if (Intent.ACTION_VIEW.equals(action)) {
      Uri data = intent.getData();
      String u = data == null ? null : data.toString();
      return AnibalLogic.isWebUrl(u) ? u : null;
    }
    if (Intent.ACTION_SEND.equals(action)) {
      String text = intent.getStringExtra(Intent.EXTRA_TEXT);
      if (TextUtils.isEmpty(text)) return null;
      String u = AnibalLogic.extractUrl(text);
      if (u != null) return u;
      String q = text.trim();
      if (q.length() > 300) q = q.substring(0, 300);
      return searchOrLoad(q);
    }
    return null;
  }

  boolean systemNight() {
    int night = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
    return night == Configuration.UI_MODE_NIGHT_YES;
  }

  void applyPalette() {
    int bg = Color.parseColor(dark ? "#0B1220" : "#F4F7FB");
    int bar = Color.parseColor(dark ? "#141C2E" : "#FFFFFF");
    int field = Color.parseColor(dark ? "#1A2438" : "#E6ECF5");
    int text = Color.parseColor(dark ? "#EEF3FF" : "#0B1220");
    int muted = Color.parseColor(dark ? "#9AA8C3" : "#4A5670");
    int accent = Color.parseColor(dark ? "#3DD6C6" : "#0D7D72");
    getWindow().setStatusBarColor(bar);
    getWindow().setNavigationBarColor(bar);
    View decor = getWindow().getDecorView();
    int flags = decor.getSystemUiVisibility();
    if (dark) {
      flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      if (Build.VERSION.SDK_INT >= 26) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
    } else {
      flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
    }
    decor.setSystemUiVisibility(flags);
    findViewById(R.id.root).setBackgroundColor(bg);
    findViewById(R.id.toolbar).setBackgroundColor(bar);
    bottomBar.setBackgroundColor(bar);
    web.setBackgroundColor(bg);
    address.setBackground(new ColorDrawable(field));
    address.setTextColor(text);
    address.setHintTextColor(muted);
    Button go = findViewById(R.id.btn_go);
    go.setBackground(new ColorDrawable(accent));
    go.setTextColor(dark ? bg : Color.WHITE);
    progress.setProgressTintList(android.content.res.ColorStateList.valueOf(accent));
    int[] icons = {R.id.btn_back, R.id.btn_forward, R.id.btn_reload, R.id.btn_home};
    for (int id : icons) {
      ImageButton b = findViewById(id);
      if (dark) b.clearColorFilter(); else b.setColorFilter(text, PorterDuff.Mode.SRC_IN);
    }
    int[] buttons = {R.id.btn_share_x, R.id.btn_bookmark, R.id.btn_bookmarks, R.id.btn_history, R.id.btn_grok, R.id.btn_theme};
    for (int id : buttons) ((Button) findViewById(id)).setTextColor(text);
    ((Button) findViewById(R.id.btn_share_x)).setTextColor(accent);
  }

  /** OSNews pages follow Aníbal's theme; other sites get prefers-color-scheme from the app theme. */
  void applyPageTheme(WebView v, String url) {
    if (v == null || url == null || !url.startsWith(OSNEWS_SITE)) return;
    v.evaluateJavascript("document.documentElement&&document.documentElement.setAttribute('data-theme','"
        + (dark ? "dark" : "light") + "');", null);
  }

  void chooseTheme() {
    final String[] modes = {"system", "light", "dark"};
    String cur = prefs.getString(K_THEME, "system");
    int checked = 0;
    for (int i = 0; i < modes.length; i++) if (modes[i].equals(cur)) checked = i;
    String[] labels = {getString(R.string.theme_system), getString(R.string.theme_light), getString(R.string.theme_dark)};
    new AlertDialog.Builder(this)
        .setTitle(R.string.theme_title)
        .setSingleChoiceItems(labels, checked, (d, which) -> {
          d.dismiss();
          if (modes[which].equals(prefs.getString(K_THEME, "system"))) return;
          prefs.edit().putString(K_THEME, modes[which]).apply();
          boolean nowDark = AnibalLogic.effectiveDark(modes[which], systemNight());
          if (nowDark != dark) recreate();
        })
        .setNegativeButton(R.string.cancel, null)
        .show();
  }

  String currentUrl() {
    String u = web == null ? null : web.getUrl();
    return AnibalLogic.isWebUrl(u) ? u : null;
  }

  void shareToX() {
    String url = currentUrl();
    if (url == null) url = HOME;
    String title = web.getTitle();
    String intentUrl = AnibalLogic.xIntentUrl(title, url);
    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(intentUrl));
    i.setPackage(X_PACKAGE);
    i.addCategory(Intent.CATEGORY_BROWSABLE);
    try {
      startActivity(i);
    } catch (ActivityNotFoundException e) {
      Toast.makeText(this, R.string.share_x_web, Toast.LENGTH_SHORT).show();
      userEditing = false;
      web.loadUrl(intentUrl);
    }
  }

  /** Each user signs in with their own Grok account: Grok app if installed, otherwise grok.com here. */
  void openGrok() {
    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(GROK_URL));
    i.setPackage(GROK_PACKAGE);
    i.addCategory(Intent.CATEGORY_BROWSABLE);
    try {
      startActivity(i);
    } catch (ActivityNotFoundException e) {
      userEditing = false;
      web.loadUrl(GROK_URL);
    }
  }

  void toggleBookmark() {
    String url = currentUrl();
    if (url == null) return;
    boolean on = AnibalLogic.toggleBookmark(bookmarks, url, web.getTitle(), System.currentTimeMillis());
    saveList(K_BOOKMARKS, bookmarks);
    Toast.makeText(this, on ? R.string.bookmark_added : R.string.bookmark_removed, Toast.LENGTH_SHORT).show();
    updateBookmarkButton();
  }

  void updateBookmarkButton() {
    if (btnBookmark == null) return;
    boolean on = AnibalLogic.isBookmarked(bookmarks, currentUrl());
    btnBookmark.setText(on ? R.string.bookmark_on : R.string.bookmark_add);
  }

  void recordHistory(String url, String title) {
    if (!AnibalLogic.isWebUrl(url)) return;
    if (url.startsWith(AnibalLogic.X_INTENT)) return;
    if (AnibalLogic.addHistory(history, url, title, System.currentTimeMillis(), AnibalLogic.MAX_HISTORY)) {
      saveList(K_HISTORY, history);
    }
    updateBookmarkButton();
  }

  void showBookmarks() {
    if (bookmarks.isEmpty()) {
      Toast.makeText(this, R.string.bookmarks_empty, Toast.LENGTH_LONG).show();
      return;
    }
    ArrayAdapter<String> ad = new ArrayAdapter<String>(this,
        android.R.layout.simple_list_item_1, AnibalLogic.labels(bookmarks));
    final AlertDialog dlg = new AlertDialog.Builder(this)
        .setTitle(R.string.bookmarks_title)
        .setAdapter(ad, (d, which) -> openEntry(bookmarks, which))
        .setNegativeButton(R.string.close, null)
        .create();
    dlg.setOnShowListener(d -> {
      ListView lv = dlg.getListView();
      if (lv == null) return;
      lv.setOnItemLongClickListener((parent, view, pos, id) -> {
        if (pos < 0 || pos >= bookmarks.size()) return true;
        final AnibalLogic.Entry e = bookmarks.get(pos);
        new AlertDialog.Builder(this)
            .setTitle(R.string.bookmark_remove_q)
            .setMessage(AnibalLogic.label(e))
            .setPositiveButton(R.string.remove, (d2, w) -> {
              bookmarks.remove(e);
              saveList(K_BOOKMARKS, bookmarks);
              updateBookmarkButton();
              dlg.dismiss();
              Toast.makeText(this, R.string.bookmark_removed, Toast.LENGTH_SHORT).show();
            })
            .setNegativeButton(R.string.cancel, null)
            .show();
        return true;
      });
    });
    dlg.show();
  }

  void showHistory() {
    if (history.isEmpty()) {
      Toast.makeText(this, R.string.history_empty, Toast.LENGTH_SHORT).show();
      return;
    }
    ArrayAdapter<String> ad = new ArrayAdapter<String>(this,
        android.R.layout.simple_list_item_1, AnibalLogic.labels(history));
    new AlertDialog.Builder(this)
        .setTitle(R.string.history_title)
        .setAdapter(ad, (d, which) -> openEntry(history, which))
        .setPositiveButton(R.string.history_clear, (d, w) -> confirmClearHistory())
        .setNegativeButton(R.string.close, null)
        .show();
  }

  void confirmClearHistory() {
    new AlertDialog.Builder(this)
        .setMessage(R.string.history_clear_q)
        .setPositiveButton(R.string.history_clear, (d, w) -> {
          history.clear();
          saveList(K_HISTORY, history);
          if (web != null) web.clearHistory();
          updateNav();
          Toast.makeText(this, R.string.history_cleared, Toast.LENGTH_SHORT).show();
        })
        .setNegativeButton(R.string.cancel, null)
        .show();
  }

  void openEntry(List<AnibalLogic.Entry> list, int which) {
    if (which < 0 || which >= list.size()) return;
    String u = list.get(which).url;
    if (!AnibalLogic.isWebUrl(u)) return;
    userEditing = false;
    web.loadUrl(u);
  }

  /** Bookmarks and history live only in this app's private storage (allowBackup=false). */
  void loadList(String key, List<AnibalLogic.Entry> out) {
    out.clear();
    try {
      JSONArray arr = new JSONArray(prefs.getString(key, "[]"));
      for (int i = 0; i < arr.length(); i++) {
        JSONObject o = arr.getJSONObject(i);
        String u = o.optString("u", "");
        if (AnibalLogic.isWebUrl(u)) out.add(new AnibalLogic.Entry(u, o.optString("t", ""), o.optLong("at", 0)));
      }
    } catch (Exception ignored) {
      out.clear();
    }
  }

  void saveList(String key, List<AnibalLogic.Entry> list) {
    try {
      JSONArray arr = new JSONArray();
      for (AnibalLogic.Entry e : list) {
        JSONObject o = new JSONObject();
        o.put("u", e.url);
        o.put("t", e.title == null ? "" : e.title);
        o.put("at", e.at);
        arr.put(o);
      }
      prefs.edit().putString(key, arr.toString()).apply();
    } catch (Exception ignored) {}
  }

  boolean isImeGo(int action, KeyEvent ev) {
    if (action == EditorInfo.IME_ACTION_GO
        || action == EditorInfo.IME_ACTION_SEARCH
        || action == EditorInfo.IME_ACTION_DONE
        || action == EditorInfo.IME_ACTION_SEND) {
      return ev == null || ev.getAction() != KeyEvent.ACTION_UP;
    }
    if (action == EditorInfo.IME_ACTION_UNSPECIFIED || action == EditorInfo.IME_ACTION_NONE) {
      if (ev == null) return false;
      int code = ev.getKeyCode();
      if (code != KeyEvent.KEYCODE_ENTER && code != KeyEvent.KEYCODE_NUMPAD_ENTER) return false;
      return ev.getAction() == KeyEvent.ACTION_DOWN || ev.getAction() == KeyEvent.ACTION_UP;
    }
    return false;
  }

  void goFromBar() {
    long now = android.os.SystemClock.uptimeMillis();
    if (lastGoAt != 0 && now - lastGoAt < 400) return;
    lastGoAt = now;
    if (address != null) {
      InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
      if (imm != null) imm.hideSoftInputFromWindow(address.getWindowToken(), 0);
      address.clearFocus();
    }
    String q = address.getText() == null ? "" : address.getText().toString().trim();
    userEditing = false;
    if (web != null) web.requestFocus();
    if (TextUtils.isEmpty(q)) return;
    String lower = q.toLowerCase(Locale.US);
    if (lower.startsWith("javascript:") || lower.startsWith("data:")
        || lower.startsWith("file:") || lower.startsWith("content:")) {
      searchOrLoad(q);
      return;
    }
    if (handleUrl(q)) return;
    web.loadUrl(searchOrLoad(q));
  }

  String searchOrLoad(String q) {
    String lower = q.toLowerCase(Locale.US);
    if (lower.startsWith("http://") || lower.startsWith("https://")) return q;
    if (isBareHost(q)) return "https://" + q;
    try {
      return "https://duckduckgo.com/?q=" + URLEncoder.encode(q, "UTF-8");
    } catch (Exception e) {
      return "https://duckduckgo.com/?q=" + Uri.encode(q);
    }
  }

  boolean isBareHost(String q) {
    if (q.contains(" ") || q.contains("\\") || q.contains("\n")) return false;
    return HOST.matcher(q).matches() || IPV4.matcher(q).matches() || LOCAL.matcher(q).matches();
  }

  boolean handleUrl(String url) {
    if (url == null) return true;
    String lower = url.toLowerCase(Locale.US);
    if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("about:")) {
      return false;
    }
    if (lower.startsWith("tel:") || lower.startsWith("mailto:")
        || lower.startsWith("sms:") || lower.startsWith("smsto:")) {
      openExternal(Intent.ACTION_VIEW, Uri.parse(url));
      return true;
    }
    if (lower.startsWith("intent:")) {
      openIntentUri(url);
      return true;
    }
    if (lower.contains(":") && !isBareHost(url) && !lower.startsWith("javascript:")
        && !lower.startsWith("data:") && !lower.startsWith("file:")) {
      openExternal(Intent.ACTION_VIEW, Uri.parse(url));
      return true;
    }
    return false;
  }

  void openIntentUri(String url) {
    try {
      Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
      if (intent == null) return;
      String fallback = intent.getStringExtra("browser_fallback_url");
      if (intent.resolveActivity(getPackageManager()) != null) {
        startActivity(intent);
      } else if (fallback != null && fallback.startsWith("http")) {
        web.loadUrl(fallback);
      } else {
        Toast.makeText(this, R.string.cannot_open, Toast.LENGTH_SHORT).show();
      }
    } catch (URISyntaxException e) {
      Toast.makeText(this, R.string.cannot_open, Toast.LENGTH_SHORT).show();
    } catch (ActivityNotFoundException e) {
      Toast.makeText(this, R.string.cannot_open, Toast.LENGTH_SHORT).show();
    }
  }

  void openExternal(String action, Uri uri) {
    try {
      startActivity(new Intent(action, uri));
    } catch (ActivityNotFoundException e) {
      Toast.makeText(this, R.string.cannot_open, Toast.LENGTH_SHORT).show();
    }
  }

  void maybeDownload(String url, String ua, String cd, String mime) {
    if (Build.VERSION.SDK_INT < 29
        && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
      pendingUrl = url;
      pendingUa = ua;
      pendingCd = cd;
      pendingMime = mime;
      requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
      return;
    }
    enqueueDownload(url, ua, cd, mime);
  }

  @Override
  public void onRequestPermissionsResult(int code, String[] perms, int[] grant) {
    super.onRequestPermissionsResult(code, perms, grant);
    if (code == REQ_STORAGE && pendingUrl != null) {
      if (grant.length > 0 && grant[0] == PackageManager.PERMISSION_GRANTED) {
        enqueueDownload(pendingUrl, pendingUa, pendingCd, pendingMime);
      } else {
        Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
      }
      pendingUrl = pendingUa = pendingCd = pendingMime = null;
    }
  }

  void enqueueDownload(String url, String ua, String cd, String mime) {
    try {
      String name = URLUtil.guessFileName(url, cd, mime);
      DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
      if (!TextUtils.isEmpty(mime)) req.setMimeType(mime);
      String cookie = CookieManager.getInstance().getCookie(url);
      if (cookie != null) req.addRequestHeader("cookie", cookie);
      if (!TextUtils.isEmpty(ua)) req.addRequestHeader("User-Agent", ua);
      req.setTitle(name);
      req.setDescription(name);
      req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
      req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
      DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
      dm.enqueue(req);
      Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
    } catch (Exception e) {
      Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show();
    }
  }

  void showUrl(String url) {
    if (url == null) return;
    if (url.startsWith("https://duckduckgo.com/?q=")) {
      try {
        String q = Uri.parse(url).getQueryParameter("q");
        if (q != null) {
          address.setText(q);
          return;
        }
      } catch (Exception ignored) {}
    }
    address.setText(url);
    address.setSelection(address.getText().length());
  }

  void updateNav() {
    updateBookmarkButton();
    if (btnBack != null) btnBack.setEnabled(web.canGoBack());
    if (btnForward != null) btnForward.setEnabled(web.canGoForward());
    if (btnBack != null) btnBack.setAlpha(web.canGoBack() ? 1f : 0.35f);
    if (btnForward != null) btnForward.setAlpha(web.canGoForward() ? 1f : 0.35f);
  }

  void hideKeyboard() {
    InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
    if (imm != null && address != null) imm.hideSoftInputFromWindow(address.getWindowToken(), 0);
    web.requestFocus();
  }

  @Override
  public void onBackPressed() {
    if (web != null && web.canGoBack()) {
      web.goBack();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  protected void onSaveInstanceState(Bundle out) {
    super.onSaveInstanceState(out);
    if (web != null) web.saveState(out);
  }

  @Override
  protected void onPause() {
    if (web != null) web.onPause();
    super.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (web != null) web.onResume();
  }

  @Override
  protected void onDestroy() {
    if (web != null) {
      web.loadUrl("about:blank");
      web.destroy();
    }
    super.onDestroy();
  }
}
