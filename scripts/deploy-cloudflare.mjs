// Deploy Lingo Daily to a free Cloudflare account (Workers + D1) and print its workers.dev address.
//
//   CLOUDFLARE_API_TOKEN=... node scripts/deploy-cloudflare.mjs
//
// Optional: CLOUDFLARE_ACCOUNT_ID (when the token sees several accounts), LD_WORKER_NAME (default
// "lingo-daily"), LD_SUBDOMAIN (workers.dev subdomain to register if the account has none yet).
// Behind an HTTPS proxy run Node with NODE_USE_ENV_PROXY=1.
// The token needs: Account > Workers Scripts > Edit, Account > D1 > Edit,
// Account > Account Settings > Read (and Workers subdomain edit if the account has no workers.dev name).
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const API = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw Error("Set CLOUDFLARE_API_TOKEN");
const name = process.env.LD_WORKER_NAME || "lingo-daily";
const DB_NAME = name;

async function cf(path, init = {}) {
  const r = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const v = await r.json().catch(() => ({}));
  if (!r.ok || v.success === false) {
    const err = Error(`${init.method || "GET"} ${path} -> ${r.status}: ${JSON.stringify(v.errors || v)}`);
    err.status = r.status;
    err.codes = (v.errors || []).map((e) => e.code);
    throw err;
  }
  return v.result;
}

// 1. Account
let account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!account) {
  const accounts = await cf("/accounts");
  if (accounts.length !== 1) throw Error(`Token sees ${accounts.length} accounts; set CLOUDFLARE_ACCOUNT_ID`);
  account = accounts[0].id;
}

// 2. D1 database (created once, reused afterwards)
let db = (await cf(`/accounts/${account}/d1/database?name=${encodeURIComponent(DB_NAME)}`)).find(
  (d) => d.name === DB_NAME,
);
if (!db) {
  db = await cf(`/accounts/${account}/d1/database`, { method: "POST", body: JSON.stringify({ name: DB_NAME }) });
  console.log("Created D1 database", DB_NAME);
}
const dbId = db.uuid || db.id;

// 3. Build and upload the Worker module
execFileSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
const code = await readFile("dist/server/index.js", "utf8");
const form = new FormData();
form.append(
  "metadata",
  new Blob(
    [
      JSON.stringify({
        main_module: "index.js",
        compatibility_date: "2025-09-01",
        bindings: [{ type: "d1", name: "DB", id: dbId }],
        keep_bindings: ["secret_text"], // keeps COACH_KEY if it was set with `wrangler secret put`
      }),
    ],
    { type: "application/json" },
  ),
);
form.append("index.js", new Blob([code], { type: "application/javascript+module" }), "index.js");
await cf(`/accounts/${account}/workers/scripts/${name}`, { method: "PUT", body: form });
console.log(`Uploaded Worker "${name}" (${Math.round(code.length / 1024)} KB)`);

// 4. workers.dev address
let sub;
try {
  sub = (await cf(`/accounts/${account}/workers/subdomain`)).subdomain;
} catch (e) {
  if (e.status !== 404 && !e.codes?.includes(10007)) throw e;
}
if (!sub) {
  sub = process.env.LD_SUBDOMAIN || "lingodaily-" + randomBytes(3).toString("hex");
  await cf(`/accounts/${account}/workers/subdomain`, { method: "PUT", body: JSON.stringify({ subdomain: sub }) });
  console.log("Registered workers.dev subdomain", sub);
}
await cf(`/accounts/${account}/workers/scripts/${name}/subdomain`, {
  method: "POST",
  body: JSON.stringify({ enabled: true, previews_enabled: false }),
});
const url = `https://${name}.${sub}.workers.dev`;
console.log("\nLingo Daily is live at " + url + "/");
console.log("Install page for the family: " + url + "/install");
