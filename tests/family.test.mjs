import test from "node:test";
import assert from "node:assert/strict";
import { api, quizItems } from "../worker/server.mjs";

class Bucket {
  store = new Map();
  async get(k) {
    let s = this.store.get(k);
    return s === undefined ? null : { text: async () => s };
  }
  async put(k, v) {
    this.store.set(k, v);
  }
  async delete(k) {
    this.store.delete(k);
  }
  async list({ prefix }) {
    return {
      objects: [...this.store.keys()]
        .filter((k) => k.startsWith(prefix))
        .sort()
        .map((key) => ({ key })),
      truncated: false,
    };
  }
}
const now = (d) => new Date(d + "+09:00");
async function req(e, path, { body, cookie, headers = {}, time = "2026-10-20T19:01:00" } = {}) {
  const h = { ...headers };
  if (body) h["Content-Type"] = "application/json";
  if (cookie) h.Cookie = cookie;
  const r = await api(
    new Request(
      "https://family.test" + path,
      body ? { method: "POST", headers: h, body: JSON.stringify(body) } : { headers: h },
    ),
    e,
    now(time),
  );
  const set = r.headers.get("Set-Cookie");
  return { status: r.status, data: await r.json(), cookie: set ? set.split(";")[0] : null };
}
async function family() {
  const e = { BUCKET: new Bucket(), COACH_KEY: "coach-secret-123" };
  await req(e, "/api/coach/seed", { body: {} });
  const setup = await req(e, "/api/auth/setup", { body: { name: "Ted", pin: "2468" } });
  assert.equal(setup.status, 200);
  const owner = setup.cookie;
  const added = await req(e, "/api/auth/profiles", { body: { name: "딸", pin: "1357" }, cookie: owner });
  assert.equal(added.status, 200);
  const login = await req(e, "/api/auth/login", { body: { id: added.data.profile.id, pin: "1357" } });
  assert.equal(login.status, 200);
  return { e, owner, kid: login.cookie, kidId: added.data.profile.id };
}
async function answerAll(e, cookie, date, mode) {
  const q = await req(e, `/api/quiz?date=${date}&lang=en&mode=${mode}`, { cookie });
  assert.equal(q.status, 200, JSON.stringify(q.data));
  return req(e, "/api/quiz/submit", {
    cookie,
    body: {
      date,
      lang: "en",
      mode,
      format: "choice",
      answers: q.data.items.map((i) => ({ id: i.id, answer: i.meaning })),
    },
  });
}

test("setup creates the owner once; afterwards every learner request needs a session", async () => {
  const { e, owner } = await family();
  assert.equal((await req(e, "/api/auth/setup", { body: { name: "X", pin: "1111" } })).status, 409);
  const anon = await req(e, "/api/homework?date=2026-10-20&lang=en");
  assert.equal(anon.status, 401);
  assert.equal(anon.data.auth, true);
  const state = await req(e, "/api/auth/state");
  assert.deepEqual(
    state.data.profiles.map((p) => [p.name, p.owner]),
    [
      ["Ted", true],
      ["딸", false],
    ],
  );
  assert.equal(state.data.me, null);
  assert.ok(!JSON.stringify(state.data).includes("hash"), "PIN hashes must never be returned");
  assert.equal((await req(e, "/api/homework?date=2026-10-20&lang=en", { cookie: owner })).status, 200);
});

test("owner keeps the original top-level records; family records are separate", async () => {
  const { e, owner, kid, kidId } = await family();
  assert.equal((await answerAll(e, owner, "2026-10-20", "review")).status, 200);
  assert.ok(e.BUCKET.store.has("progress/en.json"), "owner writes to the original keys");
  // The owner's review does not unlock the lesson for the daughter.
  const kidHome = await req(e, "/api/homework?date=2026-10-20&lang=en", { cookie: kid });
  assert.equal(kidHome.data.reviewRequired, true);
  assert.equal(kidHome.data.lesson, null);
  assert.equal(kidHome.data.stats.attempts, 0);
  await assert.rejects(() =>
    quizItems(e, "2026-10-20", "en", "evening", now("2026-10-20T19:01:00"), `users/${kidId}/`),
  );
  assert.equal((await answerAll(e, kid, "2026-10-20", "review")).status, 200);
  assert.ok(e.BUCKET.store.has(`users/${kidId}/progress/en.json`));
  const after = await req(e, "/api/homework?date=2026-10-20&lang=en", { cookie: kid });
  assert.equal(after.data.lesson.items.length, 30);
  assert.equal(after.data.stats.attempts, 1);
  const ownerHome = await req(e, "/api/homework?date=2026-10-20&lang=en", { cookie: owner });
  assert.equal(ownerHome.data.stats.attempts, 1);
  // Study marks are per person too.
  const id = after.data.lesson.items[0].id;
  await req(e, "/api/study", { cookie: kid, body: { date: "2026-10-20", lang: "en", ids: [id] } });
  assert.deepEqual((await req(e, "/api/homework?date=2026-10-20&lang=en", { cookie: owner })).data.study, []);
});

test("wrong PINs lock the profile for 15 minutes", async () => {
  const { e, kidId } = await family();
  for (let n = 1; n <= 5; n++) {
    const r = await req(e, "/api/auth/login", { body: { id: kidId, pin: "0000" }, time: "2026-10-20T08:00:00" });
    assert.equal(r.status, 400);
    assert.equal(r.cookie, null);
  }
  const locked = await req(e, "/api/auth/login", { body: { id: kidId, pin: "1357" }, time: "2026-10-20T08:10:00" });
  assert.equal(locked.status, 400);
  assert.match(locked.data.error, /분 뒤/);
  const later = await req(e, "/api/auth/login", { body: { id: kidId, pin: "1357" }, time: "2026-10-20T08:16:00" });
  assert.equal(later.status, 200);
});

test("coach endpoints need the owner session or the coach key", async () => {
  const { e, owner, kid } = await family();
  assert.equal((await req(e, "/api/coach/context")).status, 403);
  assert.equal((await req(e, "/api/coach/context", { cookie: kid })).status, 403);
  assert.equal((await req(e, "/api/coach/context", { headers: { "X-Coach-Key": "wrong" } })).status, 403);
  const byKey = await req(e, "/api/coach/context", { headers: { "X-Coach-Key": "coach-secret-123" } });
  assert.equal(byKey.status, 200);
  assert.equal(byKey.data.learners.length, 2);
  assert.equal((await req(e, "/api/coach/context", { cookie: owner })).status, 200);
});

test("only the owner manages profiles; anyone can change their own PIN; logout ends the session", async () => {
  const { e, owner, kid, kidId } = await family();
  assert.equal((await req(e, "/api/auth/profiles", { cookie: kid, body: { name: "친구", pin: "1234" } })).status, 403);
  assert.equal((await req(e, "/api/auth/pin", { cookie: kid, body: { current: "9999", pin: "8642" } })).status, 400);
  assert.equal((await req(e, "/api/auth/pin", { cookie: kid, body: { current: "1357", pin: "8642" } })).status, 200);
  assert.equal((await req(e, "/api/auth/login", { body: { id: kidId, pin: "8642" } })).status, 200);
  assert.equal((await req(e, "/api/auth/pin", { cookie: owner, body: { id: kidId, pin: "5555" } })).status, 200);
  assert.equal((await req(e, "/api/auth/login", { body: { id: kidId, pin: "5555" } })).status, 200);
  assert.equal((await req(e, "/api/auth/profiles", { cookie: owner, body: { name: "딸", pin: "1234" } })).status, 400);
  assert.equal((await req(e, "/api/auth/logout", { cookie: kid, body: {} })).status, 200);
  assert.equal((await req(e, "/api/homework", { cookie: kid })).status, 401);
  const removed = await req(e, "/api/auth/remove", { cookie: owner, body: { id: kidId } });
  assert.equal(removed.status, 200);
  assert.equal((await req(e, "/api/auth/state")).data.profiles.length, 1);
});
