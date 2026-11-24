const $ = (s) => document.querySelector(s),
  key = "lingodaily-v1",
  cats = ["VOCA", "GRAMMAR", "READING", "LISTENING", "WRITING", "SPEAKING", "SENTENCE", "IDIOM"],
  names = ["단어 암기", "문법 학습", "읽기 연습", "듣기 연습", "쓰기 연습", "말하기 연습", "문장 학습", "관용 표현"],
  units = ["개", "개", "쪽", "분", "문장", "분", "개", "개"],
  icons = ["Aa", "⌘", "▤", "♫", "✎", "♧", "≡", "✦"];
const localDate = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
let date = localDate(),
  lang = "en",
  view = "daily";
let state;
try {
  state = JSON.parse(localStorage.getItem(key));
} catch {}
let fresh = !state?.languages;
if (fresh)
  state = {
    languages: [
      { id: "en", name: "영어", flag: "🇺🇸" },
      { id: "zh", name: "중국어", flag: "🇨🇳" },
      { id: "es", name: "스페인어", flag: "🇪🇸" },
      { id: "ja", name: "일본어", flag: "🇯🇵" },
    ],
    plans: [],
    records: {},
  };
const initial = (id) =>
  cats.map((c, i) => ({
    id: crypto.randomUUID(),
    lang: id,
    cat: i,
    title: names[i],
    target: [20, 2, 3, 15, 5, 10, 5, 3][i],
    time: ["07:30", "08:00", "12:30", "18:00", "19:00", "19:30", "20:00", "20:30"][i],
    start: date,
    repeat: true,
  }));
if (fresh) state.plans = state.languages.flatMap((l) => initial(l.id));
function save() {
  localStorage.setItem(key, JSON.stringify(state));
}
function plans(d = date) {
  return state.plans
    .filter((p) => p.lang === lang && (p.repeat ? p.start <= d : p.start === d))
    .sort((a, b) => a.time.localeCompare(b.time));
}
function record(p, d = date) {
  return state.records[d]?.[p.id] || { value: 0, minutes: 0 };
}
function percentage(d) {
  let ps = plans(d);
  return ps.length
    ? Math.round((ps.reduce((s, p) => s + Math.min(record(p, d).value / p.target, 1), 0) / ps.length) * 100)
    : 0;
}
function shift(d, n) {
  let v = new Date(d + "T12:00:00+09:00");
  v.setDate(v.getDate() + n);
  return localDate(v);
}
function el(tag, cls, text) {
  let e = document.createElement(tag);
  e.className = cls;
  e.textContent = text;
  return e;
}
function render() {
  save();
  $("#date").value = date;
  $("#languages").replaceChildren(
    ...state.languages.map((l) => {
      let b = el("button", l.id === lang ? "selected" : "", l.flag + " " + l.name);
      b.onclick = () => {
        lang = l.id;
        render();
      };
      return b;
    }),
  );
  let ps = plans(),
    pct = percentage(date),
    done = ps.filter((p) => record(p).value >= p.target).length;
  $("#percent").innerHTML = pct + "<span>%</span>";
  $("#totalbar").style.width = pct + "%";
  $("#completeText").textContent = ps.length
    ? "오늘 목표까지 " + (100 - pct) + "% 남았어요"
    : "학습 계획을 먼저 설정하세요";
  $("#minutes").innerHTML = ps.reduce((s, p) => s + record(p).minutes, 0) + "<span>분</span>";
  $("#done").innerHTML = done + "<span>/ " + ps.length + "</span>";
  let streak = 0,
    d = localDate();
  if (!plans(d).some((p) => record(p, d).value > 0)) d = shift(d, -1);
  while (plans(d).some((p) => record(p, d).value > 0) && streak < 3650) {
    streak++;
    d = shift(d, -1);
  }
  $("#streak").innerHTML = streak + "<span>일</span>";
  let w = $("#warning");
  w.className = pct === 100 ? "good" : "";
  w.textContent = !ps.length
    ? "✦ 아직 학습 계획이 없습니다. 오늘의 목표를 추가해보세요."
    : pct === 100
      ? "✓ 오늘의 목표를 모두 달성했어요. 수고하셨습니다!"
      : "⚠ WARNING · " + (ps.length - done) + "개 항목의 목표량이 부족해요. 남은 학습량을 확인해보세요.";
  $("#taskCount").textContent = done + " / " + ps.length + " 완료";
  $("#tasks").replaceChildren();
  $("#empty").hidden = !!ps.length;
  $("#listTitle").textContent = view === "plan" ? "학습 계획 관리" : "오늘의 학습 체크리스트";
  ps.forEach((p) => {
    let r = record(p),
      row = el("div", "task" + (r.value >= p.target ? " completed" : ""), ""),
      check = el("button", "check", r.value >= p.target ? "✓" : "");
    check.setAttribute("aria-label", p.title + " 완료 전환");
    check.onclick = () => {
      if (r.value >= p.target) {
        setRecord(p, { value: 0, minutes: 0 });
        render();
      } else log(p);
    };
    row.append(check, el("div", "icon", icons[p.cat]));
    let info = el("div", "task-info", "");
    info.append(
      el("div", "task-title", cats[p.cat]),
      el("p", "", p.title + " · " + p.time + (p.repeat ? " · 매일" : "")),
    );
    let track = el("div", "task-progress", ""),
      bar = el("i", "", "");
    bar.style.width = Math.min(100, (r.value / p.target) * 100) + "%";
    track.append(bar);
    info.append(track);
    let amount = el("span", "amount", r.value + " / " + p.target + units[p.cat]);
    let b = el("button", "edit", view === "plan" ? "수정" : "기록");
    b.onclick = () => (view === "plan" ? planForm(p) : log(p));
    row.append(info, amount, b);
    if (view === "plan") {
      let del = el("button", "edit", "삭제");
      del.onclick = () => {
        if (confirm("이 계획과 연결된 학습 기록을 삭제할까요?")) {
          state.plans = state.plans.filter((x) => x.id !== p.id);
          Object.values(state.records).forEach((r) => delete r[p.id]);
          render();
        }
      };
      row.append(del);
    }
    $("#tasks").append(row);
  });
  $("#chart").replaceChildren();
  for (let i = 6; i >= 0; i--) {
    let d = shift(date, -i),
      v = percentage(d),
      col = el("div", "barcol" + (!i ? " current" : ""), "");
    col.append(el("span", "", v + "%"));
    let b = el("div", "bar", "");
    b.style.height = Math.max(3, v * 0.95) + "px";
    col.append(b, el("span", "", d.slice(5).replace("-", "/")));
    $("#chart").append(col);
  }
  $("#scheduleDate").textContent = date.slice(5).replace("-", ".");
  $("#schedule").replaceChildren(
    ...ps.map((p) => {
      let e = el("div", "schedule-item", "");
      e.append(el("time", "", p.time), el("i", "", ""));
      let t = el("div", "", "");
      t.append(el("b", "", p.title), el("small", "", cats[p.cat] + " · 목표 " + p.target + units[p.cat]));
      e.append(t);
      return e;
    }),
  );
  if (!ps.length) $("#schedule").append(el("p", "sub", "예정된 학습이 없습니다."));
  $("#report").hidden = view !== "report";
  $("#reportBody").replaceChildren(
    ...cats.map((c, i) => {
      let ids = state.plans.filter((p) => p.lang === lang && p.cat === i).map((p) => p.id),
        sum = Object.values(state.records).reduce(
          (a, day) => a + ids.reduce((s, id) => s + (day[id]?.value || 0), 0),
          0,
        );
      return el("div", "report-row", c + " — " + sum + units[i]);
    }),
  );
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
}
function setRecord(p, r) {
  state.records[date] ??= {};
  state.records[date][p.id] = r;
}
function field(label, name, type, value, extra = "") {
  return (
    '<label for="f-' +
    name +
    '">' +
    label +
    '</label><input id="f-' +
    name +
    '" name="' +
    name +
    '" type="' +
    type +
    '" value="' +
    value +
    '" ' +
    extra +
    " required>"
  );
}
function modal(title, html, submit) {
  $("#modalTitle").textContent = title;
  $("#fields").innerHTML = html;
  $("#error").textContent = "";
  $("#form").onsubmit = (e) => {
    e.preventDefault();
    try {
      submit(new FormData(e.target));
      $("#modal").close();
      render();
    } catch (e) {
      $("#error").textContent = e.message;
    }
  };
  $("#modal").showModal();
}
function log(p) {
  let r = record(p);
  modal(
    p.title + " 기록",
    field("학습량 (" + units[p.cat] + ")", "value", "number", r.value, 'min="0" max="100000" step="1"') +
      field("실제 학습 시간 (분)", "minutes", "number", r.minutes, 'min="0" max="1440"'),
    (f) => setRecord(p, { value: +f.get("value"), minutes: +f.get("minutes") }),
  );
}
function planForm(p) {
  modal(
    p ? "학습 계획 수정" : "새로운 학습 계획",
    '<label for="f-cat">학습 영역</label><select id="f-cat" name="cat">' +
      cats
        .map(
          (c, i) =>
            '<option value="' + i + '" ' + (p?.cat === i ? "selected" : "") + ">" + c + " · " + names[i] + "</option>",
        )
        .join("") +
      "</select>" +
      field("학습 이름", "title", "text", "", 'maxlength="80"') +
      field("목표량 (선택 영역의 단위)", "target", "number", p?.target || 20, 'min="1" max="100000"') +
      field("시작 날짜", "start", "date", p?.start || date) +
      field("예정 시간", "time", "time", p?.time || "19:00") +
      '<label for="f-repeat">반복</label><select id="f-repeat" name="repeat"><option value="yes">매일</option><option value="no">선택 날짜만</option></select>',
    (f) => {
      let title = f.get("title").trim();
      if (!title) throw Error("학습 이름을 입력해주세요.");
      let v = {
        id: p?.id || crypto.randomUUID(),
        lang,
        cat: +f.get("cat"),
        title,
        target: +f.get("target"),
        start: f.get("start"),
        time: f.get("time"),
        repeat: f.get("repeat") === "yes",
      };
      if (p) Object.assign(p, v);
      else state.plans.push(v);
    },
  );
  $("#f-title").value = p?.title || "";
  $("#f-repeat").value = p && !p.repeat ? "no" : "yes";
}
$("#close").onclick = () => $("#modal").close();
$("#planBtn").onclick = () => planForm();
$("#addLang").onclick = () =>
  modal("새로운 언어 추가", field("언어 이름", "name", "text", "", 'maxlength="25"'), (f) => {
    let name = f.get("name").trim();
    if (!name) throw Error("언어 이름을 입력해주세요.");
    if (state.languages.some((l) => l.name === name)) throw Error("이미 추가된 언어입니다.");
    let id = crypto.randomUUID();
    state.languages.push({ id, name, flag: "🌐" });
    state.plans.push(...initial(id));
    lang = id;
  });
$("#date").onchange = (e) => {
  if (e.target.value) {
    date = e.target.value;
    render();
  }
};
$("#prev").onclick = () => {
  date = shift(date, -1);
  render();
};
$("#next").onclick = () => {
  date = shift(date, 1);
  render();
};
$("#today").onclick = () => {
  date = localDate();
  render();
};
document.querySelectorAll("nav button").forEach(
  (b) =>
    (b.onclick = () => {
      view = b.dataset.view;
      render();
      if (view === "report") $("#report").scrollIntoView({ behavior: "smooth" });
    }),
);
$("#export").onclick = () => {
  let u = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })),
    a = el("a", "", "");
  a.href = u;
  a.download = "lingo-daily-" + localDate() + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$("#import").onchange = async (e) => {
  try {
    let s = JSON.parse(await e.target.files[0].text());
    if (
      !Array.isArray(s.languages) ||
      !s.languages.length ||
      !Array.isArray(s.plans) ||
      !s.records ||
      s.languages.some((l) => typeof l.name !== "string" || typeof l.id !== "string") ||
      s.plans.some(
        (p) =>
          !cats[p.cat] ||
          !Number.isFinite(p.target) ||
          p.target <= 0 ||
          typeof p.title !== "string" ||
          typeof p.time !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(p.start),
      ) ||
      Object.values(s.records).some(
        (day) =>
          !day ||
          typeof day !== "object" ||
          Object.values(day).some(
            (r) => !Number.isFinite(r.value) || r.value < 0 || !Number.isFinite(r.minutes) || r.minutes < 0,
          ),
      )
    )
      throw Error();
    if (confirm("현재 기록을 백업 파일의 내용으로 교체할까요?")) {
      state = s;
      lang = s.languages[0].id;
      render();
    }
  } catch {
    alert("올바른 Lingo Daily 백업 파일을 선택해주세요.");
  }
  e.target.value = "";
};
window.addEventListener("lisa-records-updated", () => {
  try {
    state = JSON.parse(localStorage.getItem(key));
    render();
  } catch {}
});
render();
