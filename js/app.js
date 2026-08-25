/**
 * RF MINISTRIES & ACADEMY
 * Clean Static Website Engine with Language Detection & User Login/Image Manager
 */

// Master Administrator Password
const ADMIN_PASSWORD = "Susie1028";

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
    btnElement.innerHTML = `✓ Copied!`;
    btnElement.classList.add("copied");
    setTimeout(() => {
      btnElement.innerHTML = originalHtml;
      btnElement.classList.remove("copied");
    }, 2000);
  }
};

// Open Admin / User Login Modal
window.openAdminModalFunc = function() {
  const modal = document.getElementById("adminModalOverlay");
  const authBox = document.getElementById("adminAuthBox");
  const dashboard = document.getElementById("adminDashboard");
  const passInput = document.getElementById("adminPasswordInput");
  const errMsg = document.getElementById("adminErrorMsg");

  if (modal) {
    modal.classList.add("active");
    if (authBox) authBox.style.display = "flex";
    if (dashboard) dashboard.style.display = "none";
    if (errMsg) errMsg.style.display = "none";
    if (passInput) {
      passInput.value = "";
      setTimeout(() => {
        passInput.focus();
      }, 100);
    }
  }
};

// Close Admin / User Login Modal
window.closeAdminModalFunc = function() {
  const modal = document.getElementById("adminModalOverlay");
  if (modal) modal.classList.remove("active");
};

// Unlock Admin Dashboard
window.handleAdminUnlock = function() {
  const passInput = document.getElementById("adminPasswordInput");
  const authBox = document.getElementById("adminAuthBox");
  const dashboard = document.getElementById("adminDashboard");
  const errMsg = document.getElementById("adminErrorMsg");

  if (!passInput) return;
  const entered = (passInput.value || "").trim();

  if (entered === "Susie1028" || entered.toLowerCase() === "susie1028") {
    if (authBox) authBox.style.display = "none";
    if (dashboard) dashboard.style.display = "flex";
    if (errMsg) errMsg.style.display = "none";
  } else {
    if (errMsg) errMsg.style.display = "block";
    passInput.focus();
    passInput.select();
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

// Publish to GitHub via Contents API
window.publishPhotosToGitHub = async function() {
  const tokenInput = document.getElementById("githubTokenInput");
  const statusMsg = document.getElementById("publishStatusMsg");
  let token = (tokenInput ? tokenInput.value : "").trim() || localStorage.getItem("rf_gh_token");

  if (!token) {
    if (statusMsg) {
      statusMsg.style.display = "block";
      statusMsg.style.color = "#EF4444";
      statusMsg.innerText = "Please enter your GitHub Personal Access Token (classic with repo scope or fine-grained).";
    }
    return;
  }

  localStorage.setItem("rf_gh_token", token);
  if (statusMsg) {
    statusMsg.style.display = "block";
    statusMsg.style.color = "#D4AF37";
    statusMsg.innerText = "Publishing photos to GitHub repository...";
  }

  const filesToSync = [
    { key: "rf_photo_pastor", path: "images/pastor-susie.jpg" },
    { key: "rf_photo_congregation", path: "images/congregation-prayer.jpg" },
    { key: "rf_photo_youth", path: "images/youth-prayer.jpg" },
    { key: "rf_photo_damas", path: "images/damas-prayer.jpg" }
  ];

  try {
    let count = 0;
    for (const item of filesToSync) {
      const dataUrl = localStorage.getItem(item.key);
      if (!dataUrl || !dataUrl.includes(",")) continue;

      const base64Content = dataUrl.split(",")[1];
      const apiUrl = `https://api.github.com/repos/RDEV660/roca-fuerte-ministries/contents/${item.path}`;

      let sha = "";
      try {
        const getRes = await fetch(apiUrl, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json"
          }
        });
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }
      } catch (err) {
        console.warn("Could not fetch file sha", err);
      }

      const body = {
        message: `Update ${item.path} via Admin Control Panel`,
        content: base64Content
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        count++;
      }
    }

    if (statusMsg) {
      if (count > 0) {
        statusMsg.style.color = "#10B981";
        statusMsg.innerText = `✓ Successfully published ${count} photo(s) to GitHub! Vercel is deploying the updates worldwide.`;
      } else {
        statusMsg.style.color = "#64748B";
        statusMsg.innerText = "No newly uploaded photos found in storage to sync.";
      }
    }
  } catch (err) {
    if (statusMsg) {
      statusMsg.style.color = "#EF4444";
      statusMsg.innerText = "Error syncing to GitHub. Please check your token.";
    }
  }
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
    });

    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
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

  if (openAdminBtn) openAdminBtn.addEventListener("click", window.openAdminModalFunc);
  if (closeAdminBtn) closeAdminBtn.addEventListener("click", window.closeAdminModalFunc);

  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal) window.closeAdminModalFunc();
    });
  }

  if (adminUnlockBtn) adminUnlockBtn.addEventListener("click", window.handleAdminUnlock);

  if (adminPasswordInput) {
    adminPasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.handleAdminUnlock();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeAdminModalFunc();
  });
});
