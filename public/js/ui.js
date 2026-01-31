(() => {
  const root = document.documentElement;

  //make default theme as light
  const saved = localStorage.getItem("theme");
  root.setAttribute("data-theme", saved || "light");

  //button to vhnage to dark theme

  const btn = document.querySelector("[data-theme-toggle]");
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
})();
