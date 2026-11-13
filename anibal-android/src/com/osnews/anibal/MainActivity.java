package com.osnews.anibal;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
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
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.Toast;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.util.Locale;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
  static final String HOME = "https://osnewspedrosg-glitch.github.io/osnews/anibal/";
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
  String pendingUrl, pendingUa, pendingCd, pendingMime;

  @Override
  protected void onCreate(Bundle saved) {
    super.onCreate(saved);
    getWindow().setStatusBarColor(Color.parseColor("#0B1220"));
    setContentView(R.layout.activity_main);

    web = findViewById(R.id.webview);
    address = findViewById(R.id.address);
    progress = findViewById(R.id.progress);
    btnBack = findViewById(R.id.btn_back);
    btnForward = findViewById(R.id.btn_forward);
    Button btnGo = findViewById(R.id.btn_go);

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
    s.setUserAgentString(s.getUserAgentString() + " AnibalOSNews/1.0");
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
      }

      @Override
      public void onPageFinished(WebView v, String url) {
        if (!userEditing) showUrl(url);
        updateNav();
      }

      @Override
      public void doUpdateVisitedHistory(WebView v, String url, boolean reload) {
        if (!userEditing) showUrl(url);
        updateNav();
      }
    });

    web.setWebChromeClient(new WebChromeClient() {
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
      if (action == EditorInfo.IME_ACTION_GO
          || action == EditorInfo.IME_ACTION_DONE
          || (ev != null && ev.getKeyCode() == KeyEvent.KEYCODE_ENTER
              && ev.getAction() == KeyEvent.ACTION_DOWN)) {
        goFromBar();
        return true;
      }
      return false;
    });
    address.setOnFocusChangeListener((v, has) -> {
      userEditing = has;
    });
    address.setOnClickListener(v -> userEditing = true);

    if (saved != null) {
      web.restoreState(saved);
    } else {
      web.loadUrl(HOME);
    }
    updateNav();
  }

  void goFromBar() {
    String q = address.getText() == null ? "" : address.getText().toString().trim();
    userEditing = false;
    hideKeyboard();
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
