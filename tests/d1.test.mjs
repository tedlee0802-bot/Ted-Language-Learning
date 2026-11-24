import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { api, d1Bucket } from "../worker/server.mjs";

// Minimal stand-in for Cloudflare D1's prepare().bind().first()/all()/run() on a real SQLite database.
function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  const statement = (query, args = []) => ({
    bind: (...a) => statement(query, a),
    first: async () => sql.prepare(query).get(...args) ?? null,
    all: async () => ({ results: sql.prepare(query).all(...args) }),
    run: async () => sql.prepare(query).run(...args),
  });
  return { prepare: (query) => statement(query) };
}
const now = (d) => new Date(d + "+09:00");
async function req(e, path, { body, cookie, time = "2026-10-20T19:01:00" } = {}) {
  const h = {};
  if (body) h["Content-Type"] = "application/json";
  if (cookie) h.Cookie = cookie;
  const r = await api(
    new Request(
      "https://d1.test" + path,
      body ? { method: "POST", headers: h, body: JSON.stringify(body) } : { headers: h },
    ),
    e,
    now(time),
  );
  const set = r.headers.get("Set-Cookie");
  return { status: r.status, data: await r.json(), cookie: set ? set.split(";")[0] : null };
}

test("d1Bucket behaves like the R2 subset: get, put, delete and paged prefix listing", async () => {
  const b = d1Bucket(fakeD1());
  assert.equal(await b.get("missing"), null);
  for (const k of ["a/1", "a/2", "a/3", "ab/1", "b/1"]) await b.put(k, JSON.stringify({ k }));
  assert.deepEqual(JSON.parse(await (await b.get("a/2")).text()), { k: "a/2" });
  await b.put("a/2", "2");
  assert.equal(await (await b.get("a/2")).text(), "2");
  const first = await b.list({ prefix: "a/", limit: 2 });
  assert.deepEqual(
    first.objects.map((o) => o.key),
    ["a/1", "a/2"],
  );
  assert.equal(first.truncated, true);
  const rest = await b.list({ prefix: "a/", cursor: first.cursor, limit: 2 });
  assert.deepEqual(
    rest.objects.map((o) => o.key),
    ["a/3"],
  );
  assert.equal(rest.truncated, false);
  await b.delete("a/3");
  assert.deepEqual(
    (await b.list({ prefix: "a" })).objects.map((o) => o.key),
    ["a/1", "a/2", "ab/1"],
  );
});

test("the whole app runs on a D1 binding: seed, family sign-in, homework and quiz", async () => {
  const e = { DB: fakeD1() };
  const owner = (await req(e, "/api/auth/setup", { body: { name: "Ted", pin: "2468" } })).cookie;
  assert.ok(owner);
  const home = await req(e, "/api/homework?date=2026-10-19&lang=en", { cookie: owner });
  assert.equal(home.status, 200);
  assert.equal(home.data.lesson.items.length, 30);
  const q = await req(e, "/api/quiz?date=2026-10-20&lang=en&mode=review", { cookie: owner });
  const sub = await req(e, "/api/quiz/submit", {
    cookie: owner,
    body: {
      date: "2026-10-20",
      lang: "en",
      mode: "review",
      format: "choice",
      answers: q.data.items.map((i) => ({ id: i.id, answer: i.meaning })),
    },
  });
  assert.equal(sub.data.score, 100);
  const after = await req(e, "/api/homework?date=2026-10-20&lang=en", { cookie: owner });
  assert.equal(after.data.reviewRequired, false, "a write is visible to the next read");
  assert.equal(after.data.lesson.items.length, 30);
});
