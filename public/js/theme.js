const THEME_KEY = "collectex-theme";
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "Theme clair" : "Theme sombre";
  }
}

const storedTheme = localStorage.getItem(THEME_KEY);
const initialTheme = storedTheme === "dark" ? "dark" : "light";
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}
