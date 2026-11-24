// Daily homework view (design A · Calm Focus): one flashcard at a time, a three-step day timeline,
// stat tiles and the spaced-review strip. Quizzes, results and the pocket summary open as dialogs.
window.LD.ready.then(() => {
  const $ = (s) => document.querySelector(s),
    E = (tag, cls, text) => {
      let e = document.createElement(tag);
      e.className = cls;
      e.textContent = text;
      return e;
    },
    icon = (name, cls = "") => {
      const ns = "http://www.w3.org/2000/svg",
        s = document.createElementNS(ns, "svg"),
        u = document.createElementNS(ns, "use");
      s.setAttribute("aria-hidden", "true");
      if (cls) s.setAttribute("class", cls);
      u.setAttribute("href", "#i-" + name);
      s.append(u);
      return s;
    },
    today = () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    shiftDate = (d, n) => {
      let v = new Date(d + "T12:00:00+09:00");
      v.setDate(v.getDate() + n);
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(v);
    },
    koDate = (d) =>
      new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(new Date(d + "T12:00:00+09:00"));
  const MODE_NAMES = { review: "전날 복습", evening: "저녁 시험", weekend: "주말 시험", spaced: "간격 복습" };
  let selected = today(),
    lang = "en",
    data = null,
    active = true,
    busy = false,
    quiz = null,
    card = { key: "", index: 0, revealed: false };
  const nav = $('.rail button[data-view="homework"]');
  const root = E("section", "homework", "");
  root.id = "homework";
  $(".topbar").after(root);
  function toggle(on) {
    active = on;
    root.hidden = !on;
    $("#dashboard").hidden = on;
    $("#topActions").hidden = !on;
    document.body.classList.toggle("on-homework", on);
    if (on)
      document.querySelectorAll(".rail button[data-view]").forEach((b) => b.classList.toggle("active", b === nav));
    if (on) load();
  }
  nav.onclick = () => toggle(true);
  $(".rail-mark").onclick = (e) => {
    e.preventDefault();
    toggle(true);
  };
  $(".wordmark").onclick = (e) => {
    e.preventDefault();
    toggle(true);
  };
  document.querySelectorAll('.rail button[data-view]:not([data-view="homework"])').forEach((b) =>
    b.addEventListener("click", () => {
      toggle(false);
      document.querySelectorAll(".rail button[data-view]").forEach((x) => x.classList.toggle("active", x === b));
    }),
  );
  const api = (path, body) => window.LD.api(path, body);
  function button(label, fn, cls = "") {
    let b = E("button", cls, label);
    b.type = "button";
    b.onclick = fn;
    return b;
  }
  function alertBox(msg) {
    let e = $("#coach-message");
    if (e) {
      e.textContent = msg;
      e.hidden = false;
    }
  }
  async function action(fn) {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } catch (e) {
      alertBox(e.message);
    } finally {
      busy = false;
    }
  }
  const flagKey = (k) => "ld-flag:" + (window.LD.user?.id || "me") + ":" + k;
  const dismissed = (k) => {
    try {
      return localStorage.getItem(flagKey(k)) === "1";
    } catch {
      return false;
    }
  };
  const dismiss = (k) => {
    try {
      localStorage.setItem(flagKey(k), "1");
    } catch {}
  };
  const url = (path, mode) => path + "?date=" + selected + "&lang=" + lang + (mode ? "&mode=" + mode : "");
  async function load() {
    root.setAttribute("aria-busy", "true");
    if (!root.children.length) root.append(E("p", "hw-loading", "숙제를 불러오는 중입니다…"));
    try {
      data = await api(url("/api/homework"));
      render();
    } catch (e) {
      root.replaceChildren(
        E("h1", "hw-title", "오늘도, 하나씩 더."),
        E("p", "coach-alert", e.message),
        button("다시 불러오기", load),
      );
    } finally {
      root.setAttribute("aria-busy", "false");
    }
  }

  // ------------------------------------------------------------------ header pieces
  function renderLangToggle() {
    const box = $("#topActions"),
      seg = E("div", "segmented", "");
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-label", "학습 언어");
    for (const [l, name] of [
      ["en", "English"],
      ["zh", "中文"],
    ]) {
      const b = button(name, () => {
        if (lang === l) return;
        lang = l;
        load();
      });
      b.setAttribute("aria-pressed", String(lang === l));
      if (lang === l) b.classList.add("on");
      seg.append(b);
    }
    box.replaceChildren(seg);
  }
  function hero() {
    const top = E("div", "hw-hero", ""),
      t = E("div", "", "");
    t.append(
      E("h1", "hw-title", data.weekend ? "주말엔, 한 주를 내 것으로." : "오늘도, 하나씩 더."),
      E(
        "p",
        "hw-sub",
        data.weekend ? "월~금에 배운 표현을 모두 섞어 다시 꺼내 봅니다." : "매일 꾸준히, 오래 기억에 남는 어휘 학습",
      ),
    );
    const nav = E("div", "hw-date", "");
    const prev = button("", () => {
      selected = shiftDate(selected, -1);
      load();
    });
    prev.append(icon("left"));
    prev.setAttribute("aria-label", "이전 날짜");
    const next = button("", () => {
      selected = shiftDate(selected, 1);
      load();
    });
    next.append(icon("right"));
    next.setAttribute("aria-label", "다음 날짜");
    const date = E("input", "", "");
    date.type = "date";
    date.value = selected;
    date.setAttribute("aria-label", "숙제 날짜");
    date.onchange = () => {
      if (date.value) {
        selected = date.value;
        load();
      }
    };
    nav.append(prev, date, next);
    if (selected !== data.serverDate)
      nav.append(
        button(
          "오늘",
          () => {
            selected = today();
            load();
          },
          "today",
        ),
      );
    const chip = button("", () => profileForm(), "level-chip");
    chip.append(E("span", "", LANG_NAME[lang] + " 레벨"), E("b", "", data.trackName), icon("right"));
    chip.setAttribute("aria-label", LANG_NAME[lang] + " 레벨 " + data.trackName + " · 바꾸기");
    t.append(chip);
    top.append(t, nav);
    return top;
  }

  // ------------------------------------------------------------------ day state
  function dayState() {
    const eveningOpen = selected < data.serverDate || (selected === data.serverDate && data.serverTime >= 1900);
    const done = (mode) => data.results.filter((a) => a.mode === mode);
    const best = (mode) => Math.max(...done(mode).map((a) => a.score));
    return { eveningOpen, done, best };
  }
  function steps() {
    const s = dayState(),
      box = E("ol", "steps", "");
    box.setAttribute("aria-label", "오늘의 학습 순서");
    const step = (time, title, status, meta, act, short) => {
      const li = E("li", "step " + status, "");
      const dot = E("span", "step-dot", "");
      if (status === "done") dot.textContent = "✓";
      else if (status === "locked") dot.append(icon("lock"));
      const body = E("div", "step-body", "");
      if (time) body.append(E("span", "step-time", time));
      const t = E("strong", "", "");
      t.append(E("span", "t-long", title), E("span", "t-short", short || title));
      body.append(t);
      if (meta) body.append(E("span", "step-meta", meta));
      if (act) body.append(act);
      li.append(dot, body);
      box.append(li);
    };
    if (data.weekend) {
      const n = s.done("weekend").length;
      step(
        "토·일 07:30",
        "주간 전체 SHUFFLE",
        !data.available ? "locked" : n ? "done" : "current",
        n ? "최고 " + s.best("weekend") + "%" : lang === "en" ? "100 VOCA + 50 IDIOM" : "100 VOCA + 25 IDIOM",
        data.available ? button(n ? "다시 풀기" : "시작", () => startQuiz("weekend"), "step-btn") : null,
      );
      step(
        "언제든",
        "오답·간격 복습",
        data.extraReview.length ? "current" : "done",
        data.extraReview.length + "개 대기",
        null,
      );
      return box;
    }
    const review = s.done("review").length;
    step(
      "07:30",
      "전날 복습",
      !data.available ? "locked" : !data.previousDate ? "skip" : data.reviewRequired ? "current" : "done",
      !data.previousDate
        ? "첫 수업 · 복습 없음"
        : review
          ? "최고 " + s.best("review") + "%"
          : koDate(data.previousDate) + " 표현",
      data.available && data.previousDate
        ? button(data.reviewRequired ? "시작" : "다시 풀기", () => startQuiz("review"), "step-btn")
        : null,
    );
    const total = data.lesson?.items.length || (lang === "en" ? 30 : 25),
      studied = data.study.length;
    const counts = lang === "en" ? "20 VOCA + 10 IDIOM" : "20 VOCA + 5 IDIOM",
      homeworkDone = !!data.lesson && studied >= total;
    step(
      "",
      "새 숙제",
      !data.lesson ? (data.unlocked ? "wait" : "locked") : homeworkDone ? "done" : "current",
      data.lesson
        ? counts + " · 확인 " + studied + "/" + total
        : data.unlocked
          ? "수업 준비 중"
          : counts + " · 복습 후 열림",
      null,
      lang === "en" ? "새 숙제 20+10" : "새 숙제 20+5",
    );
    const evening = s.done("evening").length,
      canTest = s.eveningOpen && !data.reviewRequired && !!data.lesson;
    // The test is highlighted as the current step only once the homework is done; before that it is just "open".
    step(
      "19:00",
      "당일 시험",
      evening ? "done" : canTest ? (homeworkDone ? "current" : "open") : "locked",
      evening ? "최고 " + s.best("evening") + "%" : canTest ? "지금 볼 수 있어요" : "19:00에 열림",
      canTest ? button(evening ? "다시 풀기" : "시작", () => startQuiz("evening"), "step-btn") : null,
      "19:00 시험",
    );
    return box;
  }

  // ------------------------------------------------------------------ focus card
  function focusCard() {
    const box = E("section", "focus", "");
    const message = (iconName, eyebrow, title, text, act) => {
      box.classList.add("focus-message");
      if (iconName) box.append(icon(iconName, "focus-icon"));
      if (eyebrow) box.append(E("span", "eyebrow", eyebrow));
      box.append(E("h2", "focus-title", title));
      if (text) box.append(E("p", "focus-text", text));
      if (act) box.append(act);
      return box;
    };
    if (!data.available)
      return message("lock", "", "오전 7시 30분에 열립니다", "이 날짜의 숙제는 한국 시간 07:30에 공개됩니다.");
    if (data.weekend)
      return message(
        "repeat",
        "WEEKEND SHUFFLE",
        lang === "en" ? "150문항 누적 시험" : "125문항 누적 시험",
        "그 주 월~금에 배정한 모든 표현을 새 순서로 섞습니다. 토·일 모두 볼 수 있어요.",
        button("주말 누적 시험 시작", () => startQuiz("weekend"), "primary big"),
      );
    if (data.reviewRequired)
      return message(
        "",
        "STEP 1 · 전날 복습",
        koDate(data.previousDate) + " 표현 다시 떠올리기",
        "복습 시험을 마치면 오늘의 새 표현이 열립니다. 정답률과 오답은 따로 기록됩니다.",
        button("복습 시험 시작", () => startQuiz("review"), "primary big"),
      );
    if (!data.lesson) return message("", "", "오늘 수업을 준비 중입니다", "수업이 준비되면 새로고침해 주세요.");
    return flashcard(box);
  }
  function flashcard(box) {
    const items = data.lesson.items,
      key = selected + ":" + lang + ":" + data.track;
    if (card.key !== key) {
      const first = items.findIndex((i) => !data.study.includes(i.id));
      card = { key, index: first < 0 ? 0 : first, revealed: false };
    }
    const i = items[card.index],
      studied = data.study.includes(i.id);
    box.classList.add("flashcard");
    const head = E("div", "card-head", "");
    head.append(
      E("span", "card-kind", (i.kind === "idiom" ? "IDIOM" : "VOCA") + " · " + String(card.index + 1).padStart(2, "0")),
      E(
        "span",
        "card-done" + (studied ? " on" : ""),
        studied ? "✓ 학습 확인" : "학습 확인 " + data.study.length + "/" + items.length,
      ),
    );
    const go = (n) => {
      card.index = (n + items.length) % items.length;
      card.revealed = false;
      paintFocus();
    };
    const prev = button("", () => go(card.index - 1), "card-arrow");
    prev.append(icon("left"));
    prev.setAttribute("aria-label", "이전 표현");
    const next = button("", () => go(card.index + 1), "card-arrow");
    next.append(icon("right"));
    next.setAttribute("aria-label", "다음 표현");
    const center = E("div", "card-center", "");
    const term = E("h2", "card-term" + ([...i.term].length > 14 ? " long" : ""), i.term);
    term.lang = lang === "en" ? "en" : "zh-CN";
    const sound = button("", () => speak(i), "sound-btn");
    sound.append(icon("sound"));
    sound.setAttribute("aria-label", i.term + " 발음 듣기");
    center.append(term, E("p", "card-pron", lang === "en" ? "/" + i.pronunciation + "/" : i.pronunciation), sound);
    const answer = E("div", "card-answer", "");
    answer.hidden = !card.revealed;
    answer.append(E("p", "card-meaning", i.meaning));
    if (i.example) answer.append(E("p", "card-example", i.example));
    if (i.exampleMeaning) answer.append(E("p", "card-example ko", i.exampleMeaning));
    center.append(answer);
    let main;
    if (!card.revealed)
      main = button(
        "뜻 보기",
        () => {
          card.revealed = true;
          paintFocus();
        },
        "primary big",
      );
    else if (!studied)
      main = button(
        "알았어요 · 학습 확인",
        () =>
          action(async () => {
            const r = await api("/api/study", { date: selected, lang, ids: [i.id] });
            data.study = r.ids;
            mirrorLegacy();
            card.index = (card.index + 1) % items.length;
            card.revealed = false;
            render();
          }),
        "primary big",
      );
    else main = button("다음 표현", () => go(card.index + 1), "primary big");
    center.append(main);
    const body = E("div", "card-body", "");
    body.append(prev, center, next);
    const progress = E("div", "card-progress", ""),
      track = E("div", "track", ""),
      fill = E("i", "", "");
    fill.style.width = ((card.index + 1) / items.length) * 100 + "%";
    track.append(fill);
    progress.append(track, E("span", "", card.index + 1 + " / " + items.length));
    box.append(head, body, progress);
    return box;
  }
  function paintFocus() {
    const old = root.querySelector(".focus");
    if (old) old.replaceWith(focusCard());
  }

  // ------------------------------------------------------------------ main render
  function render() {
    renderLangToggle();
    root.replaceChildren();
    root.append(hero());
    let msg = E("p", "coach-alert", "");
    msg.id = "coach-message";
    msg.setAttribute("role", "status");
    msg.hidden = true;
    root.append(msg);

    if (!data.profile.chosen && !dismissed("level-intro")) {
      const intro = E("div", "level-intro", ""),
        txt = E("div", "", "");
      txt.append(
        E("strong", "", "내 레벨을 정해 보세요"),
        E("span", "", "기초·중급·고급 중 내 수준의 수업을 받습니다. 5분 레벨 테스트로 추천 레벨을 알려드려요."),
      );
      const acts = E("div", "btn-row", "");
      acts.append(
        button("레벨 테스트", () => startPlacement(lang), "primary"),
        button("직접 고르기", () => profileForm()),
        button(
          "나중에",
          () => {
            dismiss("level-intro");
            intro.remove();
          },
          "link",
        ),
      );
      intro.append(txt, acts);
      root.append(intro);
    }
    const lead = E("div", "hw-lead", "");
    lead.append(focusCard(), steps());
    root.append(lead);

    const tiles = E("div", "tiles", "");
    for (const [v, label] of [
      [data.stats.tested, "맞힌 표현"],
      [data.stats.retained, "서로 다른 날 정답"],
      [data.stats.attempts, "누적 시험"],
    ]) {
      const t = E("article", "tile", "");
      t.append(E("strong", "", String(v)), E("span", "", label));
      tiles.append(t);
    }
    const spaced = button(
      "",
      () => $("#extra-review")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      "tile tile-spaced",
    );
    const sIcon = E("span", "tile-icon", "");
    sIcon.append(icon("repeat"));
    const sText = E("span", "", "");
    sText.append(
      E("b", "", "간격 복습"),
      E("small", "", "3일 · 7일 · 30일 — "),
      E("em", "", data.extraReview.length + "개 대기"),
    );
    spaced.append(sIcon, sText);
    tiles.append(spaced);
    root.append(tiles);

    if (data.lesson) {
      const sec = E("section", "hw-section", ""),
        title = E("div", "hw-section-title", ""),
        h = E("div", "", "");
      h.append(
        E("h2", "", "오늘의 표현 " + data.lesson.items.length + "개"),
        E("p", "", data.lesson.level + " · 카드를 누르면 위에서 크게 볼 수 있어요"),
      );
      const sum = button("", showSummary, "ghost");
      sum.append(icon("download"), document.createTextNode(" 포켓 단어장"));
      title.append(h, sum);
      sec.append(title);
      const grid = E("div", "word-grid", "");
      data.lesson.items.forEach((i, n) => {
        const c = wordCard(i, n, true);
        c.querySelector("h3").onclick = () => {
          card.index = n;
          card.revealed = false;
          paintFocus();
          root.querySelector(".focus").scrollIntoView({ behavior: "smooth", block: "center" });
        };
        grid.append(c);
      });
      sec.append(grid);
      root.append(sec);
    }

    let review = E("section", "hw-section extra-review", "");
    review.id = "extra-review";
    const rt = E("div", "hw-section-title", ""),
      rh = E("div", "", "");
    rh.append(
      E("h2", "", "오답 · 3일 / 7일 / 30일 복습"),
      E("p", "", "최근 오답을 먼저, 간격 복습 표현을 이어서 보여줍니다."),
    );
    rt.append(rh);
    review.append(rt);
    if (data.extraReview.length) {
      const row = E("div", "btn-row", "");
      row.append(
        button("복습 표현 시험 보기", () => startQuiz("spaced"), "primary"),
        button("뜻 가리고 복습하기", () => {
          review.classList.toggle("conceal");
          review.querySelectorAll(".word-meaning").forEach((e) => (e.tabIndex = 0));
        }),
      );
      review.append(row);
      let grid = E("div", "word-grid", "");
      data.extraReview.forEach((i, n) => grid.append(wordCard(i, n, false)));
      review.append(grid);
    } else review.append(E("p", "sub", "시험을 마치면 오답과 간격 복습 표현이 여기에 모입니다."));
    root.append(review);

    let history = E("section", "hw-section", "");
    const ht = E("div", "hw-section-title", ""),
      hh = E("div", "", "");
    hh.append(
      E("h2", "", "나의 기억력 추적"),
      E("p", "", "최근 시험 정답률 · 같은 날 반복 정답은 장기 기억 지표에 중복 계산하지 않습니다."),
    );
    ht.append(hh);
    history.append(ht);
    let chart = E("div", "score-chart", "");
    for (const a of data.stats.recent) {
      let c = E("div", "score-column", ""),
        bar = E("div", "score-bar", "");
      bar.style.height = Math.max(3, a.score) + "%";
      const col = E("div", "score-track", "");
      col.append(bar);
      c.append(
        E("strong", "", a.score + "%"),
        col,
        E("small", "", a.date.slice(5).replace("-", "/")),
        E("small", "", MODE_NAMES[a.mode].slice(0, 2)),
      );
      chart.append(c);
    }
    if (!data.stats.recent.length) chart.append(E("p", "sub", "첫 시험부터 성장 기록이 시작됩니다."));
    history.append(chart);
    let results = E("div", "coach-result-list", "");
    data.results.forEach((a) =>
      results.append(
        button(MODE_NAMES[a.mode] + " · " + a.correct + "/" + a.total + " · " + a.score + "% → 오답 확인", () =>
          showResult(a),
        ),
      ),
    );
    history.append(results);
    root.append(history);

    let plan = E("section", "hw-section roadmap", "");
    plan.append(
      E("h2", "", "1년, 기초에서 실전까지"),
      E(
        "p",
        "",
        "1–3개월 일상 기초 → 4–6개월 여행·사회생활 → 7–9개월 비즈니스·협상 → 10–12개월 시사·문화·깊이 있는 대화",
      ),
      E(
        "p",
        "sub",
        "최근 저녁 시험 3회의 정답률이 85% 이상이면 조금씩 높이고, 60% 미만이면 기초를 보강합니다. 단계는 비공식 학습 기준이며, 숙어에는 구동사·고정 표현과 중국어 일상 관용 표현이 포함됩니다.",
      ),
    );
    root.append(plan);
    let footer = E("div", "coach-footer", "");
    footer.append(
      E(
        "span",
        "",
        "숙제·시험 결과는 서버에 사람별로 저장됩니다. 한국 시간 기준 · 정시 알림은 아직 연결되지 않았습니다.",
      ),
      button("레벨 설정", () => profileForm()),
    );
    root.append(footer);
  }

  function speak(i) {
    if (!("speechSynthesis" in window)) {
      alertBox("이 브라우저는 음성합성을 지원하지 않습니다. Chrome 또는 Safari에서 시도해주세요.");
      return;
    }
    speechSynthesis.cancel();
    let s = new SpeechSynthesisUtterance(i.term);
    s.lang = lang === "en" ? "en-US" : "zh-CN";
    let voices = speechSynthesis.getVoices();
    s.voice =
      voices.find((v) => v.lang === s.lang) ||
      voices.find((v) => v.lang.startsWith(lang === "en" ? "en" : "zh")) ||
      null;
    s.rate = 0.85;
    s.onerror = () => alertBox("음성을 재생하지 못했습니다. 기기에 영어·중국어 음성팩이 설치되어 있는지 확인해주세요.");
    speechSynthesis.speak(s);
  }
  function wordCard(i, n, study) {
    let card = E("article", "word-card", ""),
      head = E("div", "word-top", "");
    head.append(
      E("span", "", String(n + 1).padStart(2, "0") + " · " + i.kind.toUpperCase()),
      button("", () => speak(i), "sound"),
    );
    head.lastChild.append(icon("sound"));
    head.lastChild.setAttribute("aria-label", i.term + " 발음 듣기");
    card.append(
      head,
      E("h3", "", i.term),
      E("p", "pronunciation", lang === "en" ? "/" + i.pronunciation + "/" : i.pronunciation),
    );
    let meaning = E("p", "word-meaning", i.meaning);
    meaning.onclick = () => meaning.classList.toggle("reveal");
    card.append(meaning);
    if (i.example) card.append(E("p", "word-example", i.example));
    if (i.exampleMeaning) card.append(E("p", "word-example", i.exampleMeaning));
    if (study) {
      let checked = data.study.includes(i.id),
        b = button(
          checked ? "✓ 학습 확인 완료" : "학습 확인",
          () =>
            action(async () => {
              let r = await api("/api/study", { date: selected, lang, ids: [i.id] });
              data.study = r.ids;
              mirrorLegacy();
              render();
            }),
          "learn-check",
        );
      b.disabled = checked;
      card.append(b);
    }
    return card;
  }
  function mirrorLegacy() {
    try {
      let s = JSON.parse(localStorage.getItem(window.LD.storageKey));
      if (!s?.plans) return;
      for (const [kind, cat] of [
        ["voca", 0],
        ["idiom", 7],
      ]) {
        let id = "lisa-" + selected + "-" + lang + "-" + kind;
        let total = data.lesson.items.filter((i) => i.kind === kind).length;
        let value = data.lesson.items.filter((i) => i.kind === kind && data.study.includes(i.id)).length;
        if (!s.plans.some((p) => p.id === id))
          s.plans.push({
            id,
            lang,
            cat,
            title: "LISA DAILY " + kind.toUpperCase(),
            target: total,
            time: "07:30",
            start: selected,
            repeat: false,
          });
        s.records[selected] ??= {};
        s.records[selected][id] = { value, minutes: 0 };
      }
      localStorage.setItem(window.LD.storageKey, JSON.stringify(s));
      window.dispatchEvent(new Event("lisa-records-updated"));
    } catch {}
  }
  function dialog(title) {
    let old = $("#coach-dialog");
    if (old) old.remove();
    let d = E("dialog", "coach-dialog", "");
    d.id = "coach-dialog";
    let h = E("div", "section-title", "");
    h.append(
      E("h2", "", title),
      button("✕", () => d.close()),
    );
    h.lastChild.setAttribute("aria-label", "닫기");
    d.append(h);
    document.body.append(d);
    d.addEventListener("close", () => {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    });
    return d;
  }
  function shuffle(a) {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      let j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  async function startQuiz(mode) {
    await action(async () => {
      const q = await api(url("/api/quiz", mode));
      if (!q.items.length) {
        alertBox("복습할 이전 수업이 없습니다.");
        return;
      }
      let d = dialog(
        {
          review: "전날 복습",
          evening: "오늘의 저녁 시험",
          weekend: "주말 전체 SHUFFLE",
          spaced: "오답·간격 복습 시험",
        }[mode],
      );
      d.append(
        E(
          "p",
          "",
          "총 " +
            q.items.length +
            "문항 · 중간에 닫아도 이 브라우저에서 이어서 풀 수 있습니다. 정답과 해설은 제출 후 공개됩니다.",
        ),
      );
      for (const [format, label] of [
        ["choice", "표현 보고 뜻 고르기"],
        ["typing", "뜻 보고 표현 직접 쓰기"],
      ])
        d.append(
          button(
            label,
            () => {
              let key = [window.LD.quizPrefix, selected, lang, mode, format].join(":"),
                saved;
              try {
                saved = JSON.parse(localStorage.getItem(key));
              } catch {}
              let ids = new Set(q.items.map((i) => i.id));
              let items =
                saved?.items?.length === q.items.length && saved.items.every((i) => ids.has(i.id))
                  ? saved.items.map((i) => q.items.find((x) => x.id === i.id))
                  : shuffle(q.items);
              quiz = {
                items,
                date: selected,
                lang,
                mode,
                format,
                key,
                answers: saved?.answers || {},
                index: saved?.index || 0,
              };
              d.close();
              quizRender();
            },
            "quiz-mode",
          ),
        );
      d.showModal();
    });
  }
  function quizRender() {
    let d = dialog("기억 꺼내기 · " + (quiz.format === "choice" ? "뜻 고르기" : "표현 쓰기")),
      i = quiz.items[quiz.index];
    d.append(
      E(
        "p",
        "quiz-progress",
        quiz.index + 1 + " / " + quiz.items.length + " · 답변 " + Object.keys(quiz.answers).length + "개",
      ),
    );
    let progress = E("progress", "", "");
    progress.max = quiz.items.length;
    progress.value = Object.keys(quiz.answers).length;
    progress.setAttribute("aria-label", "답변 진행률");
    d.append(
      progress,
      E("span", "eyebrow", i.kind.toUpperCase()),
      E("h3", "quiz-question", quiz.format === "choice" ? i.term : i.meaning),
    );
    if (quiz.format === "choice") {
      let options = quiz.options?.[i.id];
      quiz.options ??= {};
      if (!options) {
        options = shuffle([
          i.meaning,
          ...shuffle(
            [...new Set(quiz.items.filter((x) => x.id !== i.id).map((x) => x.meaning))].filter((v) => v !== i.meaning),
          ).slice(0, 3),
        ]);
        quiz.options[i.id] = options;
      }
      for (const v of options) {
        let b = button(
          v,
          () => {
            quiz.answers[i.id] = v;
            persistQuiz();
            quizRender();
          },
          "quiz-option" + (quiz.answers[i.id] === v ? " chosen" : ""),
        );
        b.setAttribute("aria-pressed", String(quiz.answers[i.id] === v));
        d.append(b);
      }
    } else {
      let label = E("label", "", "영어 표현 또는 중국어 한자를 입력하세요.");
      label.htmlFor = "quiz-answer";
      let input = E("input", "", "");
      input.id = "quiz-answer";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.value = quiz.answers[i.id] || "";
      input.oninput = () => {
        if (input.value.trim()) quiz.answers[i.id] = input.value;
        else delete quiz.answers[i.id];
        persistQuiz();
      };
      d.append(label, input, E("p", "sub", "영어는 대소문자·공백·구두점을 무시합니다. 중국어는 한자로 입력하세요."));
    }
    let controls = E("div", "quiz-controls", ""),
      prev = button("이전", () => {
        quiz.index--;
        persistQuiz();
        quizRender();
      });
    prev.disabled = !quiz.index;
    controls.append(prev);
    if (quiz.index < quiz.items.length - 1)
      controls.append(
        button(
          "다음",
          () => {
            quiz.index++;
            persistQuiz();
            quizRender();
          },
          "primary",
        ),
      );
    else
      controls.append(
        button(
          "전체 답안 제출",
          async () => {
            let missing = quiz.items.findIndex((i) => !quiz.answers[i.id]);
            if (missing >= 0) {
              quiz.index = missing;
              persistQuiz();
              quizRender();
              $("#quiz-message").textContent = "답하지 않은 문제를 먼저 풀어주세요.";
              return;
            }
            let submit = controls.lastChild;
            submit.disabled = true;
            try {
              let a = await api("/api/quiz/submit", {
                date: quiz.date,
                lang: quiz.lang,
                mode: quiz.mode,
                format: quiz.format,
                answers: quiz.items.map((i) => ({ id: i.id, answer: quiz.answers[i.id] })),
              });
              localStorage.removeItem(quiz.key);
              d.close();
              await load();
              showResult(a);
            } catch (e) {
              $("#quiz-message").textContent = e.message;
              submit.disabled = false;
            }
          },
          "primary",
        ),
      );
    d.append(controls);
    let msg = E("p", "coach-alert", "");
    msg.id = "quiz-message";
    msg.setAttribute("role", "status");
    d.append(msg);
    d.showModal();
    if (quiz.format === "typing") $("#quiz-answer").focus();
  }
  function persistQuiz() {
    localStorage.setItem(quiz.key, JSON.stringify(quiz));
  }
  function showResult(a) {
    let d = dialog("시험 결과 · " + a.score + "%");
    d.append(
      E("p", "result-score", a.correct + " / " + a.total + " 정답"),
      E(
        "p",
        "",
        a.score >= 85
          ? "잘 기억하고 있어요. 다음 수업에서 조금씩 범위를 넓혀갑니다."
          : "오늘의 오답을 다시 듣고 확인해보세요. 다음 복습에서도 만나게 됩니다.",
      ),
    );
    if (!a.wrongItems.length) d.append(E("p", "", "모두 맞혔습니다! 다른 날에도 기억하는지 다시 확인해요."));
    for (const i of a.wrongItems) {
      let c = wordCard(i, 0, false);
      c.append(E("small", "wrong-answer", "내 답: " + i.answer));
      d.append(c);
    }
    d.append(
      button(
        "확인하고 계속하기",
        () => {
          d.close();
          load();
        },
        "primary",
      ),
    );
    d.showModal();
  }
  // ------------------------------------------------------------------ levels
  const LEVELS = [
    ["basic", "기초", "일상 핵심 어휘부터 · 처음 시작하거나 기초를 다질 때"],
    ["intermediate", "중급", "여행·사회생활·업무 기본 표현 · 기초 단어는 대부분 알 때"],
    ["advanced", "고급", "비즈니스·시사·뉘앙스 있는 표현 · 뉴스나 회의를 어느 정도 따라갈 때"],
  ];
  const LEVEL_NAME = Object.fromEntries(LEVELS.map(([v, n]) => [v, n]));
  const LANG_NAME = { en: "영어", zh: "중국어" };
  // Opens the level picker. `preset` pre-selects a level for one language (e.g. a test recommendation).
  function profileForm(preset = {}) {
    let d = dialog("학습 레벨"),
      form = E("form", "level-form", "");
    form.append(
      E("p", "sub", "레벨마다 매일 받는 수업이 다릅니다. 바꿔도 지금까지의 진도와 시험 기록은 그대로 남습니다."),
    );
    for (const l of ["en", "zh"]) {
      const box = E("fieldset", "level-set", ""),
        legend = E("legend", "", LANG_NAME[l]);
      box.append(legend);
      const rec = preset.recommended?.[l] || (l === lang && data.placement?.recommended);
      for (const [v, name, note] of LEVELS) {
        const opt = E("label", "level-option", ""),
          input = E("input", "", "");
        input.type = "radio";
        input.name = l;
        input.value = v;
        input.checked = (preset[l] || data.profile[l] || "basic") === v;
        const text = E("span", "", "");
        text.append(E("b", "", name), E("small", "", note));
        opt.append(input, text);
        if (rec === v) opt.append(E("em", "level-rec", "테스트 추천"));
        box.append(opt);
      }
      box.append(
        button(
          "레벨 테스트 보기 · 24문항",
          () => {
            d.close();
            startPlacement(l);
          },
          "ghost level-test",
        ),
      );
      form.append(box);
    }
    let b = E("button", "primary", "저장");
    b.type = "submit";
    const err = E("p", "form-error", "");
    form.append(err, b);
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api("/api/profile", Object.fromEntries(new FormData(form)));
        d.close();
        card.key = "";
        load();
      } catch (x) {
        err.textContent = x.message;
      }
    };
    d.append(form);
    d.showModal();
  }
  async function startPlacement(l) {
    await action(async () => {
      const t = await api("/api/placement?lang=" + l);
      const state = { l, items: t.items, index: 0, answers: {} };
      placementRender(state);
    });
  }
  function placementRender(st) {
    const i = st.items[st.index],
      d = dialog("레벨 테스트 · " + LANG_NAME[st.l]);
    d.classList.add("placement-dialog");
    d.append(
      E(
        "p",
        "quiz-progress",
        st.index + 1 + " / " + st.items.length + " · 뜻을 고르세요. 모르면 '모르겠어요'를 누르세요.",
      ),
    );
    const progress = E("progress", "", "");
    progress.max = st.items.length;
    progress.value = st.index;
    d.append(progress);
    const q = E("h3", "quiz-question", i.term);
    q.lang = st.l === "en" ? "en" : "zh-CN";
    d.append(q, E("p", "placement-pron", st.l === "en" ? "/" + i.pronunciation + "/" : i.pronunciation));
    const pick = async (v) => {
      st.answers[i.id] = v;
      if (st.index < st.items.length - 1) {
        st.index++;
        placementRender(st);
        return;
      }
      d.querySelectorAll("button").forEach((b) => (b.disabled = true));
      try {
        const r = await api("/api/placement/submit", {
          lang: st.l,
          answers: st.items.map((x) => ({ id: x.id, answer: st.answers[x.id] ?? "" })),
        });
        placementResult(st.l, r);
      } catch (x) {
        d.append(E("p", "coach-alert", x.message));
      }
    };
    for (const v of i.options) {
      const b = button(v, () => pick(v), "quiz-option" + (st.answers[i.id] === v ? " chosen" : ""));
      d.append(b);
    }
    d.append(button("모르겠어요", () => pick(""), "quiz-option dont-know"));
    const controls = E("div", "quiz-controls", ""),
      prev = button("이전", () => {
        st.index--;
        placementRender(st);
      });
    prev.disabled = !st.index;
    controls.append(prev);
    d.append(controls);
    d.showModal();
  }
  function placementResult(l, r) {
    const d = dialog("레벨 테스트 결과");
    d.append(E("p", "result-score", "추천 레벨 · " + LEVEL_NAME[r.recommended]));
    const bars = E("div", "placement-bars", "");
    for (const [v, name] of LEVELS) {
      const b = r.bands[v],
        row = E("div", "placement-bar", ""),
        track = E("div", "track", ""),
        fill = E("i", "", "");
      fill.style.width = (b.total ? (b.correct / b.total) * 100 : 0) + "%";
      track.append(fill);
      row.append(E("span", "", name + " 단어"), track, E("b", "", b.correct + " / " + b.total));
      bars.append(row);
    }
    d.append(
      bars,
      E(
        "p",
        "sub",
        "각 단계에서 8문제 중 6문제 이상 맞히면 그 단계를 통과한 것으로 봅니다. 참고용 추천이며, 레벨은 직접 바꿀 수 있습니다.",
      ),
    );
    const row = E("div", "btn-row", "");
    row.append(
      button(
        LEVEL_NAME[r.recommended] + "으로 설정",
        async () => {
          try {
            await api("/api/profile", { ...data.profile, chosen: undefined, [l]: r.recommended });
            d.close();
            card.key = "";
            load();
          } catch (x) {
            d.append(E("p", "coach-alert", x.message));
          }
        },
        "primary",
      ),
      button("직접 고르기", () => {
        d.close();
        profileForm({ [l]: r.recommended, recommended: { [l]: r.recommended } });
      }),
    );
    d.append(row);
    d.showModal();
  }

  function showSummary() {
    if (!data?.lesson) return;
    let lesson = data.lesson,
      summaryLang = lang,
      withPronunciation = false;
    let d = dialog("오늘의 포켓 단어장");
    d.classList.add("summary-dialog");
    let top = d.firstChild;
    top.append(
      E("span", "summary-date", selected + " · " + (summaryLang === "en" ? "ENGLISH 20 + 10" : "CHINESE 20 + 5")),
    );
    let tools = E("div", "summary-tools", ""),
      note = E("span", "", "단어·숙어 + 뜻 · 오프라인으로 꺼내 보세요"),
      label = E("label", "", "발음 표기"),
      check = E("input", "", "");
    check.type = "checkbox";
    check.setAttribute("aria-label", "요약에 발음 표기 포함");
    check.onchange = () => {
      withPronunciation = check.checked;
      paint();
    };
    label.prepend(check);
    tools.append(
      note,
      label,
      button("이미지 저장 ↓", () => downloadSummary(lesson, summaryLang, withPronunciation), "primary"),
    );
    d.append(tools);
    let grid = E("div", "summary-grid", "");
    grid.style.setProperty("--summary-rows", Math.ceil(lesson.items.length / 2));
    d.append(grid);
    let foot = E(
      "div",
      "summary-foot",
      "lingodaily · LISA | V 단어 / I 숙어 · 화면 캡처 또는 이미지 저장으로 하루 종일 복습",
    );
    d.append(foot);
    function paint() {
      grid.replaceChildren();
      grid.classList.toggle("with-pronunciation", withPronunciation);
      lesson.items.forEach((i, n) => {
        let c = E("div", "summary-word", ""),
          t = E("strong", "", String(n + 1).padStart(2, "0") + " " + i.term);
        t.prepend(E("small", i.kind === "idiom" ? "summary-idiom" : "", i.kind === "idiom" ? "I " : "V "));
        c.append(t);
        if (withPronunciation)
          c.append(E("span", "summary-pron", summaryLang === "en" ? "/" + i.pronunciation + "/" : i.pronunciation));
        c.append(E("span", "summary-meaning", i.meaning));
        grid.append(c);
      });
    }
    paint();
    d.showModal();
  }
  function downloadSummary(lesson, l, pronunciation) {
    let canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    let c = canvas.getContext("2d");
    if (!c) {
      alert("이 브라우저에서 이미지 저장을 지원하지 않습니다. 화면 캡처로 저장해주세요.");
      return;
    }
    c.fillStyle = "#f4f7ef";
    c.fillRect(0, 0, 1080, 1920);
    c.fillStyle = "#2b6549";
    c.font = "bold 46px sans-serif";
    c.fillText("Lingo Daily · 포켓 단어장", 48, 80);
    c.font = "26px sans-serif";
    c.fillText(
      lesson.date + "  |  " + (l === "en" ? "ENGLISH · 20 VOCA + 10 IDIOM" : "CHINESE · 20 VOCA + 5 IDIOM"),
      48,
      127,
    );
    c.font = "22px sans-serif";
    c.fillStyle = "#7f9476";
    c.fillText("기초부터, 매일 한 걸음 더. — LISA", 48, 167);
    let rows = Math.ceil(lesson.items.length / 2),
      rowH = 1640 / rows;
    function lines(text, x, y, width, size, maxLines, color) {
      c.font = size + "px sans-serif";
      c.fillStyle = color;
      let chunks = [],
        line = "";
      for (const ch of text) {
        if (c.measureText(line + ch).width > width && line) {
          chunks.push(line);
          line = ch;
        } else line += ch;
      }
      if (line) chunks.push(line);
      chunks.slice(0, maxLines).forEach((s, n) => c.fillText(s, x, y + n * (size + 4)));
      return Math.min(chunks.length, maxLines) * (size + 4);
    }
    lesson.items.forEach((i, n) => {
      let col = Math.floor(n / rows),
        row = n % rows,
        x = 48 + col * 516,
        y = 210 + row * rowH;
      c.fillStyle = "#fff";
      c.fillRect(x - 8, y - 17, 492, rowH - 7);
      let h = lines(
        String(n + 1).padStart(2, "0") + " " + (i.kind === "idiom" ? "I" : "V") + "  " + i.term,
        x + 4,
        y + 15,
        465,
        27,
        2,
        "#2b6549",
      );
      let cursor = y + 15 + h;
      if (pronunciation) {
        cursor += lines(
          l === "en" ? "/" + i.pronunciation + "/" : i.pronunciation,
          x + 4,
          cursor,
          465,
          19,
          1,
          "#899a7d",
        );
      }
      lines(i.meaning, x + 4, cursor, 465, 23, pronunciation ? 2 : 2, "#50684b");
    });
    c.fillStyle = "#819476";
    c.font = "21px sans-serif";
    c.fillText("V 단어 · I 숙어   |   뜻을 가리고 떠올린 뒤 확인해보세요.", 48, 1900);
    canvas.toBlob((blob) => {
      if (!blob) return;
      let url = URL.createObjectURL(blob),
        a = E("a", "", "");
      a.href = url;
      a.download = "Lingo-Daily-" + lesson.date + "-" + l + ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, "image/png");
  }

  document.addEventListener("keydown", (e) => {
    if (
      !active ||
      !data?.lesson ||
      document.querySelector("dialog[open]") ||
      /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)
    )
      return;
    if (document.body.classList.contains("locked")) return;
    const f = root.querySelector(".flashcard");
    if (!f) return;
    if (e.key === "ArrowRight") f.querySelectorAll(".card-arrow")[1]?.click();
    else if (e.key === "ArrowLeft") f.querySelectorAll(".card-arrow")[0]?.click();
    else if (e.key === " " && e.target === document.body) {
      e.preventDefault();
      f.querySelector(".card-center .primary")?.click();
    }
  });
  window.addEventListener("ld-open-level", () => data && profileForm());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && active && !document.querySelector("dialog[open]")) load();
  });
  setInterval(() => {
    if (active && !document.hidden && !document.querySelector("dialog[open]")) load();
  }, 60000);
  toggle(true);
});
