/* Azum · commit Android IME composition before a send or form submit. No tracking. */
(function () {
  function composing(event) {
    return Boolean(event && (event.isComposing || event.keyCode === 229));
  }
  function isField(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    return tag === "TEXTAREA" || tag === "INPUT";
  }
  function blurField(el) {
    if (isField(el) && typeof el.blur === "function") el.blur();
  }

  document.addEventListener("keydown", (event) => {
    if (!isField(event.target)) return;
    if (composing(event) && (event.key === "Enter" || event.keyCode === 13)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    const btn = target && target.closest ? target.closest("button, input[type='submit']") : null;
    if (!btn) return;
    const active = document.activeElement;
    if (active && active !== btn) blurField(active);
  }, true);

  document.addEventListener("submit", (event) => {
    if (composing(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    blurField(document.activeElement);
  }, true);
})();
