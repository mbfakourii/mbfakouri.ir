import { fetchGithub, readCache, writeCache, validateSnapshot } from "./github.js";
import { messages, translateDocument } from "./i18n.js";

let storage;
try { storage = window.localStorage; } catch { storage = null; }

function preference(key) {
  try { return storage?.getItem(key); } catch { return null; }
}

function savePreference(key, value) {
  try { storage?.setItem(key, value); } catch { /* The controls also work without persistence. */ }
}

const state = {
  locale: preference("mb-locale") === "fa" ? "fa" : "en",
  theme: preference("mb-theme") === "dark" ? "dark" : "light",
  data: null,
};
const $ = (selector) => document.querySelector(selector);
const t = (key) => messages[state.locale][key];
const avatar = $("#profile-avatar");
avatar.addEventListener("error", () => { avatar.style.visibility = "hidden"; });
avatar.addEventListener("load", () => { avatar.style.visibility = "visible"; });

function renderProfile() {
  const profile = state.data?.profile;
  const name = state.locale === "fa" ? "محمد باقر فکوری" : profile?.name || "Mohammad Bagher Fakouri";
  const heading = $("#profile-name");
  if (state.locale === "fa") {
    heading.replaceChildren(document.createTextNode(name));
  } else {
    const parts = name.trim().split(/\s+/);
    const last = parts.length > 1 ? parts.pop() : "";
    const firstLine = document.createElement("span");
    firstLine.className = "name-first";
    firstLine.textContent = parts.join(" ");
    const lastLine = document.createElement("span");
    lastLine.className = "name-last";
    lastLine.textContent = last;
    const dot = document.createElement("span");
    dot.className = "name-dot";
    dot.textContent = ".";
    lastLine.append(dot);
    heading.replaceChildren(firstLine, lastLine);
  }
  $("#profile-location").textContent = state.locale === "fa" && (!profile?.location || profile.location === "Gilan, Iran") ? "گیلان، ایران" : profile?.location || "Gilan, Iran";
  avatar.alt = name;
  if (profile && avatar.src !== profile.avatar_url) avatar.src = profile.avatar_url;
}

function renderTheme() {
  document.documentElement.dataset.theme = state.theme;
  const toggle = $("#theme-toggle");
  toggle.setAttribute("aria-label", t(state.theme === "dark" ? "lightTheme" : "darkTheme"));
  toggle.setAttribute("aria-pressed", String(state.theme === "dark"));
  toggle.querySelector("use").setAttribute("href", state.theme === "dark" ? "#sun" : "#moon");
  $("meta[name='theme-color']").content = state.theme === "dark" ? "#151811" : "#efeee8";
}

function renderLocale() {
  translateDocument(state.locale);
  const toggle = $("#language-toggle");
  toggle.textContent = state.locale === "en" ? "فا" : "EN";
  toggle.lang = state.locale === "en" ? "fa" : "en";
  toggle.setAttribute("aria-label", state.locale === "en" ? "Switch to Persian" : "Switch to English");
  renderTheme();
  renderProfile();
}

$("#theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  savePreference("mb-theme", state.theme);
  renderTheme();
});

$("#language-toggle").addEventListener("click", () => {
  state.locale = state.locale === "en" ? "fa" : "en";
  savePreference("mb-locale", state.locale);
  renderLocale();
});

function acceptData(data) {
  state.data = data;
  renderProfile();
}

async function initializeGithub() {
  const cache = readCache(storage);
  if (cache) acceptData(cache.data);
  if (cache?.fresh) return;

  try {
    const live = await fetchGithub();
    acceptData(live);
    writeCache(storage, live);
  } catch {
    if (cache) return;

    try {
      const response = await fetch(new URL("../../data/github.json", import.meta.url), { signal: AbortSignal.timeout(4000) });
      if (response.ok) acceptData(validateSnapshot(await response.json()));
    } catch { /* The HTML keeps the profile visible if both data sources are unavailable. */ }
  }
}

$("#current-year").textContent = new Date().getFullYear();
renderLocale();
void initializeGithub();
