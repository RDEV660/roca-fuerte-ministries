/**
 * ROCA FUERTE MINISTRIES & ACADEMY
 * Clean Static Website Engine
 */

// Global Language Switcher
window.setLang = function(lang) {
  if (lang !== "es" && lang !== "en") lang = "en";
  localStorage.setItem("rf_lang", lang);

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });

  const dict = translations[lang];
  if (!dict) return;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  document.documentElement.lang = lang;
};

function getActiveLang() {
  const saved = localStorage.getItem("rf_lang");
  if (saved) return saved;
  if (navigator.language && navigator.language.toLowerCase().startsWith("es")) {
    return "es";
  }
  return "en"; // Default to English
}

document.addEventListener("DOMContentLoaded", () => {
  // Set default language
  const initialLang = getActiveLang();
  setLang(initialLang);

  // Setup click listeners for language buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetLang = btn.getAttribute("data-lang");
      setLang(targetLang);
    });
  });

  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });
  }
});
