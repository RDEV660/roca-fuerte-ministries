/**
 * ROCA FUERTE MINISTRIES & ACADEMY
 * Clean Static Website Engine with Automatic System Language Detection
 */

// Detect system/browser language
function detectSystemLanguage() {
  // 1. Check if user already manually selected a preferred language
  const saved = localStorage.getItem("rf_lang");
  if (saved === "es" || saved === "en") {
    return saved;
  }

  // 2. Inspect browser languages list (e.g. ['es-US', 'es', 'en'])
  const languages = navigator.languages || [navigator.language || navigator.userLanguage || "en"];
  for (let i = 0; i < languages.length; i++) {
    const l = (languages[i] || "").toLowerCase();
    if (l.startsWith("es")) {
      return "es";
    }
  }

  // 3. Default to English for English/other system locales
  return "en";
}

// Global Language Switcher
window.setLang = function(lang) {
  if (lang !== "es" && lang !== "en") {
    lang = "en";
  }

  // Save preference
  localStorage.setItem("rf_lang", lang);

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update active state on toggle buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    const btnLang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", btnLang === lang);
  });

  // Apply translations to all matching elements
  const dict = (typeof translations !== "undefined") ? translations[lang] : null;
  if (!dict) return;

  // Update Title & Meta Description
  if (dict.pageTitle) {
    document.title = dict.pageTitle;
  }

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });
};

// Initialize immediately on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const initialLang = detectSystemLanguage();
  setLang(initialLang);

  // Setup click listeners for language buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetLang = btn.getAttribute("data-lang");
      setLang(targetLang);
    });
  });

  // Mobile Navigation Drawer Toggle
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
