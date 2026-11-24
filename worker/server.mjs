import { SEED } from "./seed-data.mjs";
export const kdate = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export const shift = (d, n) => kdate(new Date(new Date(d + "T12:00:00+09:00").getTime() + n * 86400000));
const weekday = (d) => new Date(d + "T12:00:00+09:00").getUTCDay(),
  monday = (d) => shift(d, -((weekday(d) + 6) % 7)),
  json = (v, s = 200, extra = {}) =>
    new Response(JSON.stringify(v), {
      status: s,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
    }),
  validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d));
const normal = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[\p{P}\p{Z}\p{S}]/gu, "");
async function read(env, key, fallback = null) {
  const o = await env.BUCKET.get(key);
  return o ? JSON.parse(await o.text()) : fallback;
}
async function write(env, key, v) {
  await env.BUCKET.put(key, JSON.stringify(v), { httpMetadata: { contentType: "application/json" } });
}
async function keys(env, prefix) {
  let out = [],
    cursor;
  do {
    const r = await env.BUCKET.list({ prefix, cursor, limit: 1000 });
    out.push(...r.objects.map((o) => o.key));
    cursor = r.truncated ? r.cursor : undefined;
  } while (cursor);
  return out;
}
const lessonKey = (d, l) => `lessons/${d}/${l}.json`;
const itemId = (l, k, t) => `${l}:${k}:${normal(t)}`;
export function validateLesson(x) {
  if (
    !x ||
    !["en", "zh"].includes(x.lang) ||
    !validDate(x.date) ||
    ![1, 2, 3, 4, 5].includes(weekday(x.date)) ||
    typeof x.level !== "string" ||
    !Array.isArray(x.items)
  )
    throw Error("유효한 평일·언어·수준·문항을 입력하세요.");
  let seen = new Set();
  let counts = { voca: 0, idiom: 0 };
  for (const i of x.items) {
    if (
      !["voca", "idiom"].includes(i.kind) ||
      !["term", "pronunciation", "meaning"].every(
        (k) => typeof i[k] === "string" && i[k].trim().length > 0 && i[k].length <= 250,
      )
    )
      throw Error("모든 표현에 종류, 표기, 발음, 한국어 뜻이 필요합니다.");
    if (seen.has(normal(i.term))) throw Error("수업 내 중복 표현");
    seen.add(normal(i.term));
    counts[i.kind]++;
    i.id = itemId(x.lang, i.kind, i.term);
  }
  if (counts.voca !== 20 || counts.idiom !== (x.lang === "en" ? 10 : 5))
    throw Error("영어 20 VOCA + 10 IDIOM, 중국어 20 VOCA + 5 IDIOM이 필요합니다.");
  return x;
}
async function seed(env) {
  for (let n = 0; n < 5; n++)
    for (const lang of ["en", "zh"]) {
      let d = shift("2026-10-19", n),
        key = lessonKey(d, lang);
      if (!(await read(env, key))) {
        let v = SEED[lang],
          m = lang === "en" ? 10 : 5;
        await write(
          env,
          key,
          validateLesson({
            lang,
            date: d,
            level: "기초 1 · 일상 핵심 표현",
            source: "LISA 기초 커리큘럼",
            items: [...v.voca.slice(n * 20, n * 20 + 20), ...v.idiom.slice(n * m, n * m + m)],
          }),
        );
      }
    }
}
async function attempts(env, d, l, mode, p = "") {
  return read(env, `${p}results/${d}/${l}/${mode}.json`, []);
}
async function previous(env, d, l) {
  let all = (await keys(env, "lessons/")).filter((k) => k.endsWith("/" + l + ".json") && k.slice(8, 18) < d).sort();
  return all.length ? read(env, all.at(-1)) : null;
}
function timeOf(now) {
  return +new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .replace(":", "");
}
export async function quizItems(env, d, l, mode, now, p = "") {
  let today = kdate(now),
    weekend = [0, 6].includes(weekday(d));
  if (d > today || (d === today && timeOf(now) < 730)) throw Error("오전 7시 30분에 공개됩니다.");
  if (mode === "review") {
    if (weekend) throw Error("주말에는 누적 시험을 이용하세요.");
    let prev = await previous(env, d, l);
    return prev?.items || [];
  }
  if (mode === "weekend") {
    if (!weekend) throw Error("주말 시험은 토요일·일요일에 진행합니다.");
    let items = [];
    for (let n = 0; n < 5; n++) {
      let lesson = await read(env, lessonKey(shift(monday(d), n), l));
      if (!lesson) throw Error("주간 수업이 아직 준비되지 않았습니다. 빠진 수업을 준비한 뒤 다시 시도하세요.");
      items.push(...lesson.items);
    }
    return items;
  }
  if (mode === "spaced") {
    return extraItems(env, d, l, p);
  }
  if (mode === "evening") {
    if (weekend) throw Error("주말에는 누적 시험을 이용하세요.");
    if (d === today && timeOf(now) < 1900) throw Error("저녁 시험은 오후 7시에 열립니다.");
    let prev = await previous(env, d, l);
    if (prev && !(await attempts(env, d, l, "review", p)).length) throw Error("전날 복습 시험을 먼저 마쳐주세요.");
    let lesson = await read(env, lessonKey(d, l));
    if (!lesson) throw Error("오늘 수업이 아직 준비되지 않았습니다.");
    return lesson.items;
  }
  throw Error("알 수 없는 시험 종류");
}
async function extraItems(env, d, l, p = "") {
  let personal = (await history(env, p)).filter((a) => a.lang === l && a.date <= d),
    last = new Map();
  for (const a of personal) {
    for (const id of a.correctIds || []) last.set(id, { correct: true });
    for (const i of a.wrongItems || []) last.set(i.id, { correct: false, item: i });
  }
  let incorrect = [...last.values()].filter((v) => !v.correct).map((v) => v.item),
    due = [];
  for (const n of [3, 7, 30]) {
    let old = await read(env, lessonKey(shift(d, -n), l));
    if (old) due.push(...old.items);
  }
  let seen = new Set();
  return [...incorrect, ...due]
    .filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    })
    .slice(0, 40);
}
async function history(env, p = "") {
  let all = (await Promise.all(["en", "zh"].map((l) => read(env, p + "progress/" + l + ".json", [])))).flat();
  return all.sort((a, b) => a.at.localeCompare(b.at));
}
// ---------------------------------------------------------------------------
// Family profiles with PIN sign-in.
//
// Until the owner creates the first profile the site behaves exactly as the original single-learner
// site (all records under the top-level keys). Once profiles exist, every learner endpoint needs a
// session and coach endpoints need the owner's session or the COACH_KEY secret.
// The first (owner) profile keeps using the original top-level keys, so existing records stay theirs;
// every other profile stores its records under users/<id>/.
// ---------------------------------------------------------------------------
const PROFILES = "profiles.json",
  SESSION_COOKIE = "ld_session",
  SESSION_DAYS = 180,
  PIN_ATTEMPTS = 5,
  LOCK_MINUTES = 15,
  PBKDF2_ROUNDS = 100000,
  COLORS = ["#2f7a6e", "#c8664b", "#6b5fb5", "#b8892c", "#3f7fb3", "#a4527a"];
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
async function sha256(text) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}
async function pinHash(pin, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: PBKDF2_ROUNDS },
    key,
    256,
  );
  return hex(bits);
}
function sameText(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function checkPin(pin) {
  if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) throw Error("PIN은 숫자 4~8자리로 입력하세요.");
}
function checkName(name, profiles, except) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 20) throw Error("이름은 1~20자로 입력하세요.");
  if (profiles.some((x) => x.id !== except && x.name === name.trim())) throw Error("이미 있는 이름입니다.");
  return name.trim();
}
const publicProfile = (x) => ({ id: x.id, name: x.name, color: x.color, owner: !!x.owner });
const dataPrefix = (user) => (!user || user.legacy ? "" : `users/${user.id}/`);
async function profileList(env) {
  return (await read(env, PROFILES, { users: [] })).users;
}
async function saveProfiles(env, users) {
  await write(env, PROFILES, { users });
}
async function newProfile(name, pin, profiles, extra = {}) {
  const salt = randomHex(16);
  return {
    id: randomHex(8),
    name: checkName(name, profiles),
    color: COLORS[profiles.length % COLORS.length],
    salt,
    hash: await pinHash(pin, salt),
    ...extra,
  };
}
function cookieOf(request, name) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}
function sessionCookie(url, token, maxAge) {
  return (
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` +
    (url.protocol === "https:" ? "; Secure" : "")
  );
}
async function startSession(env, url, user, now) {
  const token = randomHex(32);
  await write(env, `sessions/${await sha256(token)}.json`, {
    uid: user.id,
    created: now.toISOString(),
    expires: new Date(now.getTime() + SESSION_DAYS * 86400000).toISOString(),
  });
  return { "Set-Cookie": sessionCookie(url, token, SESSION_DAYS * 86400) };
}
async function currentUser(env, request, profiles, now) {
  const token = cookieOf(request, SESSION_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const s = await read(env, `sessions/${await sha256(token)}.json`);
  if (!s || s.revoked || s.expires < now.toISOString()) return null;
  return profiles.find((x) => x.id === s.uid) || null;
}
async function verifyPin(env, user, pin, now) {
  const lockKey = `auth/lock/${user.id}.json`,
    lock = await read(env, lockKey, { fails: 0, until: null });
  if (lock.until && lock.until > now.toISOString()) {
    const minutes = Math.ceil((new Date(lock.until) - now) / 60000);
    throw Error(`PIN을 여러 번 틀렸습니다. ${minutes}분 뒤에 다시 시도하세요.`);
  }
  if (typeof pin === "string" && sameText(await pinHash(pin, user.salt), user.hash)) {
    if (lock.fails) await write(env, lockKey, { fails: 0, until: null });
    return;
  }
  const fails = (lock.until ? 0 : lock.fails) + 1;
  await write(
    env,
    lockKey,
    fails >= PIN_ATTEMPTS
      ? { fails: 0, until: new Date(now.getTime() + LOCK_MINUTES * 60000).toISOString() }
      : { fails, until: null },
  );
  throw Error(
    fails >= PIN_ATTEMPTS
      ? `PIN을 ${PIN_ATTEMPTS}번 틀려 ${LOCK_MINUTES}분 동안 잠갔습니다.`
      : `PIN이 맞지 않습니다. (${fails}/${PIN_ATTEMPTS})`,
  );
}
class HttpError extends Error {
  constructor(message, status, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
async function authApi(request, env, url, now, profiles, me) {
  const path = url.pathname,
    body = request.method === "POST" ? await request.json() : {};
  if (path === "/api/auth/state")
    return json({ enabled: profiles.length > 0, profiles: profiles.map(publicProfile), me: me && publicProfile(me) });
  if (request.method !== "POST") return json({ error: "Not found" }, 404);
  if (path === "/api/auth/setup") {
    if (profiles.length) throw new HttpError("이미 가족 프로필이 설정되어 있습니다.", 409);
    checkPin(body.pin);
    const owner = await newProfile(body.name, body.pin, profiles, { owner: true, legacy: true });
    await saveProfiles(env, [owner]);
    return json({ ok: true, me: publicProfile(owner) }, 200, await startSession(env, url, owner, now));
  }
  if (path === "/api/auth/login") {
    const user = profiles.find((x) => x.id === body.id);
    if (!user) throw new HttpError("프로필을 찾을 수 없습니다.", 404);
    await verifyPin(env, user, body.pin, now);
    return json({ ok: true, me: publicProfile(user) }, 200, await startSession(env, url, user, now));
  }
  if (path === "/api/auth/logout") {
    const token = cookieOf(request, SESSION_COOKIE);
    if (token && /^[0-9a-f]{64}$/.test(token)) {
      const key = `sessions/${await sha256(token)}.json`;
      if (env.BUCKET.delete) await env.BUCKET.delete(key);
      else await write(env, key, { revoked: true });
    }
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(url, "", 0) });
  }
  if (!me) throw new HttpError("먼저 프로필을 선택하고 PIN을 입력하세요.", 401, { auth: true });
  if (path === "/api/auth/pin") {
    // Anyone can change their own PIN with the current one; the owner can reset any family PIN.
    const target = profiles.find((x) => x.id === (body.id || me.id));
    if (!target) throw new HttpError("프로필을 찾을 수 없습니다.", 404);
    if (target.id === me.id) await verifyPin(env, me, body.current, now);
    else if (!me.owner) throw new HttpError("다른 사람의 PIN은 관리자만 바꿀 수 있습니다.", 403);
    checkPin(body.pin);
    target.salt = randomHex(16);
    target.hash = await pinHash(body.pin, target.salt);
    await saveProfiles(env, profiles);
    return json({ ok: true });
  }
  if (!me.owner) throw new HttpError("가족 프로필은 관리자만 관리할 수 있습니다.", 403);
  if (path === "/api/auth/profiles") {
    if (profiles.length >= 8) throw Error("프로필은 8개까지 만들 수 있습니다.");
    checkPin(body.pin);
    const user = await newProfile(body.name, body.pin, profiles);
    await saveProfiles(env, [...profiles, user]);
    return json({ ok: true, profile: publicProfile(user) });
  }
  if (path === "/api/auth/rename") {
    const target = profiles.find((x) => x.id === body.id);
    if (!target) throw new HttpError("프로필을 찾을 수 없습니다.", 404);
    target.name = checkName(body.name, profiles, target.id);
    await saveProfiles(env, profiles);
    return json({ ok: true, profile: publicProfile(target) });
  }
  if (path === "/api/auth/remove") {
    const target = profiles.find((x) => x.id === body.id);
    if (!target) throw new HttpError("프로필을 찾을 수 없습니다.", 404);
    if (target.owner) throw Error("관리자 프로필은 삭제할 수 없습니다.");
    // The learner's records under users/<id>/ are kept; only the profile and its sign-in go away.
    await saveProfiles(
      env,
      profiles.filter((x) => x.id !== target.id),
    );
    return json({ ok: true });
  }
  return json({ error: "Not found" }, 404);
}
function coachKeyMatches(request, env) {
  return !!env.COACH_KEY && sameText(request.headers.get("X-Coach-Key") || "", env.COACH_KEY);
}
async function learnerSummary(env, profiles) {
  const out = [];
  for (const user of profiles) {
    const scores = await history(env, dataPrefix(user)),
      byLang = {};
    for (const l of ["en", "zh"]) {
      const evening = scores.filter((a) => a.lang === l && a.mode === "evening").slice(-3);
      byLang[l] = {
        attempts: scores.filter((a) => a.lang === l).length,
        recentEvening: evening.map((a) => ({ date: a.date, score: a.score })),
      };
    }
    out.push({ ...publicProfile(user), ...byLang });
  }
  return out;
}

export async function api(request, env, now = new Date()) {
  if (!env.BUCKET) return json({ error: "학습 저장소를 준비 중입니다." }, 503);
  const u = new URL(request.url),
    path = u.pathname;
  try {
    if (+(request.headers.get("Content-Length") || 0) > 200000) return json({ error: "요청이 너무 큽니다." }, 413);
    if (request.method === "POST" && !request.headers.get("Content-Type")?.includes("application/json"))
      return json({ error: "JSON이 필요합니다." }, 415);
    if (request.method === "POST" && request.headers.has("Origin") && request.headers.get("Origin") !== u.origin)
      return json({ error: "동일 사이트 요청만 허용합니다." }, 403);
    const profiles = await profileList(env),
      me = profiles.length ? await currentUser(env, request, profiles, now) : null;
    if (path.startsWith("/api/auth/")) return await authApi(request, env, u, now, profiles, me);
    if (path.startsWith("/api/coach/") && profiles.length && !me?.owner && !coachKeyMatches(request, env))
      return json({ error: "관리자 프로필로 로그인하거나 코치 키가 필요합니다." }, 403);
    if (!path.startsWith("/api/coach/") && profiles.length && !me)
      return json({ error: "먼저 프로필을 선택하고 PIN을 입력하세요.", auth: true }, 401);
    // Storage prefix for the signed-in learner. Without profiles this is "" (the original data).
    const P = dataPrefix(me);
    if (path === "/api/coach/seed" && request.method === "POST") {
      await seed(env);
      return json({ ok: true, week: "2026-10-19" });
    }
    if ((path === "/api/homework" || path === "/api/coach/context") && !(await read(env, "seed-v1.json"))) {
      await seed(env);
      await write(env, "seed-v1.json", { week: "2026-10-19", initializedAt: now.toISOString() });
    }
    if (path === "/api/coach/context") {
      let lessonKeys = await keys(env, "lessons/"),
        lessons = await Promise.all(lessonKeys.map((k) => read(env, k))),
        scores = await history(env);
      let recommendations = {};
      for (const l of ["en", "zh"]) {
        let byDate = new Map();
        for (const a of scores.filter((a) => a.lang === l && a.mode === "evening"))
          if (!byDate.has(a.date)) byDate.set(a.date, a);
        let a = [...byDate.values()].slice(-3),
          average = a.length ? Math.round(a.reduce((s, x) => s + x.score, 0) / a.length) : null;
        recommendations[l] = {
          recentScores: a.map((a) => ({ date: a.date, score: a.score })),
          average,
          guidance:
            a.length < 3
              ? "기초 단어·생활 표현을 유지. 검증된 수준 자료가 아직 부족함."
              : average >= 85
                ? "직전 수업보다 한 단계만 조금 높임. 핵심 기초를 유지."
                : average < 60
                  ? "더 쉬운 단어와 짧은 표현으로 낮춤."
                  : "현재 난도 유지",
        };
      }
      return json({
        today: kdate(now),
        timezone: "Asia/Seoul",
        start: "2026-10-19",
        recommendations,
        lessons,
        profile: await read(env, "profile.json", {}),
        learners: await learnerSummary(env, profiles),
        rules: {
          weekday: { en: { voca: 20, idiom: 10 }, zh: { voca: 20, idiom: 5 } },
          morning: "07:30",
          evening: "19:00",
        },
      });
    }
    if (path === "/api/coach/lesson" && request.method === "POST") {
      let x = validateLesson(await request.json()),
        key = lessonKey(x.date, x.lang),
        existing = await read(env, key);
      if (existing) return json({ ok: true, existing: true, lesson: existing });
      let all = await Promise.all(
        (await keys(env, "lessons/")).filter((k) => k.endsWith("/" + x.lang + ".json")).map((k) => read(env, k)),
      );
      let terms = new Set(all.flatMap((l) => l.items.map((i) => normal(i.term))));
      if (x.items.some((i) => terms.has(normal(i.term))))
        throw Error("이전에 배정한 표현과 중복됩니다. 복습은 별도로 진행하므로 새 표현으로 교체하세요.");
      x.createdAt = now.toISOString();
      await write(env, key, x);
      return json({ ok: true, lesson: await read(env, key) });
    }
    if (path === "/api/coach/release" && request.method === "POST") {
      let { date, phase } = await request.json();
      if (!validDate(date) || !["morning", "evening"].includes(phase)) throw Error("날짜와 공개 단계가 필요합니다.");
      if (date > kdate(now) || (date === kdate(now) && timeOf(now) < (phase === "morning" ? 730 : 1900)))
        throw Error("아직 공개 시간이 아닙니다.");
      let ready = [];
      for (const l of ["en", "zh"]) {
        let mode = [0, 6].includes(weekday(date)) ? "weekend" : phase === "morning" ? "review" : "evening";
        if (mode === "weekend") {
          await quizItems(env, date, l, mode, now);
        } else if (!(await read(env, lessonKey(date, l)))) throw Error("수업을 먼저 준비해주세요.");
        ready.push(l);
      }
      let entry = { date, phase, ready, at: now.toISOString() };
      await write(env, `releases/${date}/${phase}.json`, entry);
      return json(await read(env, `releases/${date}/${phase}.json`));
    }
    if (path === "/api/profile" && request.method === "POST") {
      let x = await request.json();
      if (
        !["beginner", "basic", "intermediate"].includes(x.en) ||
        !["beginner", "basic", "intermediate"].includes(x.zh)
      )
        throw Error("언어별 시작 수준을 선택하세요.");
      await write(env, P + "profile.json", {
        en: x.en,
        zh: x.zh,
        updatedAt: now.toISOString(),
        note: "자기 평가이며 공식 수준 평가가 아님",
      });
      return json({ ok: true });
    }
    let d = u.searchParams.get("date") || kdate(now),
      l = u.searchParams.get("lang") || "en";
    if (!validDate(d) || !["en", "zh"].includes(l)) throw Error("올바른 날짜와 언어를 선택하세요.");
    if (path === "/api/homework") {
      let prev = await previous(env, d, l),
        review = await attempts(env, d, l, "review", P),
        weekend = [0, 6].includes(weekday(d)),
        available = d < kdate(now) || (d === kdate(now) && timeOf(now) >= 730),
        unlocked = available && (weekend || !prev || review.length > 0),
        lesson = unlocked && !weekend ? await read(env, lessonKey(d, l)) : null,
        all = await history(env, P),
        personal = all.filter((a) => a.lang === l),
        learned = await read(env, `${P}study/${d}/${l}.json`, []);
      let extra = await extraItems(env, d, l, P);
      let known = new Set(personal.flatMap((a) => a.correctIds || []));
      let repeated = {};
      personal.forEach((a) =>
        (a.correctIds || []).forEach((id) => (repeated[id] = new Set([...(repeated[id] || []), a.date]))),
      );
      let recent = personal
        .filter((a) => a.date <= d)
        .slice(-14)
        .map((a) => ({ date: a.date, mode: a.mode, score: a.score }));
      return json({
        date: d,
        lang: l,
        serverDate: kdate(now),
        serverTime: timeOf(now),
        weekend,
        available,
        unlocked,
        lesson,
        previousDate: prev?.date,
        reviewRequired: !!prev && !review.length && !weekend,
        study: learned,
        extraReview: extra,
        results: all.filter((a) => a.date === d && a.lang === l),
        profile: await read(env, P + "profile.json", { en: "beginner", zh: "beginner" }),
        stats: {
          tested: known.size,
          retained: Object.values(repeated).filter((dates) => dates.size >= 2).length,
          attempts: personal.length,
          recent,
        },
        notice: "정답률은 비공식 학습 지표입니다. 숙어에는 구동사·고정 표현 및 중국어 일상 관용 표현이 포함됩니다.",
      });
    }
    if (path === "/api/quiz") {
      let mode = u.searchParams.get("mode"),
        items = await quizItems(env, d, l, mode, now, P);
      return json({ date: d, lang: l, mode, items });
    }
    if (path === "/api/study" && request.method === "POST") {
      let x = await request.json();
      if (!validDate(x.date) || !["en", "zh"].includes(x.lang) || !Array.isArray(x.ids))
        throw Error("잘못된 학습 기록");
      let lesson = await read(env, lessonKey(x.date, x.lang));
      if (!lesson) throw Error("수업이 없습니다.");
      if (x.date > kdate(now) || (x.date === kdate(now) && timeOf(now) < 730))
        throw Error("공개 시간 이후 학습하세요.");
      let p = await previous(env, x.date, x.lang);
      if (p && !(await attempts(env, x.date, x.lang, "review", P)).length)
        throw Error("전날 복습을 먼저 완료해주세요.");
      let allowed = new Set(lesson.items.map((i) => i.id)),
        current = await read(env, `${P}study/${x.date}/${x.lang}.json`, []);
      let ids = [...new Set([...current, ...x.ids.filter((id) => allowed.has(id))])];
      await write(env, `${P}study/${x.date}/${x.lang}.json`, ids);
      return json({ ok: true, ids });
    }
    if (path === "/api/quiz/submit" && request.method === "POST") {
      let x = await request.json();
      if (
        !validDate(x.date) ||
        !["en", "zh"].includes(x.lang) ||
        !Array.isArray(x.answers) ||
        !["choice", "typing"].includes(x.format)
      )
        throw Error("잘못된 답안");
      let items = await quizItems(env, x.date, x.lang, x.mode, now, P);
      if (
        !items.length ||
        x.answers.length !== items.length ||
        new Set(x.answers.map((a) => a.id)).size !== items.length
      )
        throw Error("모든 문제에 한 번씩 답해주세요.");
      let correctIds = [],
        wrongItems = [];
      for (const i of items) {
        let a = x.answers.find((a) => a.id === i.id);
        if (!a || typeof a.answer !== "string") throw Error("모든 문항의 답안이 필요합니다.");
        if (x.format === "choice" ? a.answer === i.meaning : normal(a.answer) === normal(i.term)) correctIds.push(i.id);
        else wrongItems.push({ ...i, answer: a.answer });
      }
      let a = {
          id: crypto.randomUUID(),
          date: x.date,
          lang: x.lang,
          mode: x.mode,
          format: x.format,
          total: items.length,
          correct: correctIds.length,
          score: Math.round((correctIds.length / items.length) * 100),
          correctIds,
          wrongItems,
          at: now.toISOString(),
        },
        key = `${P}results/${x.date}/${x.lang}/${x.mode}.json`,
        prev = await read(env, key, []);
      await write(env, key, [...prev, a].slice(-10));
      let progress = await read(env, P + "progress/" + x.lang + ".json", []);
      await write(env, P + "progress/" + x.lang + ".json", [...progress, a]);
      return json(a);
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message, ...(e.extra || {}) }, e.status || 400);
  }
}
