import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProfile, validateSnapshot, fetchGithub, readCache, writeCache, CACHE_KEY, CACHE_TTL, USERNAME } from "../assets/js/github.js";
import { messages } from "../assets/js/i18n.js";

const profile = { login: USERNAME, name: "Mohammad Bagher Fakouri", bio: "Developer", location: "Gilan, Iran", avatar_url: "https://avatars.githubusercontent.com/u/20955005?v=4" };
const snapshot = () => normalizeProfile(profile, "2026-11-14T06:00:00Z");

test("profile includes the GitHub photo at display resolution", () => {
  const data = snapshot();
  assert.equal(data.profile.name, profile.name);
  assert.equal(data.profile.bio, "Developer");
  assert.equal(new URL(data.profile.avatar_url).searchParams.get("s"), "800");
  assert.equal(data.profile.location, "Gilan, Iran");
});

test("profile rejects unexpected users, invalid dates and non-GitHub images", () => {
  assert.throws(() => normalizeProfile({ ...profile, login: "other" }));
  assert.throws(() => normalizeProfile({ ...profile, avatar_url: "javascript:alert(1)" }));
  assert.throws(() => normalizeProfile({ ...profile, avatar_url: "https://example.com/photo.jpg" }));
  assert.throws(() => validateSnapshot({ ...snapshot(), fetchedAt: "invalid" }));
});

test("cache freshness expires after one hour and stale data remains available", () => {
  const data = snapshot();
  let value;
  const storage = { getItem: (key) => key === CACHE_KEY ? value : null, setItem: (_, input) => { value = input; } };
  writeCache(storage, data);
  const timestamp = Date.parse(data.fetchedAt);
  assert.equal(readCache(storage, timestamp + CACHE_TTL - 1).fresh, true);
  assert.equal(readCache(storage, timestamp + CACHE_TTL).fresh, false);
  assert.deepEqual(readCache(storage, timestamp + CACHE_TTL).data, data);
  assert.equal(readCache(storage, timestamp - 1).fresh, false);
});

test("blocked storage and malformed caches allow snapshot fallback", () => {
  assert.equal(readCache(null), null);
  assert.equal(readCache({ getItem: () => "invalid json" }), null);
  assert.doesNotThrow(() => writeCache({ setItem: () => { throw new Error("QuotaExceededError"); } }, snapshot()));
});

test("live refresh reads the public profile and handles GitHub rate limiting", async () => {
  const data = await fetchGithub({ fetcher: async (url) => {
    assert.equal(url, "https://api.github.com/users/mbfakourii");
    return { ok: true, json: async () => profile };
  } });
  assert.equal(data.profile.name, profile.name);
  await assert.rejects(fetchGithub({ fetcher: async () => ({ ok: false, status: 403 }) }), /403/);
});

test("English and Persian have matching copy keys", () => {
  assert.deepEqual(Object.keys(messages.fa).sort(), Object.keys(messages.en).sort());
});

test("bundled fallback contains the actual GitHub profile and avatar", async () => {
  const { readFile } = await import("node:fs/promises");
  const data = validateSnapshot(JSON.parse(await readFile(new URL("../data/github.json", import.meta.url), "utf8")));
  assert.equal(data.profile.login, USERNAME);
  assert.ok(data.profile.avatar_url.startsWith("https://avatars.githubusercontent.com/"));
});
