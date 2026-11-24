# Lingo Daily · LISA scheduling operations

Site identity: use the existing private project ID from your local `.openai/hosting.json`. The actual project settings are excluded from this public repository.
Keep the existing owner-private audience until family mode is set up. Before family mode only the owner uses this single-learner store and Sites dispatch is the only protection, so do not widen the audience then. Widen it for the family only after the owner profile exists and `COACH_KEY` is set, so the coach endpoints require the owner session or the key.

## Family mode and the coach key

Once the owner creates the first family profile in the site (Settings → 가족과 함께 쓰기), every `/api/coach/*` endpoint requires either the owner's signed-in session or the header `X-Coach-Key: <COACH_KEY>`, where `COACH_KEY` is a Worker secret set on the existing project. Without profiles the coach API behaves as before. Treat `COACH_KEY` like the Sites token: keep it out of prompts, source, argv and files, and pass it to the in-memory HTTP client over hidden stdin. `/api/coach/context` also returns `learners`: each profile's attempt counts and last three evening scores per language. `recommendations` stay based on the owner's evening scores, because lessons are shared by the whole family.

## Access from a fresh scheduled task

1. Call Sites `get_site` for this project to obtain the current live URL and `siwc_bypass_bearer_token`. Verify it remains owner-private (owner only in custom allowlist; no external viewers/groups).
2. Use that token **only** for this Site with header `OAI-Sites-Authorization: Bearer <token>`. Never save/print tokens or put them in prompts/source. For shell HTTP calls pass a credential JSON over hidden stdin to an in-memory HTTP client; keep credentials out of argv/files.
3. GET `/api/coach/context` to read lessons, separate English/Chinese first-attempt scores and learner self-assessment. This does not mutate data.
4. Write new assignments with POST `/api/coach/lesson` (JSON schema below). Read back via context and verify counts and content. Repeated writes to the same date/language return the existing assignment unchanged. Do not replace taught or preassigned lessons.
5. At the scheduled time POST `/api/coach/release` with `{"date":"YYYY-MM-DD","phase":"morning"}` or `evening`. The response is persisted and read back by the endpoint. Dates and release gates use Asia/Seoul. The server handles quizzes, grading and learner results; a task must never fabricate answers or test results.

## Lessons

Each weekday: English 20 voca + 10 idiom; Mandarin 20 voca + 5 idiom. Start with daily-life basics; expand toward travel/social life, business/negotiation, then culture/current affairs and nuanced educated conversation over roughly one year. Calendar stages are a roadmap, not guaranteed proficiency. English and Mandarin are independently adjusted from results. First 3 distinct evening tests below 85%: stay foundational. Last 3 first-attempt evening scores average >=85%: increase gently one step; <60%: reinforce simpler fundamentals; otherwise maintain. Both languages start at foundational vocabulary in this initial curriculum. No native-fluency guarantees.

Avoid new-word duplicates across all previous assignments in that language. The review system deliberately repeats previously assigned expressions separately. English idiom covers useful idioms, phrasal verbs and fixed expressions; Mandarin includes everyday fixed expressions plus common chengyu when appropriate. Favor high-frequency, natural expressions over obscure items.

POST schema:

```
{
  "date": "YYYY-MM-DD", "lang": "en", "level": "기초 1 · 일상 핵심 표현",
  "source": "LISA daily curriculum",
  "items": [
    {"kind":"voca", "term":"example", "pronunciation":"ɪɡˈzæmpəl", "meaning":"예; 사례", "example":"Can you give me an example?", "exampleMeaning":"예를 하나 들어 주시겠어요?"}
  ]
}
```

Use `lang: zh` with simplified characters, tone-mark pinyin and Korean meanings. Supply all 30/25 items. Pronunciation must be real IPA (English, General American consistently) or accurate pinyin (Mandarin). Include natural example sentences and Korean example translations for newly generated items. Inspect counts, uniqueness, translations, phonetics and naturalness before writing. POST errors are actionable: correct the payload then retry the same date/language. Already-existing lessons are authoritative and must be retained.

## Morning and evening

07:30 KST weekdays: ensure today's assignments exist, then persist morning release. Website first requires a full previous-lesson recall quiz, then reveals the new assignment. If Monday, the last Friday lesson is the previous lesson because weekends add no new expressions. First lesson has no previous review gate.
19:00 KST weekdays: persist evening release; the site opens the day's 30/25-question tests. Prepare the next weekday's missing lessons so they are ready before the next morning. Monday-Friday content remains hidden before its release and prior-review gate.
Sat/Sun 07:30: verify all five Monday-Friday assignments exist; fill any missing day with unique appropriate basics before release. Site shuffles **all** 100 vocab + 50 English idioms and 100 vocab + 25 Mandarin expressions independently on each weekend exam. Both days are cumulative tests, not new lessons. Saturday evening can prepare next Monday's assignments if absent.

The site also offers scored error review and 3/7/30-day spaced review, with optional typed recall. Errors remain queued until answered correctly on a later attempt; distinct-day correct answers are counted separately from same-day retries. Scores are informal study measures.

## Storage / existing data

R2 binding `BUCKET` stores `lessons/`, `results/`, `study/`, `profile.json`, and `releases/`. Family mode adds `profiles.json` (names, colors, salted PBKDF2 PIN hashes), `sessions/`, `auth/lock/` and per-learner copies of `results/`, `progress/`, `study/` and `profile.json` under `users/<id>/`. The owner profile keeps the original top-level keys. Routine updates write data through these APIs without source changes or redeployment. Existing dashboard localStorage `lingodaily-v1` is preserved; homework study counts are mirrored locally into date-specific VOCA/IDIOM plans. Existing browser-local history is not claimed to have been migrated to the cloud.

## Validation / publishing

`node scripts/build.mjs` bundles source files into a dependency-free Worker artifact (all assets embedded); `node --test tests/homework.test.mjs tests/family.test.mjs` verifies curriculum quantities, time/review gates, grading, retention, idempotency, write validation, profile/PIN sign-in, per-learner records and coach access control. `node scripts/preview.mjs` serves an in-memory local-only QA store, not production R2. Follow the current Sites source and publishing workflow for the existing project. Keep short-lived native credentials in memory, pass them through hidden stdin when needed, and verify source identity before publication.

## Scheduling status

Automatic morning/evening scheduling is not connected by this source export. Before configuring it separately, verify current Site access, network connectivity, and authenticated API read/write behavior. Initial-week curriculum seeds idempotently on the first homework/context request; later lessons require the coach operations above.

## Mobile pocket summary

After a weekday lesson is unlocked, the Pocket Summary button opens a full-screen two-column glossary for that language (English 30 or Mandarin 25 expressions). Term and Korean meaning are shown by default, with optional phonetics. The browser can export a standalone 1080x1920 PNG for offline phone review. No external image or speech service is required for export. This summary is per language; each language's previous-day review gate is preserved.
