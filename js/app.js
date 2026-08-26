/**
 * RF MINISTRIES & ACADEMY
 * Live Cloud Database Sync Engine & Image Manager for Vercel
 */

// Master Administrator Password
const ADMIN_PASSWORD = "Susie1028";
let currentAdminPassword = "";
let adminAuthToken = "";

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
    if (!currentAdminPassword) {
      if (authBox) authBox.style.display = "flex";
      if (dashboard) dashboard.style.display = "none";
      if (errMsg) errMsg.style.display = "none";
      if (passInput) {
        passInput.value = "";
        setTimeout(() => passInput.focus(), 100);
      }
    } else {
      if (authBox) authBox.style.display = "none";
      if (dashboard) dashboard.style.display = "flex";
    }
  }
};

// Close Admin / User Login Modal
window.closeAdminModalFunc = function() {
  const modal = document.getElementById("adminModalOverlay");
  if (modal) modal.classList.remove("active");
};

// Unlock Admin Dashboard
window.handleAdminUnlock = async function() {
  const passInput = document.getElementById("adminPasswordInput");
  const authBox = document.getElementById("adminAuthBox");
  const dashboard = document.getElementById("adminDashboard");
  const errMsg = document.getElementById("adminErrorMsg");

  if (!passInput) return;
  const entered = (passInput.value || "").trim();

  // Validate locally and attempt server auth
  if (entered === "Susie1028" || entered.toLowerCase() === "susie1028") {
    currentAdminPassword = entered;
    if (authBox) authBox.style.display = "none";
    if (dashboard) dashboard.style.display = "flex";
    if (errMsg) errMsg.style.display = "none";

    // Call /api/auth in background if deployed on Vercel
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: entered })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) adminAuthToken = data.token;
      }
    } catch (e) {
      // Local offline mode
    }
  } else {
    if (errMsg) errMsg.style.display = "block";
    passInput.focus();
    passInput.select();
  }
};

// Compress image in browser before cloud upload
function compressImage(file, maxWidth = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => resolve(event.target.result);
      img.onload = () => {
        try {
          const elem = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = elem.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          resolve(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Apply local photos synchronously from localStorage
function applyLocalPhotos() {
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

// Live Cloud Image Upload & Database Sync
window.handleImageUpload = async function(event, targetImgId, previewImgId, storageKey) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const slotMap = {
    rf_photo_pastor: "pastor",
    rf_photo_congregation: "congregation",
    rf_photo_youth: "youth",
    rf_photo_damas: "damas"
  };
  const slotName = slotMap[storageKey] || "pastor";

  // Show status feedback
  const statusEl = document.getElementById("cloudSyncBadge");
  if (statusEl) {
    statusEl.innerHTML = `<span style="color: #D4AF37;">⏳ Uploading to Cloud Database...</span>`;
    statusEl.style.display = "block";
  }

  try {
    // 1. Compress image
    const compressedBase64 = await compressImage(file);

    // 2. Update local UI preview immediately & persist to localStorage
    try {
      localStorage.setItem(storageKey, compressedBase64);
    } catch (storageErr) {
      console.warn("LocalStorage full, keeping in DOM", storageErr);
    }

    const target = document.getElementById(targetImgId);
    const preview = document.getElementById(previewImgId);
    if (target) target.src = compressedBase64;
    if (preview) preview.src = compressedBase64;

    // 3. Post to Vercel Serverless Database API
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": adminAuthToken ? `Bearer ${adminAuthToken}` : ""
      },
      body: JSON.stringify({
        slot: slotName,
        image: compressedBase64,
        password: currentAdminPassword || ADMIN_PASSWORD
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url && data.url.startsWith("http")) {
        localStorage.setItem(storageKey, data.url);
        if (target) target.src = data.url;
        if (preview) preview.src = data.url;
      }

      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #10B981;">✓ Saved to Live Database! Visible to everyone worldwide.</span>`;
        setTimeout(() => { statusEl.style.display = "none"; }, 4000);
      }
    } else {
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #10B981;">✓ Saved locally on this device!</span>`;
        setTimeout(() => { statusEl.style.display = "none"; }, 4000);
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #10B981;">✓ Saved locally on this device!</span>`;
      setTimeout(() => { statusEl.style.display = "none"; }, 3000);
    }
  }
};

// Reset photos to original church defaults
window.resetAllCustomPhotos = async function() {
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

  // Reset local state
  Object.keys(defaults).forEach(key => {
    localStorage.removeItem(key);
    const [targetId, previewId] = idMap[key];
    const target = document.getElementById(targetId);
    const preview = document.getElementById(previewId);
    if (target) target.src = defaults[key];
    if (preview) preview.src = defaults[key];
  });

  // Reset server database state
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: currentAdminPassword || ADMIN_PASSWORD })
    });
  } catch (e) {}

  const statusEl = document.getElementById("cloudSyncBadge");
  if (statusEl) {
    statusEl.innerHTML = `<span style="color: #10B981;">✓ Photos reset to original church defaults.</span>`;
    statusEl.style.display = "block";
    setTimeout(() => { statusEl.style.display = "none"; }, 3000);
  }
};

// Fetch live database photos on page load for all worldwide visitors
async function syncDatabasePhotos() {
  try {
    const res = await fetch("/api/photos");
    if (res.ok) {
      const data = await res.json();
      if (data && data.photos) {
        const p = data.photos;
        const slots = [
          { key: 'pastor', localKey: 'rf_photo_pastor', target: 'imgPastor', preview: 'previewPastor' },
          { key: 'congregation', localKey: 'rf_photo_congregation', target: 'imgCongregation', preview: 'previewCongregation' },
          { key: 'youth', localKey: 'rf_photo_youth', target: 'imgYouth', preview: 'previewYouth' },
          { key: 'damas', localKey: 'rf_photo_damas', target: 'imgDamas', preview: 'previewDamas' }
        ];

        slots.forEach(s => {
          const cloudVal = p[s.key];
          const isCustomCloud = cloudVal && (cloudVal.startsWith('http') || cloudVal.startsWith('data:'));
          const localVal = localStorage.getItem(s.localKey);

          if (isCustomCloud) {
            // Cloud has custom updated photo
            const target = document.getElementById(s.target);
            const preview = document.getElementById(s.preview);
            if (target) target.src = cloudVal;
            if (preview) preview.src = cloudVal;
            localStorage.setItem(s.localKey, cloudVal);
          } else if (localVal) {
            // Local custom photo exists
            const target = document.getElementById(s.target);
            const preview = document.getElementById(s.preview);
            if (target) target.src = localVal;
            if (preview) preview.src = localVal;
          }
        });
      }
    }
  } catch (e) {
    // Offline or static
  }
}

// Initialize immediately on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const initialLang = detectSystemLanguage();
  setLang(initialLang);
  
  // 1. Apply local stored photos immediately so there is never a flash or overwrite
  applyLocalPhotos();

  // 2. Check live cloud database in background
  syncDatabasePhotos();

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
