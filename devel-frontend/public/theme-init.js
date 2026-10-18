// Runs before React loads so the page doesn't flash light before switching to dark.
// A separate file (not an inline <script>) so a strict Content-Security-Policy can allow it.
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (stored === null && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    // Storage can be blocked (private mode); fall back to the light theme.
  }
})();
