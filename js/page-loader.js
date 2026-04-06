(function () {
  if (window.__noctivePageLoaderBooted) return;
  window.__noctivePageLoaderBooted = true;

  var startTime = Date.now();
  var minVisibleMs = 420;

  var style = document.createElement("style");
  style.textContent = [
    "html.noctive-loader-active, body.noctive-loader-active { overflow: hidden !important; }",
    ".noctive-loader-overlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background: radial-gradient(circle at 50% 30%, rgba(71, 66, 121, 0.26), rgba(11, 12, 25, 0.97) 62%), linear-gradient(180deg, #15142a 0%, #0b0b17 100%); opacity: 1; transition: opacity 220ms ease; }",
    ".noctive-loader-overlay.is-exiting { opacity: 0; pointer-events: none; }",
    ".noctive-loader-shell { display: grid; justify-items: center; gap: 18px; padding: 28px 30px 24px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, rgba(29, 28, 54, 0.96), rgba(17, 17, 31, 0.96)); box-shadow: 0 24px 80px rgba(0,0,0,0.42); }",
    ".noctive-loader-cat-frame { width: 180px; height: 136px; display: grid; place-items: center; border-radius: 24px; background: transparent; box-shadow: none; overflow: hidden; }",
    ".noctive-loader-cat { width: 124px; height: 100px; object-fit: contain; transform-origin: center bottom; animation: noctiveLoaderBob 900ms ease-in-out infinite; image-rendering: pixelated; }",
    ".noctive-loader-copy { font-family: 'Inter', system-ui, sans-serif; font-size: 0.95rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.76); }",
    ".noctive-loader-copy strong { color: #ffd763; font-weight: 700; }",
    "@keyframes noctiveLoaderBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }"
  ].join("");
  document.head.appendChild(style);

  document.documentElement.classList.add("noctive-loader-active");
  document.body.classList.add("noctive-loader-active");

  var overlay = document.createElement("div");
  overlay.className = "noctive-loader-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = [
    '<div class="noctive-loader-shell">',
    '  <div class="noctive-loader-cat-frame">',
    '    <img class="noctive-loader-cat" src="/gifs/Hazel.gif" alt="Hazel loading animation">',
    '  </div>',
    '  <div class="noctive-loader-copy"><strong>Noctive</strong> loading</div>',
    '</div>'
  ].join("");

  function mountOverlay() {
    if (!document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  }

  function removeLoader() {
    var elapsed = Date.now() - startTime;
    var delay = Math.max(0, minVisibleMs - elapsed);
    window.setTimeout(function () {
      overlay.classList.add("is-exiting");
      document.documentElement.classList.remove("noctive-loader-active");
      document.body.classList.remove("noctive-loader-active");
      window.setTimeout(function () {
        overlay.remove();
      }, 240);
    }, delay);
  }

  if (document.body) {
    mountOverlay();
  } else {
    document.addEventListener("DOMContentLoaded", mountOverlay, { once: true });
  }

  if (document.readyState === "complete") {
    removeLoader();
  } else {
    window.addEventListener("load", removeLoader, { once: true });
  }
})();
