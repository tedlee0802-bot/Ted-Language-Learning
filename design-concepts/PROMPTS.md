# Lingo Daily 리디자인 시안: 레퍼런스와 Codex 이미지 프롬프트

현재 사이트(`web/`)는 수정하지 않는다. 이 폴더는 시안 이미지와 프롬프트만 담는다.

## 레퍼런스 선정 근거

| 레퍼런스 | 평가 근거 | 가져올 점 |
| --- | --- | --- |
| CapWords | 2025 Apple Design Award, Delight and Fun 부문 수상 | 단어를 "스티커"처럼 모으는 즐거움, 둥근 카드, 파스텔 |
| Speak | 2026 리뷰에서 "polished, intuitive", 사용자 평 "No clutter, just learning" | 군더더기 없는 화면, 굵은 타이포, 큰 진행 링 |
| Drops | "simple, but beautiful" 일일 어휘 앱으로 평가 | 하루 분량을 짧은 세션으로 쪼갠 카드, 대담한 색 블록 |
| Mochi | Anki 대안 중 "clean and elegant" UI가 가장 큰 장점으로 꼽힘 | 미니멀 플래시카드, 간격 복습(3/7/30일) 시각화 |
| Duolingo 경로 UI (반면교사) | 고정 경로 강제가 장기 사용자 반발을 부름 | 순서는 안내하되 복습·시험 선택권은 남긴다 |

모든 시안은 위 앱의 로고·캐릭터·브랜드 색을 복제하지 않은 오리지널 디자인이다.

## 공통 화면 내용 (모든 프롬프트에 포함)

- 서비스명 "lingo daily", 한국어 UI, 날짜 2026-10-20(화)
- 언어 탭: 영어 / 중국어
- 오늘의 흐름: ① 07:30 전날 복습 → ② 새 숙제(영어 20 VOCA + 10 IDIOM) → ③ 19:00 당일 시험, 토·일 주간 전체 SHUFFLE
- 통계: 시험에서 맞힌 표현 42, 서로 다른 날 정답 표현 18, 누적 시험 6회
- 단어 예시: arrive /əˈraɪv/ 도착하다, leave /liːv/ 떠나다, bring /brɪŋ/ 가져오다, get up 일어나다 / 我 wǒ 나, 你 nǐ 너, 没关系 괜찮다
- 오답·간격 복습(3/7/30일) 대기 12개, 단어장 PNG 저장 버튼

## 시안 A: Calm Focus (Mochi + Speak)

```
Create a high-fidelity UI mockup image (1600x1000, desktop web app, flat screenshot, no device frame) for an original Korean-language vocabulary study web app named "lingo daily". Style: calm, minimal, lots of whitespace, warm off-white background (#FAF8F4), deep ink text, a single muted teal accent, soft 1px borders, generous 16px radius cards, Pretendard-like Korean sans-serif, large confident headings. Layout: slim left icon rail; top bar with date "2026년 10월 20일 (화)" and an English/중국어 segmented toggle. Hero area: one large centered flashcard showing "arrive" with IPA /əˈraɪv/, a speaker icon, and a "뜻 보기" button; below it progress "7 / 30". Right column: a vertical 3-step timeline "07:30 전날 복습 ✓", "새 숙제 · 20 VOCA + 10 IDIOM (진행 중)", "19:00 당일 시험 (잠김)". Bottom row: three quiet stat tiles "42 맞힌 표현", "18 서로 다른 날 정답", "6 누적 시험" and a small spaced-review strip labelled "간격 복습 3일 · 7일 · 30일 — 12개 대기". All Korean text must be legible and correctly spelled. No logos or brand assets of existing apps.
```

## 시안 B: Sticker Collection (CapWords + Drops)

```
Create a high-fidelity UI mockup image (1600x1000, desktop web app, flat screenshot, no device frame) for an original Korean-language vocabulary study web app named "lingo daily". Style: playful and delightful, pastel color blocks (peach, mint, lavender, butter yellow), chunky rounded shapes, words displayed as die-cut sticker cards with white outlines and subtle drop shadows, friendly rounded Korean sans-serif. Layout: top header with "오늘의 단어 스티커" and an English/중국어 pill toggle. Main area: a sticker board grid of collected words — "arrive 도착하다", "leave 떠나다", "bring 가져오다", "get up 일어나다", "我 wǒ 나", "没关系 méi guān xi 괜찮다" — some stickers grayed-out as "아직 못 모은 단어". Left side: a big colorful card "오늘의 미션" with three bite-size sessions "① 전날 복습 5분", "② 새 단어 30개", "③ 저녁 7시 시험", each with a small circular progress. Right side: a weekly calendar strip Mon–Sun with collected-sticker counts and "토·일 주간 SHUFFLE" badge, plus a button "단어장 PNG 저장". All Korean text must be legible and correctly spelled. No logos, mascots or brand assets of existing apps.
```

## 시안 C: Coach Dashboard, Dark (Speak + Duolingo 반면교사)

```
Create a high-fidelity UI mockup image (1600x1000, desktop web app, flat screenshot, no device frame) for an original Korean-language language-learning dashboard named "lingo daily". Style: premium dark mode, near-black navy background (#0E1220), elevated charcoal cards, vivid but limited accents (electric blue for English, coral red for Chinese), bold geometric Korean sans-serif, crisp data visualization. Layout: left sidebar with "데일리 숙제", "학습 계획", "학습 리포트". Top: greeting "오늘도 한 걸음, Ted" with a 14-day streak flame-free badge "연속 14일". Two large progress rings side by side: "영어 18/30" (blue) and "중국어 12/25" (coral). Middle: a flexible lesson board (not a forced path) with three cards the learner can choose — "전날 복습 · 07:30 열림", "새 숙제 · 20 VOCA + 10 IDIOM", "당일 시험 · 19:00 열림 (잠김)" — plus a side card "오답·간격 복습 12개" with chips "3일 · 7일 · 30일". Bottom: a GitHub-style study heatmap for the last 12 weeks and a line chart of evening test scores (68, 74, 81, 86, 88%). All Korean text must be legible and correctly spelled. No logos or brand assets of existing apps.
```

## 시안 A-M: Calm Focus 모바일

```
Create a high-fidelity UI mockup image (portrait, 9:16 phone screen, mobile web app, flat screenshot, no device frame, no status-bar clutter) for an original Korean-language vocabulary study app named "lingo daily". Use exactly the same visual language as a calm desktop design: warm off-white background (#FAF8F4), deep ink text, a single muted teal accent, soft 1px borders, 16px radius cards, Pretendard-like Korean sans-serif, generous whitespace, large confident headings. Single-column layout, top to bottom: (1) compact header with "lingo daily" wordmark on the left and a small date "10월 20일 (화)" on the right; below it a full-width English/중국어 segmented toggle with English selected. (2) Heading "오늘도, 하나씩 더." with subline "매일 꾸준히, 오래 기억에 남는 어휘 학습". (3) A horizontal 3-step progress stepper: "07:30 전날 복습 ✓" (done), "새 숙제 20+10" (current, teal), "19:00 시험" (locked with a lock icon). (4) One large flashcard filling most of the width showing "arrive", IPA /əˈraɪv/, a round speaker button, and a full-width teal "뜻 보기" button; under the card a thin progress bar with "7 / 30" and small left/right arrows. (5) A row of three compact stat tiles "42 맞힌 표현", "18 서로 다른 날 정답", "6 누적 시험". (6) A slim card "간격 복습 3일 · 7일 · 30일 — 12개 대기". (7) Fixed bottom tab bar with 4 icons labelled "홈", "단어장", "리포트", "설정", 홈 active in teal. Thumb-friendly 48px+ tap targets. All Korean text must be legible and correctly spelled. No logos or brand assets of existing apps.
```

## 모바일 변형 (선택)

위 프롬프트에서 "1600x1000, desktop web app"을 "1080x1920, mobile web app, single column"으로 바꿔 같은 콘텐츠를 세로로 배치한다.

## 생성 결과 (Codex CLI 0.172.0 내장 이미지 생성, 1568×1003)

| 파일 | 시안 | 검토 메모 |
| --- | --- | --- |
| `concept-a.png` | A. Calm Focus | 한국어·IPA 정확. 현재 사이트 구조(3단계·통계 3개)와 가장 가까워 적용 부담이 작음 |
| `concept-b.png` | B. Sticker Collection | 한국어·병음 정확. 토글이 중국어로 선택돼 있는데 영어 단어가 함께 보이는 등 상태 표시가 섞임 |
| `concept-c.png` | C. Coach Dashboard | 지시와 달리 불꽃 아이콘이 들어감. 차트 날짜(1/17~1/25)가 실제 일정과 다르고 "정해진 순서 없이"는 전날 복습 선행 규칙과 충돌하므로 적용 시 문구 조정 필요 |
| `concept-a-mobile.png` | A. Calm Focus 모바일 (941×1672) | 한국어 정확, 데스크톱 A와 색·타이포 일치. 강세 기호가 ˈ 대신 ' 로 그려짐(실제 구현 시 폰트로 해결) |
