/* Opens an X live search in a new navigation. No keys, no tracking, no data sent to OSNews. */
(function () {
  var form = document.getElementById("x-search");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = form.querySelector('input[name="q"]');
    var q = ((input && input.value) || "").trim();
    if (!q) return;
    var lang = form.getAttribute("data-lang") || document.documentElement.lang || "es";
    if (!/\blang:\w+/i.test(q)) q = q + " lang:" + lang;
    location.href = "https://x.com/search?q=" + encodeURIComponent(q) + "&f=live";
  });
})();
