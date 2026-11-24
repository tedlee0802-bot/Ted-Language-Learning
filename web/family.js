// Family profiles, PIN sign-in, settings and app installation.
// Runs before app.js and homework.js and exposes window.LD for them.
(() => {
  const $ = (s) => document.querySelector(s);
  const E = (tag, cls = "", text = "") => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };
  const LAST = "ld-last-user";
  let resolveReady;
  const LD = (window.LD = {
    enabled: false,
    user: null,
    profiles: [],
    storageKey: "lingodaily-v1",
    quizPrefix: "lisa-quiz",
    ready: new Promise((r) => (resolveReady = r)),
    api,
    showGate,
    openSettings,
    openInstall,
  });

  async function api(path, body) {
    let r;
    try {
      r = await fetch(path, {
        credentials: "same-origin",
        ...(body
          ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
    } catch {
      throw Error("인터넷 연결을 확인한 뒤 다시 시도해주세요.");
    }
    let v = {};
    try {
      v = await r.json();
    } catch {}
    if (r.status === 401 && v.auth) {
      showGate();
      throw Error(v.error || "다시 로그인해주세요.");
    }
    if (!r.ok) throw Error(v.error || "요청을 처리하지 못했습니다.");
    return v;
  }

  function setUser(user) {
    LD.user = user;
    // The owner (and the single-user mode) keep the original browser storage keys.
    const own = !user || user.owner;
    LD.storageKey = own ? "lingodaily-v1" : "lingodaily-v1:" + user.id;
    LD.quizPrefix = own ? "lisa-quiz" : "lisa-quiz:" + user.id;
    const initial = user ? [...user.name][0] : "나";
    $("#meInitial").textContent = initial;
    $("#meInitial").style.background = user?.color || "";
    $("#meName").textContent = user ? user.name : "";
    $("#meBtn").setAttribute("aria-label", user ? user.name + " · 프로필과 설정" : "설정");
  }

  async function boot() {
    let state;
    try {
      state = await api("/api/auth/state");
      try {
        localStorage.setItem(LAST, JSON.stringify(state.me || null));
      } catch {}
    } catch {
      // Offline: continue as the last person who used this device so their local records are used.
      let last = null;
      try {
        last = JSON.parse(localStorage.getItem(LAST));
      } catch {}
      setUser(last);
      resolveReady();
      return;
    }
    LD.enabled = state.enabled;
    LD.profiles = state.profiles;
    if (state.enabled && !state.me) {
      setUser(null);
      showGate();
      return; // ready resolves after sign-in (the page reloads).
    }
    setUser(state.me);
    resolveReady();
  }

  // ---------------------------------------------------------------- gate
  function avatar(p, big) {
    const a = E("b", "avatar" + (big ? " big" : ""), [...p.name][0]);
    a.style.background = p.color;
    return a;
  }
  function showGate(selected) {
    const gate = $("#gate");
    document.body.classList.add("locked");
    gate.hidden = false;
    gate.replaceChildren();
    const box = E("div", "gate-box");
    box.append(E("div", "gate-mark", "◈"), E("p", "wordmark", "lingo daily"));
    if (!LD.profiles.length) {
      box.append(E("h1", "", "프로필을 불러오는 중…"));
      gate.append(box);
      api("/api/auth/state")
        .then((s) => {
          LD.profiles = s.profiles;
          showGate(selected);
        })
        .catch((e) => (box.lastChild.textContent = e.message));
      return;
    }
    const p = LD.profiles.find((x) => x.id === selected);
    if (!p) {
      box.append(E("h1", "", "누가 공부할까요?"), E("p", "sub", "내 프로필을 고르고 PIN을 입력하세요."));
      const list = E("div", "gate-profiles");
      for (const x of LD.profiles) {
        const b = E("button", "gate-profile");
        b.type = "button";
        b.append(avatar(x, true), E("span", "", x.name));
        b.onclick = () => showGate(x.id);
        list.append(b);
      }
      box.append(list);
    } else {
      const form = E("form", "gate-pin");
      const who = E("div", "gate-who");
      who.append(avatar(p, true), E("strong", "", p.name));
      const input = E("input");
      Object.assign(input, {
        type: "password",
        inputMode: "numeric",
        autocomplete: "current-password",
        maxLength: 8,
        required: true,
      });
      input.pattern = "[0-9]{4,8}";
      input.setAttribute("aria-label", p.name + " PIN");
      input.placeholder = "PIN 4~8자리";
      const err = E("p", "gate-error");
      err.setAttribute("role", "alert");
      const go = E("button", "primary", "들어가기");
      go.type = "submit";
      const back = E("button", "link", "다른 사람 선택");
      back.type = "button";
      back.onclick = () => showGate();
      form.append(who, input, go, err, back);
      form.onsubmit = async (e) => {
        e.preventDefault();
        go.disabled = true;
        err.textContent = "";
        try {
          await api("/api/auth/login", { id: p.id, pin: input.value });
          location.reload();
        } catch (x) {
          err.textContent = x.message;
          input.value = "";
          input.focus();
          go.disabled = false;
        }
      };
      box.append(form);
      setTimeout(() => input.focus(), 50);
    }
    gate.append(box);
  }

  // ---------------------------------------------------------------- sheets
  function sheet(title) {
    $("#ld-sheet")?.remove();
    const d = E("dialog", "sheet");
    d.id = "ld-sheet";
    const head = E("div", "sheet-head");
    const close = E("button", "icon-btn", "✕");
    close.type = "button";
    close.setAttribute("aria-label", "닫기");
    close.onclick = () => d.close();
    head.append(E("h2", "", title), close);
    d.append(head);
    d.addEventListener("close", () => d.remove());
    document.body.append(d);
    return d;
  }
  function field(label, attrs) {
    const wrap = E("label", "field");
    wrap.append(E("span", "", label));
    const input = E("input");
    Object.assign(input, attrs);
    wrap.append(input);
    return [wrap, input];
  }
  function pinField(label, name) {
    return field(label, {
      name,
      type: "password",
      inputMode: "numeric",
      pattern: "[0-9]{4,8}",
      maxLength: 8,
      required: true,
      autocomplete: "new-password",
    });
  }
  function formWith(d, rows, submitLabel, onSubmit) {
    const form = E("form", "sheet-form");
    rows.forEach((r) => form.append(r));
    const err = E("p", "form-error");
    err.setAttribute("role", "alert");
    const ok = E("button", "primary", submitLabel);
    ok.type = "submit";
    form.append(err, ok);
    form.onsubmit = async (e) => {
      e.preventDefault();
      err.textContent = "";
      ok.disabled = true;
      try {
        await onSubmit(Object.fromEntries(new FormData(form)));
      } catch (x) {
        err.textContent = x.message;
      } finally {
        ok.disabled = false;
      }
    };
    d.append(form);
    return form;
  }
  function section(d, title, note) {
    const s = E("section", "sheet-section");
    s.append(E("h3", "", title));
    if (note) s.append(E("p", "sub", note));
    d.append(s);
    return s;
  }
  function action(label, fn, cls = "") {
    const b = E("button", cls, label);
    b.type = "button";
    b.onclick = fn;
    return b;
  }

  function openSettings() {
    const d = sheet("설정");
    const me = LD.user;
    if (LD.enabled && me) {
      const s = section(d, "내 프로필");
      const row = E("div", "me-row");
      row.append(avatar(me), E("strong", "", me.name + (me.owner ? " · 관리자" : "")));
      s.append(row);
      const btns = E("div", "btn-row");
      btns.append(
        action("다른 사람으로 전환", async () => {
          await api("/api/auth/logout", {}).catch(() => {});
          location.reload();
        }),
        action("내 PIN 바꾸기", () => changeOwnPin()),
      );
      s.append(btns);
    }
    if (LD.enabled && me?.owner) familySection(d);
    if (!LD.enabled) {
      const s = section(
        d,
        "가족과 함께 쓰기",
        "지금은 한 사람용으로 동작합니다. 내 프로필과 PIN을 만들면 가족을 추가할 수 있고, 가족은 각자 PIN으로 들어와 자기 진도와 시험 기록을 따로 가집니다. 지금까지의 기록은 내 프로필에 그대로 남습니다.",
      );
      s.append(action("내 프로필 만들기", () => setupOwner(), "primary"));
    }
    const app = section(d, "휴대폰 앱", "홈 화면에 설치하면 앱처럼 바로 열 수 있습니다.");
    app.append(action("앱 설치 방법", () => openInstall(), "primary"));
    const lv = section(
      d,
      "학습 레벨",
      "영어·중국어마다 기초·중급·고급 중 내 수준의 수업을 받습니다. 레벨 테스트로 추천을 받을 수도 있어요.",
    );
    lv.append(
      action("레벨 테스트 · 레벨 고르기", () => {
        d.close();
        window.dispatchEvent(new Event("ld-open-level"));
      }),
    );
    d.showModal();
  }

  function familySection(d) {
    const s = section(d, "가족 관리", "같은 수업을 보고, 진도와 시험 기록은 사람마다 따로 저장됩니다.");
    const list = E("div", "family-list");
    for (const p of LD.profiles) {
      const row = E("div", "family-row");
      row.append(avatar(p), E("strong", "", p.name + (p.owner ? " · 관리자" : "")));
      const tools = E("div", "btn-row");
      if (!p.owner) {
        tools.append(
          action("PIN 재설정", () => resetPin(p)),
          action("이름", () => rename(p)),
          action("삭제", async () => {
            if (
              !confirm(
                p.name + " 프로필을 삭제할까요? 학습 기록은 서버에 남지만 이 프로필로는 더 이상 들어올 수 없습니다.",
              )
            )
              return;
            await api("/api/auth/remove", { id: p.id });
            await refreshProfiles();
            openSettings();
          }),
        );
      }
      row.append(tools);
      list.append(row);
    }
    s.append(list);
    s.append(
      action(
        "＋ 가족 추가",
        () => {
          const a = sheet("가족 추가");
          a.append(
            E("p", "sub", "이름과 PIN을 정해 가족에게 알려주세요. PIN은 숫자 4~8자리이며, 6자리 이상을 권장합니다."),
          );
          const [n] = field("이름", { name: "name", required: true, maxLength: 20, autocomplete: "off" });
          const [p1] = pinField("PIN", "pin");
          const [p2] = pinField("PIN 확인", "pin2");
          formWith(a, [n, p1, p2], "추가하기", async (v) => {
            if (v.pin !== v.pin2) throw Error("PIN 확인이 일치하지 않습니다.");
            await api("/api/auth/profiles", { name: v.name, pin: v.pin });
            await refreshProfiles();
            a.close();
            openSettings();
          });
          a.showModal();
        },
        "primary",
      ),
    );
  }
  async function refreshProfiles() {
    const s = await api("/api/auth/state");
    LD.profiles = s.profiles;
  }
  function setupOwner() {
    const a = sheet("내 프로필 만들기");
    a.append(
      E(
        "p",
        "sub",
        "이 프로필이 관리자가 됩니다. 가족 추가·PIN 재설정은 관리자만 할 수 있습니다. 지금까지의 숙제와 시험 기록은 이 프로필에 그대로 남습니다.",
      ),
    );
    const [n] = field("이름", { name: "name", required: true, maxLength: 20, autocomplete: "nickname" });
    const [p1] = pinField("PIN (숫자 4~8자리)", "pin");
    const [p2] = pinField("PIN 확인", "pin2");
    formWith(a, [n, p1, p2], "만들기", async (v) => {
      if (v.pin !== v.pin2) throw Error("PIN 확인이 일치하지 않습니다.");
      await api("/api/auth/setup", { name: v.name, pin: v.pin });
      location.reload();
    });
    a.showModal();
  }
  function changeOwnPin() {
    const a = sheet("내 PIN 바꾸기");
    const [c] = pinField("현재 PIN", "current");
    c.querySelector("input").autocomplete = "current-password";
    const [p1] = pinField("새 PIN", "pin");
    const [p2] = pinField("새 PIN 확인", "pin2");
    formWith(a, [c, p1, p2], "바꾸기", async (v) => {
      if (v.pin !== v.pin2) throw Error("새 PIN 확인이 일치하지 않습니다.");
      await api("/api/auth/pin", { current: v.current, pin: v.pin });
      a.close();
      alert("PIN을 바꿨습니다.");
    });
    a.showModal();
  }
  function resetPin(p) {
    const a = sheet(p.name + " PIN 재설정");
    const [p1] = pinField("새 PIN", "pin");
    const [p2] = pinField("새 PIN 확인", "pin2");
    formWith(a, [p1, p2], "재설정", async (v) => {
      if (v.pin !== v.pin2) throw Error("PIN 확인이 일치하지 않습니다.");
      await api("/api/auth/pin", { id: p.id, pin: v.pin });
      a.close();
      alert(p.name + "의 PIN을 바꿨습니다.");
    });
    a.showModal();
  }
  function rename(p) {
    const a = sheet("이름 바꾸기");
    const [n, input] = field("이름", { name: "name", required: true, maxLength: 20 });
    input.value = p.name;
    formWith(a, [n], "저장", async (v) => {
      await api("/api/auth/rename", { id: p.id, name: v.name });
      await refreshProfiles();
      a.close();
      openSettings();
    });
    a.showModal();
  }

  // ---------------------------------------------------------------- install
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function steps(list) {
    const ol = E("ol", "install-steps");
    for (const s of list) ol.append(E("li", "", s));
    return ol;
  }
  function openInstall() {
    const d = sheet("휴대폰에 앱 설치");
    if (standalone()) {
      d.append(E("p", "install-done", "✓ 지금 앱으로 실행 중입니다."));
    } else if (deferredPrompt) {
      d.append(E("p", "sub", "아래 버튼을 누르면 이 기기에 Lingo Daily 앱이 설치됩니다."));
      d.append(
        action(
          "앱 설치하기",
          async () => {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice.catch(() => {});
            deferredPrompt = null;
            d.close();
          },
          "primary wide",
        ),
      );
    }
    if (!standalone()) {
      const ios = section(d, "iPhone · iPad (Safari)");
      ios.append(
        steps([
          "Safari로 이 사이트를 엽니다.",
          "아래쪽 공유 버튼(□↑)을 누릅니다.",
          "'홈 화면에 추가'를 누르고 '추가'를 누릅니다.",
        ]),
      );
      const android = section(d, "Android (Chrome · 삼성 인터넷)");
      android.append(
        steps([
          "Chrome으로 이 사이트를 엽니다.",
          "오른쪽 위 ⋮ 메뉴를 누릅니다.",
          "'앱 설치' 또는 '홈 화면에 추가'를 누릅니다.",
        ]),
      );
      if (isIOS()) ios.classList.add("current");
      else android.classList.add("current");
    }
    const share = section(
      d,
      "앱 다운로드 링크",
      "이 링크를 가족에게 보내면 기기에 맞는 설치 방법이 나옵니다. 컴퓨터에서 열면 휴대폰으로 찍을 QR 코드가 보입니다. 들어올 때는 각자의 PIN을 사용합니다.",
    );
    const url = location.origin + "/install";
    const code = E("code", "share-url", url);
    share.append(code);
    const open = E("a", "", "설치 페이지 열기 (QR 코드) ↗");
    open.href = url;
    open.target = "_blank";
    open.rel = "noopener";
    share.append(open);
    share.append(
      action(
        navigator.share ? "링크 공유" : "링크 복사",
        async () => {
          try {
            if (navigator.share)
              await navigator.share({ title: "Lingo Daily 앱 설치", text: "가족 단어 공부 앱을 설치해 주세요.", url });
            else {
              await navigator.clipboard.writeText(url);
              alert("링크를 복사했습니다.");
            }
          } catch {}
        },
        "",
      ),
    );
    d.showModal();
  }

  // ---------------------------------------------------------------- wiring
  $("#meBtn").onclick = () => openSettings();
  $("#settingsBtn").onclick = () => openSettings();
  $("#topDate").textContent = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
  if ("serviceWorker" in navigator && location.protocol !== "file:")
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  boot();
})();
