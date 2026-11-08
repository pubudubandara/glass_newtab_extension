const DEFAULT_SITES = [
  {name:"Google", url:"https://www.google.com"},
  {name:"YouTube", url:"https://www.youtube.com"},
  {name:"GitHub", url:"https://github.com"},
  {name:"Gmail", url:"https://mail.google.com"},
  {name:"Wikipedia", url:"https://www.wikipedia.org"},
  {name:"ChatGPT", url:"https://chatgpt.com"}
];

const $ = id => document.getElementById(id);

// Added favSize to settings defaults
let settings = {format:12, size:"medium", favSize:"medium", alignment:"center", background:"", greetingName:"Pubudu", sites:DEFAULT_SITES};
let editingIndex = null;
let digitNodes = [];
let clockStructure = "";

async function loadSettings() {
  const saved = await chrome.storage.local.get("glassNewTab");
  if (saved.glassNewTab) settings = {...settings, ...saved.glassNewTab};
  applySettings();
  renderFavorites();
  updateClock(true);
}

function saveSettings() { 
  return chrome.storage.local.set({glassNewTab: settings}); 
}

function applySettings() {
  $("clock").className = `clock size-${settings.size}`;
  $("favorites").className = `favorites-grid size-${settings.favSize}`;
  $("layout").className = `layout align-${settings.alignment}`;
  $("alignment").value = settings.alignment;
  $("greetingName").value = settings.greetingName || "";
  
  // Update active state for Clock Size buttons
  document.querySelectorAll("#sizeOptions [data-size]").forEach(b => {
    b.classList.toggle("active", b.dataset.size === settings.size);
  });
  
  // Update active state for Favorites Size buttons
  document.querySelectorAll("#favSizeOptions [data-size]").forEach(b => {
    b.classList.toggle("active", b.dataset.size === settings.favSize);
  });

  $("formatToggle").textContent = `${settings.format}H`;
  document.querySelector(".backdrop").style.backgroundImage = settings.background ? `url("${settings.background}")` : "none";
}

function buildClock(groups, suffix) {
  const clock = $("clock");
  clock.replaceChildren();
  digitNodes = [];
  
  groups.forEach((groupText, groupIndex) => {
    if (groupIndex) {
      const colon = document.createElement("div");
      colon.className = "colon";
      colon.textContent = ":";
      clock.append(colon);
    }
    const group = document.createElement("div");
    group.className = "digit-group";
    
    [...groupText].forEach((char, digitIndex) => {
      const card = document.createElement("div");
      card.className = "digit";
      const span = document.createElement("span");
      span.textContent = char;
      card.append(span);
      group.append(card);
      digitNodes.push({card, span});
    });
    clock.append(group);
  });
  
  if (suffix) {
    const ampm = document.createElement("div");
    ampm.className = "ampm";
    ampm.textContent = suffix;
    clock.append(ampm);
  }
  clockStructure = `${groups.map(g=>g.length).join(":")}|${Boolean(suffix)}`;
}

function updateGreeting(now = new Date()) {
  const hour = now.getHours();
  const period = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = (settings.greetingName || "").trim();
  $("greeting").textContent = name ? `${period}, ${name}` : period;
}

function updateClock(forceRebuild = false) {
  const now = new Date();
  updateGreeting(now);
  
  let h = now.getHours(), suffix = "";
  if (settings.format === 12) {
    suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }
  
  const groups = [String(h).padStart(2,"0"), String(now.getMinutes()).padStart(2,"0")];
  const flat = groups.join("");
  const structure = `${groups.map(g=>g.length).join(":")}|${Boolean(suffix)}`;
  
  if (forceRebuild || structure !== clockStructure || digitNodes.length !== flat.length) {
    buildClock(groups, suffix);
    digitNodes.forEach((item, index) => { item.span.textContent = flat[index]; });
  } else {
    digitNodes.forEach((item, index) => {
      const next = flat[index];
      if (item.span.textContent !== next) {
        item.span.textContent = next;
        item.card.classList.remove("flip");
        void item.card.offsetWidth; // Trigger reflow
        item.card.classList.add("flip");
        setTimeout(() => item.card.classList.remove("flip"), 900);
      }
    });
    const ampm = $("clock").querySelector(".ampm");
    if (ampm && ampm.textContent !== suffix) ampm.textContent = suffix;
  }
  $("date").textContent = now.toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric", year:"numeric"});
}

function faviconFor(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; }
  catch { return ""; }
}

function colorForSite(site) {
  let hash = 0;
  const source = `${site.name}-${site.url}`;
  for (let i=0; i<source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsla(${hue}, 78%, 68%, .22)`;
}

function renderFavorites() {
  const grid = $("favorites"); 
  grid.replaceChildren();
  
  // Removed .slice(0,6) to allow unlimited links
  settings.sites.forEach((site, index) => {
    const a = document.createElement("a"); 
    a.className = "site-card"; // Removed "glass" class so there is no large background
    a.href = site.url; 
    a.title = `Open ${site.name}`;
    
    const icon = document.createElement("div"); 
    icon.className = "site-icon";
    icon.style.setProperty("--site-tint", colorForSite(site));
    
    const img = document.createElement("img"); 
    img.src = faviconFor(site.url); 
    img.alt = ""; 
    img.onerror = () => { img.remove(); icon.textContent = site.name.slice(0,1).toUpperCase(); };
    
    icon.append(img);
    
    const name = document.createElement("div"); 
    name.className = "site-name"; 
    name.textContent = site.name;
    
    a.append(icon, name);
    a.addEventListener("contextmenu", e => { e.preventDefault(); openSiteEditor(index); });
    
    grid.append(a);
  });
  
  // Always append the "Add site" button at the end
  const add = document.createElement("button"); 
  add.className = "add-card"; 
  add.innerHTML = '<div class="add-plus">+</div><div class="site-name">Add site</div>';
  add.addEventListener("click", () => openSiteEditor(null)); 
  grid.append(add);
}

function openSiteEditor(index) {
  editingIndex = index; 
  $("siteDialogTitle").textContent = index === null ? "Add favourite" : "Edit favourite";
  $("siteName").value = index === null ? "" : settings.sites[index].name;
  $("siteUrl").value = index === null ? "" : settings.sites[index].url;
  $("deleteSite").style.visibility = index === null ? "hidden" : "visible";
  $("siteDialog").showModal();
}

// Event Listeners
$("openSettings").addEventListener("click", () => $("settingsDialog").showModal());

$("formatToggle").addEventListener("click", async () => {
  settings.format = settings.format === 12 ? 24 : 12; 
  applySettings(); 
  updateClock(true); 
  await saveSettings();
});

$("sizeOptions").addEventListener("click", async e => {
  const b = e.target.closest("[data-size]"); 
  if(!b) return; 
  settings.size = b.dataset.size; 
  applySettings(); 
  await saveSettings();
});

// Event Listener for Favorites Size Options
$("favSizeOptions")?.addEventListener("click", async e => {
  const b = e.target.closest("[data-size]");
  if(!b) return;
  settings.favSize = b.dataset.size;
  applySettings();
  await saveSettings();
});

$("alignment").addEventListener("change", async e => {
  settings.alignment = e.target.value; 
  applySettings(); 
  await saveSettings();
});

$("greetingName").addEventListener("change", async e => {
  settings.greetingName = e.target.value.trim().slice(0,30); 
  applySettings(); 
  updateClock(); 
  await saveSettings();
});

$("backgroundFile").addEventListener("change", e => {
  const file = e.target.files[0]; 
  if(!file) return;
  if(file.size > 5 * 1024 * 1024) { 
    alert("Please choose an image smaller than 5 MB."); 
    e.target.value = ""; 
    return; 
  }
  const reader = new FileReader(); 
  reader.onload = async () => { 
    settings.background = reader.result; 
    applySettings(); 
    await saveSettings(); 
  }; 
  reader.readAsDataURL(file);
});

$("clearBackground").addEventListener("click", async () => {
  settings.background = ""; 
  $("backgroundFile").value = ""; 
  applySettings(); 
  await saveSettings();
});

$("siteForm").addEventListener("submit", async e => {
  e.preventDefault(); 
  let url = $("siteUrl").value.trim();
  if(!/^https?:\/\//i.test(url)) url = "https://" + url;
  try { url = new URL(url).href; } catch { alert("Enter a valid website URL."); return; }
  
  const site = {name: $("siteName").value.trim(), url};
  
  if(editingIndex === null) {
    settings.sites.push(site);
  } else {
    settings.sites[editingIndex] = site;
  }
  
  await saveSettings();
  renderFavorites();
  $("siteDialog").close();
});

$("deleteSite").addEventListener("click", async () => {
  if(editingIndex === null) return;
  settings.sites.splice(editingIndex, 1);
  await saveSettings();
  renderFavorites();
  $("siteDialog").close();
});

// Initialization
loadSettings();
setInterval(updateClock, 1000);