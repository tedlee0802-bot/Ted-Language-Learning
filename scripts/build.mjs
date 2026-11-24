import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url),
  read = (p) => readFile(new URL(p, root), "utf8");

// Inline the seed data so the Worker is a single dependency-free module.
let server = await read("worker/server.mjs"),
  seed = await read("worker/seed-data.mjs");
const seedImport = /^import\s*\{\s*SEED\s*\}\s*from\s*["']\.\/seed-data\.mjs["'];?\s*$/m;
if (!seedImport.test(server)) throw Error("seed-data import not found in worker/server.mjs");
server = server.replace(seedImport, () => seed.replace("export const SEED", "const SEED"));

// Every file under web/ (recursively) is served at the same path. Text files are embedded as
// strings, binary files (icons) as base64.
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const BINARY = new Set([".png"]);
async function walk(dir) {
  let out = [];
  for (const e of await readdir(new URL(dir, root), { withFileTypes: true })) {
    const p = dir + e.name;
    if (e.isDirectory()) out.push(...(await walk(p + "/")));
    else out.push(p);
  }
  return out;
}
const ext = (p) => p.slice(p.lastIndexOf("."));
const files = (await walk("web/")).filter((p) => TYPES[ext(p)]).sort();
const hash = createHash("sha256");
let assets = {};
for (const p of files) {
  const buf = await readFile(new URL(p, root)),
    e = ext(p);
  hash.update(p).update(buf);
  assets[p.slice(3)] = { type: TYPES[e], body: BINARY.has(e) ? buf.toString("base64") : buf.toString("utf8"), b64: BINARY.has(e) };
}
// The service worker cache name changes whenever any asset changes, so installed apps update.
const version = hash.digest("hex").slice(0, 12);
if (assets["/sw.js"]) assets["/sw.js"].body = assets["/sw.js"].body.replaceAll("__BUILD_VERSION__", version);

const source =
  server +
  `
const ASSETS = ${JSON.stringify(assets)};
function asset(path) {
  const file = path === "/" ? "/index.html" : path;
  const a = ASSETS[file];
  if (!a) return new Response("Not found", { status: 404 });
  const body = a.b64 ? Uint8Array.from(atob(a.body), (c) => c.charCodeAt(0)) : a.body;
  const headers = { "Content-Type": a.type, "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" };
  if (file === "/sw.js") headers["Service-Worker-Allowed"] = "/";
  return new Response(body, { headers });
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) return api(request, env);
    return asset(path);
  },
};
`;
await rm(new URL("dist", root), { recursive: true, force: true });
await mkdir(new URL("dist/server", root), { recursive: true });
await mkdir(new URL("dist/.openai", root), { recursive: true });
await writeFile(new URL("dist/server/index.js", root), source);
await writeFile(new URL("dist/.openai/hosting.json", root), await read(".openai/hosting.json"));
await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
console.log(`Worker artifact built and ESM validated (${files.length} assets, version ${version})`);
