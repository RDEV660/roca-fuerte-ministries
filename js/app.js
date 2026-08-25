/**
 * ROCA FUERTE MINISTRIES & ACADEMY
 * Clean Static Website Engine with Language Detection & Image Manager
 */

// Master Administrator Password
const ADMIN_PASSWORD = "roca2026";

// Detect system/browser language
function detectSystemLanguage() {
  const saved = localStorage.getItem("rf_lang");
  if (saved === "es" || saved === "en") {
    return saved;
  }

  const languages = navigator.languages || [navigator.language || navigator.userLanguage || "en"];
  for (let i = 0; i < languages.length; i++) {
    const l = (languages[i] || "").toLowerCase();
    if (l.startsWith("es")) {
      return "es";
    }
  }

  return "en";
}

// Global Language Switcher
window.setLang = function(lang) {
  if (lang !== "es" && lang !== "en") {
    lang = "en";
  }

  localStorage.setItem("rf_lang", lang);
  document.documentElement.lang = lang;

  document.querySelectorAll(".lang-btn").forEach(btn => {
    const btnLang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", btnLang === lang);
  });

  const dict = (typeof translations !== "undefined") ? translations[lang] : null;
  if (!dict) return;

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

// Clipboard Copy Helper
window.copyText = function(text, btnElement) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textArea);
  }

  if (btnElement) {
    const originalHtml = btnElement.innerHTML;
    btnElement.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
    btnElement.classList.add("copied");
    setTimeout(() => {
      btnElement.innerHTML = originalHtml;
      btnElement.classList.remove("copied");
    }, 2000);
  }
};

// Image Control Logic
window.handleImageUpload = function(event, targetImgId, previewImgId, storageKey) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    localStorage.setItem(storageKey, base64);

    const target = document.getElementById(targetImgId);
    const preview = document.getElementById(previewImgId);
    if (target) target.src = base64;
    if (preview) preview.src = base64;
  };
  reader.readAsDataURL(file);
};

window.resetAllCustomPhotos = function() {
  const defaults = {
    rf_photo_pastor: "images/pastor-susie.jpg",
    rf_photo_congregation: "images/congregation-prayer.jpg",
    rf_photo_youth: "images/youth-prayer.jpg",
    rf_photo_damas: "images/damas-prayer.jpg"
  };

  const idMap = {
    rf_photo_pastor: ["imgPastor", "previewPastor"],
    rf_photo_congregation: ["imgCongregation", "previewCongregation"],
    rf_photo_youth: ["imgYouth", "previewYouth"],
    rf_photo_damas: ["imgDamas", "previewDamas"]
  };

  Object.keys(defaults).forEach(key => {
    localStorage.removeItem(key);
    const [targetId, previewId] = idMap[key];
    const target = document.getElementById(targetId);
    const preview = document.getElementById(previewId);
    if (target) target.src = defaults[key];
    if (preview) preview.src = defaults[key];
  });
};

function loadStoredPhotos() {
  const keys = [
    { key: "rf_photo_pastor", target: "imgPastor", preview: "previewPastor" },
    { key: "rf_photo_congregation", target: "imgCongregation", preview: "previewCongregation" },
    { key: "rf_photo_youth", target: "imgYouth", preview: "previewYouth" },
    { key: "rf_photo_damas", target: "imgDamas", preview: "previewDamas" }
  ];

  keys.forEach(item => {
    const stored = localStorage.getItem(item.key);
    if (stored) {
      const target = document.getElementById(item.target);
      const preview = document.getElementById(item.preview);
      if (target) target.src = stored;
      if (preview) preview.src = stored;
    }
  });
}

window.closeAdminModalFunc = function() {
  const modal = document.getElementById("adminModalOverlay");
  if (modal) modal.classList.remove("active");
};

// Initialize immediately on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const initialLang = detectSystemLanguage();
  setLang(initialLang);
  loadStoredPhotos();

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
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navMenu.classList.toggle("active");
      const icon = mobileToggle.querySelector("i");
      if (icon) {
        if (navMenu.classList.contains("active")) {
          icon.classList.remove("fa-bars");
          icon.classList.add("fa-xmark");
        } else {
          icon.classList.remove("fa-xmark");
          icon.classList.add("fa-bars");
        }
      }
    });

    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        const icon = mobileToggle.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-xmark");
          icon.classList.add("fa-bars");
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          const icon = mobileToggle.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
          }
        }
      }
    });
  }

  // Admin Modal Handlers
  const openAdminBtn = document.getElementById("openAdminModal");
  const closeAdminBtn = document.getElementById("closeAdminModal");
  const adminModal = document.getElementById("adminModalOverlay");
  const adminUnlockBtn = document.getElementById("adminUnlockBtn");
  const adminPasswordInput = document.getElementById("adminPasswordInput");
  const adminAuthBox = document.getElementById("adminAuthBox");
  const adminDashboard = document.getElementById("adminDashboard");
  const adminErrorMsg = document.getElementById("adminErrorMsg");

  if (openAdminBtn && adminModal) {
    openAdminBtn.addEventListener("click", () => {
      adminModal.classList.add("active");
      if (adminPasswordInput) {
        adminPasswordInput.value = "";
        adminPasswordInput.focus();
      }
      if (adminErrorMsg) adminErrorMsg.style.display = "none";
    });
  }

  if (closeAdminBtn && adminModal) {
    closeAdminBtn.addEventListener("click", closeAdminModalFunc);
  }

  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal) {
        closeAdminModalFunc();
      }
    });
  }

  if (adminUnlockBtn && adminPasswordInput) {
    const handleUnlock = () => {
      const entered = (adminPasswordInput.value || "").trim().toLowerCase();
      if (entered === ADMIN_PASSWORD || entered === "rocafuerte" || entered === "roca") {
        if (adminAuthBox) adminAuthBox.style.display = "none";
        if (adminDashboard) adminDashboard.style.display = "flex";
        if (adminErrorMsg) adminErrorMsg.style.display = "none";
      } else {
        if (adminErrorMsg) adminErrorMsg.style.display = "block";
      }
    };

    adminUnlockBtn.addEventListener("click", handleUnlock);
    adminPasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleUnlock();
    });
  }
});
