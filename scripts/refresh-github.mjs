import { writeFile, mkdir } from "node:fs/promises";
import { fetchGithub } from "../assets/js/github.js";

const data = await fetchGithub();
await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/github.json", import.meta.url), `${JSON.stringify(data, null, 2)}\n`);
console.log(`Saved the public GitHub profile for ${data.profile.login}.`);
