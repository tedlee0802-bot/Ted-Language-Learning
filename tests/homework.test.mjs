import test from "node:test";
import assert from "node:assert/strict";
import { api, quizItems, validateLesson } from "../worker/server.mjs";
export class Bucket {
  store = new Map();
  async get(k) {
    let s = this.store.get(k);
    return s === undefined ? null : { text: async () => s };
  }
  async put(k, v) {
    this.store.set(k, v);
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
const env = () => ({ BUCKET: new Bucket() }),
  now = (d) => new Date(d + "+09:00");
async function req(e, path, body, time = "2026-10-19T19:01:00") {
  let r = await api(
    new Request(
      "https://test.local" + path,
      body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {},
    ),
    e,
    now(time),
  );
  return { status: r.status, data: await r.json() };
}
async function seeded() {
  let e = env();
  await req(e, "/api/coach/seed", {});
  return e;
}
async function submit(e, d, mode, items, wrong = false) {
  return req(
    e,
    "/api/quiz/submit",
    {
      date: d,
      lang: "en",
      mode,
      format: "choice",
      answers: items.map((i, n) => ({ id: i.id, answer: wrong && n === 0 ? "wrong" : i.meaning })),
    },
    d + "T19:01:00",
  );
}
test("first week has exact full counts, Korean meanings and pronunciation; seed is idempotent", async () => {
  let e = await seeded(),
    c = await req(e, "/api/coach/context");
  assert.equal(c.data.lessons.length, 30); // 3 levels x 5 weekdays x 2 languages
  for (const l of c.data.lessons) {
    validateLesson(l);
    assert.equal(new Set(l.items.map((i) => i.id)).size, l.items.length);
  }
  let before = JSON.stringify([...e.BUCKET.store]);
  await req(e, "/api/coach/seed", {});
  assert.equal(JSON.stringify([...e.BUCKET.store]), before);
  for (const l of ["en", "zh"]) {
    let items = await quizItems(e, "2026-10-24", l, "weekend", now("2026-10-24T07:30:00"));
    assert.equal(items.filter((i) => i.kind === "voca").length, 100);
    assert.equal(items.filter((i) => i.kind === "idiom").length, l === "en" ? 50 : 25);
  }
});
test("server enforces KST 07:30 and 19:00 and prior review gate", async () => {
  let e = await seeded();
  await assert.rejects(() => quizItems(e, "2026-10-19", "en", "review", now("2026-10-19T07:29:59")));
  await assert.rejects(() => quizItems(e, "2026-10-19", "en", "evening", now("2026-10-19T18:59:59")));
  assert.equal((await quizItems(e, "2026-10-19", "en", "evening", now("2026-10-19T19:00:00"))).length, 30);
  let before = await req(e, "/api/homework?date=2026-10-20&lang=en", null, "2026-10-20T07:30:00");
  assert.equal(before.data.lesson, null);
  let review = await quizItems(e, "2026-10-20", "en", "review", now("2026-10-20T07:30:00"));
  assert.equal(review.length, 30);
  assert.equal((await submit(e, "2026-10-20", "review", review)).status, 200);
  let after = await req(e, "/api/homework?date=2026-10-20&lang=en", null, "2026-10-20T07:30:00");
  assert.equal(after.data.lesson.items.length, 30);
});
test("server grades all items, rejects incomplete/duplicate answers, tracks errors and distinct-day retention", async () => {
  let e = await seeded(),
    q = await quizItems(e, "2026-10-19", "en", "evening", now("2026-10-19T19:00:00"));
  let r = await submit(e, "2026-10-19", "evening", q, true);
  assert.equal(r.data.correct, 29);
  assert.equal(r.data.wrongItems.length, 1);
  let h = await req(e, "/api/homework?date=2026-10-19&lang=en");
  assert.equal(h.data.extraReview[0].id, q[0].id);
  let bad = await submit(e, "2026-10-19", "evening", q.slice(1));
  assert.equal(bad.status, 400);
  await submit(e, "2026-10-19", "evening", q);
  h = await req(e, "/api/homework?date=2026-10-19&lang=en");
  assert.equal(h.data.extraReview.length, 0);
  assert.equal(h.data.stats.retained, 0);
  await submit(e, "2026-10-20", "review", q);
  h = await req(e, "/api/homework?date=2026-10-20&lang=en", null, "2026-10-20T08:00:00");
  assert.equal(h.data.stats.retained, 30);
});
test("server rejects cross-origin writes and duplicate new vocabulary; study cannot bypass review", async () => {
  let e = await seeded(),
    r = await api(
      new Request("https://test.local/api/coach/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: "{}",
      }),
      e,
    );
  assert.equal(r.status, 403);
  let c = await req(e, "/api/coach/context"),
    l = { ...c.data.lessons.find((x) => x.lang === "en" && x.track === "basic"), date: "2026-10-26" };
  assert.equal((await req(e, "/api/coach/lesson", l)).status, 400);
  let study = await req(e, "/api/study", { date: "2026-10-20", lang: "en", ids: [] }, "2026-10-20T08:00:00");
  assert.equal(study.status, 400);
});
