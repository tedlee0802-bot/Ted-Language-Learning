import test from "node:test";
import assert from "node:assert/strict";
import { api, validateLesson } from "../worker/server.mjs";

class Bucket {
  store = new Map();
  async get(k) {
    const s = this.store.get(k);
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
      "https://levels.test" + path,
      body ? { method: "POST", headers: h, body: JSON.stringify(body) } : { headers: h },
    ),
    e,
    now(time),
  );
  const set = r.headers.get("Set-Cookie");
  return { status: r.status, data: await r.json(), cookie: set ? set.split(";")[0] : null };
}
async function seeded() {
  const e = { BUCKET: new Bucket(), COACH_KEY: "k" };
  await req(e, "/api/coach/seed", { body: {} });
  return e;
}
async function answerAll(e, cookie, date, mode, lang = "en") {
  const q = await req(e, `/api/quiz?date=${date}&lang=${lang}&mode=${mode}`, { cookie });
  assert.equal(q.status, 200, JSON.stringify(q.data));
  return req(e, "/api/quiz/submit", {
    cookie,
    body: { date, lang, mode, format: "choice", answers: q.data.items.map((i) => ({ id: i.id, answer: i.meaning })) },
  });
}

test("every level has a full, valid first week", async () => {
  const e = await seeded();
  const c = await req(e, "/api/coach/context");
  for (const track of ["basic", "intermediate", "advanced"])
    for (const lang of ["en", "zh"]) {
      const week = c.data.lessons.filter((l) => l.track === track && l.lang === lang);
      assert.equal(week.length, 5, `${lang} ${track}`);
      for (const l of week) validateLesson(structuredClone(l));
    }
  assert.deepEqual(c.data.rules.tracks, ["basic", "intermediate", "advanced"]);
});

test("a learner's level decides which lesson, review gate and weekend test they get", async () => {
  const e = await seeded();
  const basic = await req(e, "/api/homework?date=2026-10-19&lang=en");
  assert.equal(basic.data.track, "basic");
  assert.equal(basic.data.lesson.items[0].term, "arrive");
  assert.equal(basic.data.profile.chosen, false);
  assert.equal((await req(e, "/api/profile", { body: { en: "advanced", zh: "intermediate" } })).status, 200);
  const adv = await req(e, "/api/homework?date=2026-10-19&lang=en");
  assert.equal(adv.data.track, "advanced");
  assert.equal(adv.data.trackName, "고급");
  assert.equal(adv.data.lesson.items[0].term, "leverage");
  assert.equal(adv.data.profile.chosen, true);
  const zh = await req(e, "/api/homework?date=2026-10-19&lang=zh");
  assert.equal(zh.data.lesson.items[0].term, "旅游");
  // Review on 10/20 covers the advanced 10/19 lesson.
  const review = await req(e, "/api/quiz?date=2026-10-20&lang=en&mode=review");
  assert.equal(review.data.items[0].term, "leverage");
  assert.equal((await answerAll(e, null, "2026-10-20", "review")).status, 200);
  const after = await req(e, "/api/homework?date=2026-10-20&lang=en");
  assert.equal(after.data.lesson.items.length, 30);
  assert.ok(after.data.lesson.items.some((i) => i.term === "controversial"));
  const weekend = await req(e, "/api/quiz?date=2026-10-24&lang=en&mode=weekend", { time: "2026-10-24T08:00:00" });
  assert.equal(weekend.data.items.length, 150);
  assert.ok(weekend.data.items.some((i) => i.term === "reminisce"));
  assert.equal((await req(e, "/api/profile", { body: { en: "expert", zh: "basic" } })).status, 400);
});

test("old self-assessment values map onto levels", async () => {
  const e = await seeded();
  await e.BUCKET.put("profile.json", JSON.stringify({ en: "intermediate", zh: "beginner" }));
  const h = await req(e, "/api/homework?date=2026-10-19&lang=en");
  assert.equal(h.data.track, "intermediate");
  assert.equal(h.data.profile.zh, "basic");
});

test("placement test hides answers, grades on the server and recommends a level", async () => {
  const e = await seeded();
  const t = await req(e, "/api/placement?lang=en");
  assert.equal(t.data.items.length, 24);
  assert.ok(t.data.items.every((i) => i.options.length === 4 && !("meaning" in i)));
  const { PLACEMENT } = await import("../worker/levels-data.mjs");
  const right = (i) => PLACEMENT.en[i.band][+i.id.split(":")[1]].meaning;
  const all = await req(e, "/api/placement/submit", {
    body: { lang: "en", answers: t.data.items.map((i) => ({ id: i.id, answer: right(i) })) },
  });
  assert.equal(all.data.recommended, "advanced");
  const mid = await req(e, "/api/placement/submit", {
    body: {
      lang: "en",
      answers: t.data.items.map((i) => ({ id: i.id, answer: i.band === "advanced" ? "x" : right(i) })),
    },
  });
  assert.equal(mid.data.recommended, "intermediate");
  assert.deepEqual(mid.data.bands.advanced, { correct: 0, total: 8 });
  const low = await req(e, "/api/placement/submit", {
    body: { lang: "en", answers: t.data.items.map((i) => ({ id: i.id, answer: i.band === "basic" ? right(i) : "x" })) },
  });
  assert.equal(low.data.recommended, "basic");
  const dup = t.data.items.map((i) => ({ id: t.data.items[0].id, answer: "x" }));
  assert.equal((await req(e, "/api/placement/submit", { body: { lang: "en", answers: dup } })).status, 400);
  const h = await req(e, "/api/homework?date=2026-10-19&lang=en");
  assert.equal(h.data.placement.recommended, "basic");
  // The test only recommends; the level changes when the learner saves it.
  assert.equal(h.data.track, "basic");
});

test("family members keep their own level; coach writes and release are per level", async () => {
  const e = await seeded();
  const owner = (await req(e, "/api/auth/setup", { body: { name: "Ted", pin: "2468" } })).cookie;
  const id = (await req(e, "/api/auth/profiles", { cookie: owner, body: { name: "June", pin: "1357" } })).data.profile
    .id;
  const june = (await req(e, "/api/auth/login", { body: { id, pin: "1357" } })).cookie;
  await req(e, "/api/profile", { cookie: june, body: { en: "advanced", zh: "basic" } });
  assert.equal((await req(e, "/api/homework?date=2026-10-19&lang=en", { cookie: june })).data.track, "advanced");
  assert.equal((await req(e, "/api/homework?date=2026-10-19&lang=en", { cookie: owner })).data.track, "basic");
  const ctx = await req(e, "/api/coach/context", { cookie: owner });
  assert.deepEqual(ctx.data.tracks.en, { basic: ["Ted"], advanced: ["June"] });
  // A new advanced lesson may reuse a basic word but not an earlier advanced one.
  const adv = ctx.data.lessons.find((l) => l.lang === "en" && l.track === "advanced");
  const dupe = await req(e, "/api/coach/lesson", {
    cookie: owner,
    body: { ...structuredClone(adv), date: "2026-10-26" },
  });
  assert.equal(dupe.status, 400);
  const basic = ctx.data.lessons.find((l) => l.lang === "en" && l.track === "basic");
  const asAdvanced = await req(e, "/api/coach/lesson", {
    cookie: owner,
    body: { ...structuredClone(basic), date: "2026-10-26", track: "advanced", level: "고급 2" },
  });
  assert.equal(asAdvanced.status, 200);
  // Release for 10/26 needs every level in use: English advanced exists, English basic does not.
  const rel = await req(e, "/api/coach/release", {
    cookie: owner,
    body: { date: "2026-10-26", phase: "morning" },
    time: "2026-10-26T08:00:00",
  });
  assert.equal(rel.status, 400);
  assert.match(rel.data.error, /영어 기초/);
  const ok = await req(e, "/api/coach/release", {
    cookie: owner,
    body: { date: "2026-10-20", phase: "morning" },
    time: "2026-10-26T08:00:00",
  });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.data.ready.sort(), ["en", "en-advanced", "zh"]);
});
