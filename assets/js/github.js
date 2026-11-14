export const USERNAME = "mbfakourii";
export const CACHE_KEY = "mb-profile-github-v2";
export const CACHE_TTL = 60 * 60 * 1000;

export function normalizeProfile(profile, fetchedAt = new Date().toISOString()) {
  if (profile?.login !== USERNAME || !Number.isFinite(Date.parse(fetchedAt))) {
    throw new Error("Unexpected GitHub profile");
  }

  let avatar;
  try { avatar = new URL(profile.avatar_url); } catch { throw new Error("Invalid GitHub avatar"); }
  if (avatar.protocol !== "https:" || avatar.hostname !== "avatars.githubusercontent.com") {
    throw new Error("Invalid GitHub avatar");
  }
  avatar.searchParams.set("s", "800");

  const text = (value, fallback = "") => typeof value === "string" ? value : fallback;
  return {
    fetchedAt,
    profile: {
      login: USERNAME,
      name: text(profile.name, "Mohammad Bagher Fakouri"),
      bio: text(profile.bio, "Developer"),
      location: text(profile.location),
      avatar_url: avatar.href,
    },
  };
}

export function validateSnapshot(data) {
  return normalizeProfile(data?.profile, data?.fetchedAt ?? "invalid");
}

export function readCache(storage, now = Date.now()) {
  try {
    const data = validateSnapshot(JSON.parse(storage.getItem(CACHE_KEY)));
    const age = now - Date.parse(data.fetchedAt);
    return { data, fresh: age >= 0 && age < CACHE_TTL };
  } catch {
    return null;
  }
}

export function writeCache(storage, data) {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // The bundled snapshot also works when browser storage is disabled.
  }
}

export async function fetchGithub({ fetcher = globalThis.fetch, signal = AbortSignal.timeout(8000) } = {}) {
  const response = await fetcher(`https://api.github.com/users/${USERNAME}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  return normalizeProfile(await response.json());
}
