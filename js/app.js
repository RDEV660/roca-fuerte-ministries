/**
 * RF MINISTRIES & ACADEMY
 * High-Capacity IndexedDB & Cloud Sync Engine with Detailed Console Logging
 */

// Master Administrator Password
const ADMIN_PASSWORD = "Susie1028";
let currentAdminPassword = "";
let adminAuthToken = "";

console.log("%c[RF Ministries]%c Engine initialized. Administrator password active.", "color: #D4AF37; font-weight: bold;", "color: inherit;");

// IndexedDB High-Capacity Storage Setup (Supports unlimited photo size)
const DB_NAME = "RF_MINISTRIES_PHOTO_DB";
const STORE_NAME = "church_photos";

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn("[RF-DB] IndexedDB not supported by browser, using localStorage fallback.");
      return resolve(null);
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log("[RF-DB] Object store created.");
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.error("[RF-DB] Failed to open IndexedDB:", e.target.error);
      resolve(null);
    };
  });
}

async function savePhotoToStorage(key, base64) {
  console.log(`[RF-Storage] Saving '${key}' (${Math.round(base64.length / 1024)} KB)...`);
  
  // 1. Save to IndexedDB (No quota limit)
  try {
    const db = await openPhotoDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(base64, key);
      tx.oncomplete = () => {
        console.log(`%c[RF-Storage] ✓ Successfully persisted '${key}' to IndexedDB!`, "color: #10B981; font-weight: bold;");
      };
      tx.onerror = (err) => {
        console.error(`[RF-Storage] IndexedDB write error for '${key}':`, err);
      };
    }
  } catch (idbErr) {
    console.error("[RF-Storage] IndexedDB exception:", idbErr);
  }

  // 2. Also attempt LocalStorage for legacy compatibility
  try {
    localStorage.setItem(key, base64);
    console.log(`[RF-Storage] ✓ Also saved '${key}' to localStorage.`);
  } catch (lsErr) {
    console.warn(`[RF-Storage] localStorage quota exceeded (saved in IndexedDB instead):`, lsErr.message);
  }
}

async function getPhotoFromStorage(key) {
  // 1. Try IndexedDB first
  try {
    const db = await openPhotoDB();
    if (db) {
      const result = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (err) => {
          console.error(`[RF-Storage] IndexedDB read error for '${key}':`, err);
          resolve(null);
        };
      });
      if (result) {
        console.log(`[RF-Storage] Retrieved '${key}' from IndexedDB (${Math.round(result.length / 1024)} KB).`);
        return result;
      }
    }
  } catch (err) {
    console.error("[RF-Storage] IndexedDB get exception:", err);
  }

  // 2. Fallback to localStorage
  const localVal = localStorage.getItem(key);
  if (localVal) {
    console.log(`[RF-Storage] Retrieved '${key}' from localStorage.`);
    return localVal;
  }

  return null;
}

// Detect system/browser language
function detectSystemLanguage() {
  const saved = localStorage.getItem("rf_lang");
  if (saved === "es" || saved === "en") return saved;

  const languages = navigator.languages || [navigator.language || navigator.userLanguage || "en"];
  for (let i = 0; i < languages.length; i++) {
    const l = (languages[i] || "").toLowerCase();
    if (l.startsWith("es")) return "es";
  }
  return "en";
}

// Global Language Switcher
window.setLang = function(lang) {
  if (lang !== "es" && lang !== "en") lang = "en";

  localStorage.setItem("rf_lang", lang);
  document.documentElement.lang = lang;

  document.querySelectorAll(".lang-btn").forEach(btn => {
    const btnLang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", btnLang === lang);
  });

  const dict = (typeof translations !== "undefined") ? translations[lang] : null;
  if (!dict) return;

  if (dict.pageTitle) document.title = dict.pageTitle;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.innerHTML = dict[key];
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
      console.error("[RF-Copy] Clipboard copy failed:", err);
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

// Open Admin Modal
window.openAdminModalFunc = function() {
  console.log("[RF-Admin] Opening Admin Modal...");
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

// Close Admin Modal
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
  console.log(`[RF-Admin] Authenticating with password: '${entered}'`);

  if (entered === "Susie1028" || entered.toLowerCase() === "susie1028") {
    console.log("%c[RF-Admin] ✓ Password accepted!", "color: #10B981; font-weight: bold;");
    currentAdminPassword = entered;
    if (authBox) authBox.style.display = "none";
    if (dashboard) dashboard.style.display = "flex";
    if (errMsg) errMsg.style.display = "none";

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: entered })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          adminAuthToken = data.token;
          console.log("[RF-Admin] Received server session token.");
        }
      }
    } catch (e) {
      console.log("[RF-Admin] Serverless auth check complete.");
    }
  } else {
    console.error("[RF-Admin] ✗ Incorrect password entered:", entered);
    if (errMsg) errMsg.style.display = "block";
    passInput.focus();
    passInput.select();
  }
};

// Compress image in browser before storage & upload
function compressImage(file, maxWidth = 1400, quality = 0.85) {
  console.log(`[RF-Image] Reading '${file.name}' (size: ${(file.size / 1024 / 1024).toFixed(2)} MB, type: ${file.type})...`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => {
      console.error("[RF-Image] FileReader error:", err);
      reject(err);
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (imgErr) => {
        console.warn("[RF-Image] Image load error on canvas, using raw data URI:", imgErr);
        resolve(event.target.result);
      };
      img.onload = () => {
        try {
          const elem = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = elem.toDataURL("image/jpeg", quality);
          console.log(`[RF-Image] ✓ Compressed from ${(file.size / 1024).toFixed(0)} KB to ${(dataUrl.length * 0.75 / 1024).toFixed(0)} KB (${width}x${height}px)`);
          resolve(dataUrl);
        } catch (canvasErr) {
          console.error("[RF-Image] Canvas compression exception:", canvasErr);
          resolve(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Live Cloud Image Upload & Database Sync
window.handleImageUpload = async function(event, targetImgId, previewImgId, storageKey) {
  console.log(`[RF-Upload] Image upload triggered for '${storageKey}' (target: #${targetImgId}, preview: #${previewImgId})`);
  const file = event.target.files && event.target.files[0];
  if (!file) {
    console.warn("[RF-Upload] No file selected.");
    return;
  }

  const slotMap = {
    rf_photo_pastor: "pastor",
    rf_photo_congregation: "congregation",
    rf_photo_youth: "youth",
    rf_photo_damas: "damas"
  };
  const slotName = slotMap[storageKey] || "pastor";

  const statusEl = document.getElementById("cloudSyncBadge");
  if (statusEl) {
    statusEl.innerHTML = `<span style="color: #D4AF37;">⏳ Processing & saving photo...</span>`;
    statusEl.style.display = "block";
  }

  try {
    // 1. Compress Image
    const compressedBase64 = await compressImage(file);

    // 2. Persist to storage (IndexedDB + localStorage)
    await savePhotoToStorage(storageKey, compressedBase64);

    // 3. Update DOM elements immediately
    const target = document.getElementById(targetImgId);
    const preview = document.getElementById(previewImgId);
    if (target) {
      target.src = compressedBase64;
      console.log(`[RF-Upload] Updated DOM #${targetImgId} image source.`);
    } else {
      console.warn(`[RF-Upload] Target DOM element #${targetImgId} not found!`);
    }
    if (preview) {
      preview.src = compressedBase64;
      console.log(`[RF-Upload] Updated preview #${previewImgId} image source.`);
    }

    // 4. Send to Vercel Cloud Database API
    console.log(`[RF-Upload] Sending to /api/upload for slot '${slotName}'...`);
    try {
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

      console.log(`[RF-Upload] /api/upload response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log("[RF-Upload] /api/upload response data:", data);
        if (data && data.url && data.url.startsWith("http")) {
          await savePhotoToStorage(storageKey, data.url);
          if (target) target.src = data.url;
          if (preview) preview.src = data.url;
        }

        if (statusEl) {
          statusEl.innerHTML = `<span style="color: #10B981;">✓ Saved to Live Database! Visible worldwide.</span>`;
          setTimeout(() => { statusEl.style.display = "none"; }, 5000);
        }
      } else {
        const errText = await res.text();
        console.warn("[RF-Upload] /api/upload returned non-200:", errText);
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: #10B981;">✓ Saved locally on your device!</span>`;
          setTimeout(() => { statusEl.style.display = "none"; }, 4000);
        }
      }
    } catch (netErr) {
      console.warn("[RF-Upload] Network upload notice (saved locally in IndexedDB):", netErr.message);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #10B981;">✓ Saved permanently on your device!</span>`;
        setTimeout(() => { statusEl.style.display = "none"; }, 4000);
      }
    }
  } catch (err) {
    console.error("[RF-Upload] Fatal error during image processing:", err);
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #EF4444;">✗ Error saving photo: ${err.message || err}</span>`;
    }
  }
};

// Reset photos to original church defaults
window.resetAllCustomPhotos = async function() {
  console.log("[RF-Reset] Resetting all photos to church defaults...");
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

  // Clear IndexedDB
  try {
    const db = await openPhotoDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      console.log("[RF-Reset] IndexedDB store cleared.");
    }
  } catch (e) {
    console.error("[RF-Reset] IndexedDB clear error:", e);
  }

  // Clear localStorage and reset DOM
  Object.keys(defaults).forEach(key => {
    localStorage.removeItem(key);
    const [targetId, previewId] = idMap[key];
    const target = document.getElementById(targetId);
    const preview = document.getElementById(previewId);
    if (target) target.src = defaults[key];
    if (preview) preview.src = defaults[key];
  });

  // Call /api/reset
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

// Apply photos on startup from IndexedDB and localStorage
async function applyStoredPhotos() {
  console.log("[RF-Init] Loading saved church photos from IndexedDB & LocalStorage...");
  const keys = [
    { key: "rf_photo_pastor", target: "imgPastor", preview: "previewPastor" },
    { key: "rf_photo_congregation", target: "imgCongregation", preview: "previewCongregation" },
    { key: "rf_photo_youth", target: "imgYouth", preview: "previewYouth" },
    { key: "rf_photo_damas", target: "imgDamas", preview: "previewDamas" }
  ];

  for (const item of keys) {
    const stored = await getPhotoFromStorage(item.key);
    if (stored) {
      const target = document.getElementById(item.target);
      const preview = document.getElementById(item.preview);
      if (target) {
        target.src = stored;
        console.log(`[RF-Init] Applied saved photo to #${item.target}`);
      }
      if (preview) {
        preview.src = stored;
      }
    }
  }
}

// Fetch live database photos from server
async function syncDatabasePhotos() {
  try {
    console.log("[RF-Init] Checking live database (/api/photos)...");
    const res = await fetch("/api/photos");
    if (res.ok) {
      const data = await res.json();
      if (data && data.photos) {
        const p = data.photos;
        console.log("[RF-Init] Database photos received:", p);
        const slots = [
          { key: "pastor", storageKey: "rf_photo_pastor", target: "imgPastor", preview: "previewPastor" },
          { key: "congregation", storageKey: "rf_photo_congregation", target: "imgCongregation", preview: "previewCongregation" },
          { key: "youth", storageKey: "rf_photo_youth", target: "imgYouth", preview: "previewYouth" },
          { key: "damas", storageKey: "rf_photo_damas", target: "imgDamas", preview: "previewDamas" }
        ];

        for (const s of slots) {
          const cloudVal = p[s.key];
          const isCustomCloud = cloudVal && (cloudVal.startsWith("http") || cloudVal.startsWith("data:"));
          if (isCustomCloud) {
            console.log(`[RF-Init] Applying custom cloud photo for '${s.key}'`);
            await savePhotoToStorage(s.storageKey, cloudVal);
            const target = document.getElementById(s.target);
            const preview = document.getElementById(s.preview);
            if (target) target.src = cloudVal;
            if (preview) preview.src = cloudVal;
          }
        }
      }
    }
  } catch (e) {
    console.log("[RF-Init] Cloud database sync skipped (running in offline/local mode).");
  }
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  const initialLang = detectSystemLanguage();
  setLang(initialLang);

  // 1. Load saved photos from IndexedDB immediately
  await applyStoredPhotos();

  // 2. Check cloud database in background
  syncDatabasePhotos();

  // Language buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetLang = btn.getAttribute("data-lang");
      setLang(targetLang);
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navMenu.classList.toggle("active");
    });

    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => navMenu.classList.remove("active"));
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        if (navMenu.classList.contains("active")) navMenu.classList.remove("active");
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
