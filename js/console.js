(() => {
  "use strict";

  const ACTS = [
    {
      n: 0,
      title: "预演",
      short: "STANDBY",
      kicker: "STANDBY / 预演",
      place: "509 报告厅 · 舞台大屏",
      time: "—",
      tone: "#8e8778",
      soft: "rgba(142,135,120,0.12)",
      cues: [{ label: "开场前 · 片名静置", note: "标题、剧团与观演提示缓慢出现；等第一幕开始。" }],
    },
    {
      n: 1,
      title: "三十七页",
      short: "ACT I",
      kicker: "ACT I / 第一幕",
      place: "1959 · 春 · 杜布纳",
      time: "1:12",
      tone: "#86a6b2",
      soft: "rgba(134,166,178,0.13)",
      cues: [
        { label: "1959 · 春 · 杜布纳", note: "冷场进入，论文在暗处等待。" },
        { label: "论文首页浮现，署名空着", note: "屏幕出现第 37 页，署名处留白。" },
        { label: "写下名字", note: "钢笔落纸，署名完成。" },
        { label: "未拆的家书", note: "纸页退后，信封进入光里。" },
        { label: "灯灭，本幕收", note: "画面沉入黑场，等下一次切幕。" },
      ],
    },
    {
      n: 2,
      title: "消息",
      short: "ACT II",
      kicker: "ACT II / 第二幕",
      place: "1959.6 · 杜布纳",
      time: "1:18",
      tone: "#c19458",
      soft: "rgba(193,148,88,0.12)",
      cues: [
        { label: "1959.6 · 杜布纳", note: "收音机亮起，房间进入黄昏。" },
        { label: "塔斯社电波 · 协定暂停", note: "新闻与波形进入画面。" },
        { label: "暂停援助", note: "四个字压满画面，定格。" },
        { label: "家里都好，勿念。", note: "信纸出现并逐字打出。" },
        { label: "灯暗，本幕收", note: "沉入黑场。" },
      ],
    },
    {
      n: 3,
      title: "一封签了名的信",
      short: "ACT III",
      kicker: "ACT III / 第三幕",
      place: "1960 · 冬 · 杜布纳",
      time: "1:30",
      tone: "#c6a06d",
      soft: "rgba(198,160,109,0.12)",
      cues: [
        { label: "1960 · 冬 · 杜布纳", note: "台灯亮起，联名信在桌面上。" },
        { label: "二十余人的签名", note: "签名逐个落纸。" },
        { label: "决心书逐行打出", note: "信念被写到纸上。" },
        { label: "1961 · 北京", note: "画面切到回国后的北京。" },
        { label: "灯暗，本幕收", note: "沉入黑场。" },
      ],
    },
    {
      n: 4,
      title: "第九次",
      short: "ACT IV",
      kicker: "ACT IV / 第四幕",
      place: "1961 · 冬 · 北京",
      time: "1:54",
      tone: "#a19a7e",
      soft: "rgba(161,154,126,0.11)",
      cues: [
        { label: "1961 · 冬 · 北京", note: "满板算稿，煤炉还亮着。" },
        { label: "第九次，还是对不上", note: "苏方数据被圈出，其他算式退后。" },
        { label: "最大功", note: "只有三个字打在黑板中央。" },
        { label: "擦掉那个数", note: "板擦扫过，粉笔灰落下。" },
        { label: "空白", note: "黑板只剩空白，沉入黑场。" },
      ],
    },
    {
      n: 5,
      title: "署名",
      short: "ACT V",
      kicker: "ACT V / 第五幕",
      place: "1964.10.16 · 北京",
      time: "1:48",
      tone: "#cd8c5b",
      soft: "rgba(205,140,91,0.13)",
      cues: [
        { label: "1964.10.16 15:00", note: "办公室的下午，电话静着。" },
        { label: "罗布泊来电", note: "光从窗外涌进，电话响了。" },
        { label: "号外 · 没有他的名字", note: "报纸展开，署名处留白。" },
        { label: "抽屉里的第 37 页", note: "旧稿纸从抽屉里升起。" },
        { label: "这个，用不上了", note: "抽屉合上，画面沉入黑场。" },
        { label: "周光召 · 1929—2024", note: "谢幕与致敬。" },
      ],
    },
  ];

  const $ = (id) => document.getElementById(id);
  const actList = $("actList");
  const cueList = $("cueList");
  const runlineTrack = $("runlineTrack");
  const openStageBtn = $("openStage");
  const connection = $("connection");
  const connectionLabel = $("connectionLabel");
  const liveDot = $("liveDot");
  const monitorStatus = $("monitorStatus");
  const monitor = $("monitor");
  const monitorActNo = $("monitorActNo");
  const monitorKicker = $("monitorKicker");
  const monitorTitle = $("monitorTitle");
  const monitorPlace = $("monitorPlace");
  const monitorCue = $("monitorCue");
  const monitorCode = $("monitorCode");
  const nextCueLabel = $("nextCueLabel");
  const progressFill = $("progressFill");
  const cuePanelAct = $("cuePanelAct");
  const cuePanelIndex = $("cuePanelIndex");
  const cuePanelTitle = $("cuePanelTitle");
  const prevBtn = $("prevCue");
  const nextBtn = $("nextCue");
  const blackoutBtn = $("blackout");
  const resetBtn = $("resetAct");
  const fullscreenBtn = $("fullscreen");
  const toastEl = $("toast");
  const keyHelp = $("keyHelp");
  const helpToggle = $("helpToggle");

  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("shuming-stage-console") : null;

  let stageWindow = null;
  let status = null;
  let connected = false;
  let lastSeen = 0;
  let selectedAct = 0;
  let toastTimer = null;
  let pingTimer = null;
  let commandSeq = 0;
  let hasOpenedStage = false;

  const actByN = new Map(ACTS.map((a) => [a.n, a]));

  function currentActData() {
    return actByN.get(selectedAct) || ACTS[0];
  }

  function isLive() {
    return connected && status && status.started;
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2300);
  }

  function nextCommandId() {
    commandSeq += 1;
    return `cmd-${Date.now()}-${commandSeq}`;
  }

  function sendCommand(cmd, extra = {}) {
    if (!connected) {
      toast("放映器尚未连接");
      return false;
    }
    const message = Object.assign(
      {
        source: "shuming-console",
        type: "command",
        cmd,
        id: nextCommandId(),
      },
      extra
    );
    let sent = false;
    if (channel) {
      try {
        channel.postMessage(message);
        sent = true;
      } catch (e) {
        /* no broadcast channel */
      }
    }
    if (stageWindow && !stageWindow.closed) {
      try {
        stageWindow.postMessage(message, "*");
        sent = true;
      } catch (e) {
        /* popup may not be ready */
      }
    }
    if (!sent) {
      toast("无法发送到放映器，请重新打开");
      return false;
    }
    return true;
  }

  function openStage() {
    if (stageWindow && !stageWindow.closed) {
      stageWindow.focus();
      sendCommand("ping");
      toast("已聚焦放映窗口");
      return;
    }
    if (connected) {
      toast("放映器已在线，请切换到放映窗口；关闭旧窗口后可在这里重开");
      return;
    }
    const popup = window.open(
      "stage.html",
      "shuming-stage",
      "popup=yes,width=1600,height=900,menubar=no,toolbar=no,location=no,status=no"
    );
    if (!popup) {
      toast("浏览器阻止了弹窗，请手动打开 stage.html");
      return;
    }
    stageWindow = popup;
    hasOpenedStage = true;
    openStageBtn.innerHTML = "聚焦放映器 <span>↗</span>";
    toast("放映器已打开 · 点击放映画面或按 F 进入全屏");
    setTimeout(() => {
      if (stageWindow && !stageWindow.closed) {
        try {
          stageWindow.postMessage({ source: "shuming-console", type: "command", cmd: "ping" }, "*");
        } catch (e) {
          /* ignore */
        }
      }
    }, 1100);
  }

  function applyStatus(data) {
    if (!data || data.source !== "shuming-stage") return;
    if (!data.started && !data.introHidden && data.activeAct < 0) {
      // Intro / pre-show announcement from the stage still proves a live link.
    }
    if (!data.started && !data.introHidden) {
      status = status || {};
      status.started = false;
      status.activeAct = -1;
      status.activeCue = 0;
      status.totalCues = 0;
      status.actTitle = "待机";
      status.cueLabel = "";
      status.cues = [];
      status.blackout = false;
      status.readyCount = data.readyCount || 0;
      status.total = data.total || 6;
      status.introHidden = false;
    } else {
      status = data;
    }
    connected = true;
    lastSeen = Date.now();
    if (data.started && Number.isFinite(data.activeAct) && data.activeAct >= 0) {
      selectedAct = data.activeAct;
    } else if (!data.started) {
      selectedAct = 0;
    }
    updateConnectionUI();
    render();
  }

  function updateConnectionUI() {
    const on = connected;
    connection.classList.toggle("is-online", on);
    connectionLabel.textContent = on ? "放映器已连接" : "放映器未连接";
    liveDot.parentElement.classList.toggle("is-live", Boolean(on && status && status.started));
    if (!on) {
      monitorStatus.textContent = "等待放映器连接";
    } else if (!status || !status.started) {
      monitorStatus.textContent = "已连接 · 等待画面";
    } else if (status.blackout) {
      monitorStatus.textContent = "黑场中 · 画面被遮盖";
    } else {
      monitorStatus.textContent = "画面正在播出";
    }
    openStageBtn.innerHTML = on
      ? hasOpenedStage
        ? "聚焦放映器 <span>↗</span>"
        : "放映器在线 <span>·</span>"
      : "打开放映器 <span>↗</span>";
  }

  function renderActList() {
    actList.innerHTML = "";
    ACTS.forEach((act) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "act-card";
      btn.dataset.act = String(act.n);
      btn.setAttribute("aria-label", `${act.n === 0 ? "预演" : `第${act.n}幕 ${act.title}`}`);
      const liveAct = status && status.started && status.activeAct === act.n;
      if (selectedAct === act.n) btn.classList.add("is-active");
      if (liveAct) btn.classList.add("is-live");
      btn.innerHTML = `
        <span class="act-live"></span>
        <span class="act-no">${String(act.n).padStart(2, "0")}</span>
        <span class="act-copy">
          <span class="act-name">${act.title}</span>
          <span class="act-sub">${act.short} · ${act.place}</span>
        </span>
        <span class="act-time">${act.time}</span>
      `;
      btn.addEventListener("click", () => chooseAct(act.n));
      actList.appendChild(btn);
    });
  }

  function renderRunline() {
    const activeAct = isLive() ? status.activeAct : -1;
    const cue = isLive() ? Math.max(0, status.activeCue || 0) : 0;
    const totalCues = isLive() ? Math.max(1, status.totalCues || 1) : 1;
    runlineTrack.innerHTML = "";
    ACTS.forEach((act) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "runline-step";
      btn.dataset.act = String(act.n);
      btn.setAttribute("aria-label", `跳转到第${act.n}幕`);
      const fill = document.createElement("span");
      fill.className = "step-fill";
      btn.appendChild(fill);
      if (activeAct >= 0) {
        if (act.n < activeAct) {
          btn.classList.add("is-past");
          fill.style.width = "100%";
        } else if (act.n === activeAct) {
          btn.classList.add("is-active");
          fill.style.width = `${Math.round(((cue + 1) / totalCues) * 100)}%`;
        }
      } else if (selectedAct === act.n) {
        btn.classList.add("is-active");
        fill.style.width = "0%";
      }
      btn.addEventListener("click", () => chooseAct(act.n));
      runlineTrack.appendChild(btn);
    });

    const labels = document.createElement("div");
    labels.className = "runline-labels";
    ACTS.forEach((act) => {
      const span = document.createElement("span");
      span.textContent = `${String(act.n).padStart(2, "0")} ${act.short}`;
      labels.appendChild(span);
    });
    const existing = runlineTrack.parentElement.querySelector(".runline-labels");
    if (existing) existing.remove();
    runlineTrack.after(labels);
  }

  function renderCueList() {
    const act = currentActData();
    const live = isLive() && status.activeAct === selectedAct;
    const cueIndex = live ? Math.max(0, status.activeCue || 0) : -1;
    cuePanelAct.textContent = `${String(act.n).padStart(2, "0")} / ${act.title}`;
    cueList.innerHTML = "";
    act.cues.forEach((cue, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cue-item";
      btn.dataset.cue = String(index);
      if (live && index === cueIndex) btn.classList.add("is-active");
      btn.innerHTML = `
        <span class="cue-num">${String(index + 1).padStart(2, "0")}</span>
        <span class="cue-copy">
          <strong>${cue.label}</strong>
          <small>${cue.note}</small>
        </span>
      `;
      btn.addEventListener("click", () => gotoSelectedCue(index));
      cueList.appendChild(btn);
    });
    const current = live ? act.cues[cueIndex] : act.cues[0];
    cuePanelIndex.textContent = `${live ? String(cueIndex + 1).padStart(2, "0") : "—"} / ${String(act.cues.length).padStart(2, "0")}`;
    cuePanelTitle.textContent = current ? current.label : "场景待机";
    const activeItem = cueList.querySelector(".is-active");
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }

  function renderMonitor() {
    const act = currentActData();
    const live = isLive();
    const actNumber = live ? status.activeAct : selectedAct;
    const displayAct = actByN.get(actNumber) || act;
    const cueCount = live ? status.totalCues : displayAct.cues.length;
    const cueIndex = live ? Math.max(0, status.activeCue || 0) : -1;
    const cue = live ? displayAct.cues[Math.min(cueIndex, displayAct.cues.length - 1)] : displayAct.cues[0];
    const nextCue =
      live && cueIndex + 1 < displayAct.cues.length
        ? displayAct.cues[cueIndex + 1].label
        : live
          ? "本幕结束"
          : "等待放映器连接";

    monitor.style.setProperty("--tone", displayAct.tone);
    monitor.style.setProperty("--tone-soft", displayAct.soft);
    monitorActNo.textContent = String(displayAct.n).padStart(2, "0");
    monitorKicker.textContent = displayAct.kicker;
    monitorTitle.textContent = displayAct.title;
    monitorPlace.textContent = displayAct.place;
    monitorCode.textContent = live
      ? `CUE ${String(cueIndex + 1).padStart(2, "0")} / ${String(cueCount).padStart(2, "0")}`
      : "CUE — / —";
    monitorCue.innerHTML = `<span class="monitor-cue-index">${live ? String(cueIndex + 1).padStart(2, "0") : "—"}</span><span class="monitor-cue-label">${
      live ? cue.label : "等待开始"
    }</span>`;
    nextCueLabel.textContent = nextCue;
    progressFill.style.width = live && cueCount > 0 ? `${Math.round(((cueIndex + 1) / cueCount) * 100)}%` : "0%";

    updateConnectionUI();
    updateTransportState();
  }

  function updateTransportState() {
    const live = isLive();
    [prevBtn, nextBtn, resetBtn].forEach((btn) => {
      btn.disabled = !live;
    });
    blackoutBtn.disabled = !live;
    fullscreenBtn.disabled = !connected;
    prevBtn.classList.toggle("is-on", Boolean(status && status.blackout));
    blackoutBtn.classList.toggle("is-on", Boolean(status && status.blackout));
  }

  function render() {
    renderActList();
    renderRunline();
    renderCueList();
    renderMonitor();
  }

  function chooseAct(n) {
    const act = actByN.get(n);
    if (!act) return;
    selectedAct = n;
    render();
    if (!connected) {
      toast("请先打开放映器");
      return;
    }
    if (!status || !status.started) {
      toast("放映器正在准备画面，请稍候");
      return;
    }
    sendCommand("switch", { act: n, cue: 0 });
  }

  function gotoSelectedCue(index) {
    if (!connected) {
      toast("请先打开放映器");
      return;
    }
    if (!status || !status.started) {
      toast("放映器正在准备画面，请稍候");
      return;
    }
    if (status.activeAct === selectedAct) {
      sendCommand("cue", { act: selectedAct, cue: index });
    } else {
      sendCommand("switch", { act: selectedAct, cue: index });
    }
  }

  function handleKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag && /INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const code = event.code;
    const digit = code.match(/^(?:Digit|Numpad)([0-5])$/);
    if (digit) {
      event.preventDefault();
      chooseAct(Number(digit[1]));
      return;
    }
    switch (code) {
      case "Space":
      case "ArrowRight":
      case "PageDown":
      case "Enter":
        event.preventDefault();
        if (isLive()) sendCommand("next");
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        if (isLive()) sendCommand("prev");
        break;
      case "KeyB":
        event.preventDefault();
        if (isLive()) sendCommand("blackout", { value: !status.blackout });
        break;
      case "KeyR":
        event.preventDefault();
        if (isLive()) sendCommand("reset");
        break;
      case "KeyF":
        event.preventDefault();
        if (connected) {
          sendCommand("fullscreen");
          toast("若浏览器拦截全屏，请在放映窗口按 F");
        }
        break;
      default:
        break;
    }
  }

  function pingStage() {
    if (!channel && (!stageWindow || stageWindow.closed)) return;
    const message = {
      source: "shuming-console",
      type: "command",
      cmd: "ping",
      id: nextCommandId(),
    };
    if (channel) {
      try {
        channel.postMessage(message);
      } catch (e) {
        /* ignore */
      }
    }
    if (stageWindow && !stageWindow.closed) {
      try {
        stageWindow.postMessage(message, "*");
      } catch (e) {
        /* ignore */
      }
    }
  }

  function connectionWatchdog() {
    if (!connected) return;
    if (Date.now() - lastSeen > 5800) {
      connected = false;
      status = null;
      updateConnectionUI();
      render();
      renderActList();
    }
    if (stageWindow && stageWindow.closed) {
      stageWindow = null;
    }
  }

  /* ---------- events ---------- */

  openStageBtn.addEventListener("click", openStage);
  prevBtn.addEventListener("click", () => isLive() && sendCommand("prev"));
  nextBtn.addEventListener("click", () => isLive() && sendCommand("next"));
  resetBtn.addEventListener("click", () => {
    if (!isLive()) return;
    sendCommand("reset");
    toast("已重播当前幕");
  });
  blackoutBtn.addEventListener("click", () => {
    if (!isLive()) return;
    sendCommand("blackout", { value: !status.blackout });
  });
  fullscreenBtn.addEventListener("click", () => {
    if (!connected) return;
    sendCommand("fullscreen");
    toast("若浏览器拦截全屏，请在放映窗口按 F");
  });
  helpToggle.addEventListener("click", () => {
    keyHelp.hidden = !keyHelp.hidden;
    helpToggle.classList.toggle("nudge", !keyHelp.hidden);
  });
  window.addEventListener("keydown", handleKey);

  if (channel) {
    channel.addEventListener("message", (event) => {
      const data = event.data;
      if (data && data.source === "shuming-stage") {
        if (data.type === "status") applyStatus(data);
      }
    });
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (data && data.source === "shuming-stage") {
      if (data.type === "status") applyStatus(data);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && channel && connected) sendCommand("ping");
  });

  setInterval(() => {
    const clock = document.getElementById("clock");
    const d = new Date();
    clock.textContent = d.toLocaleTimeString("zh-CN", { hour12: false });
  }, 1000);

  setInterval(pingStage, 2600);
  setInterval(connectionWatchdog, 1500);

  const clock = document.getElementById("clock");
  clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });

  render();
  updateConnectionUI();

  if (channel) {
    // Ask any already-open stage to announce itself.
    setTimeout(() => {
      if (channel) {
        try {
          channel.postMessage({ source: "shuming-console", type: "command", cmd: "ping" });
        } catch (e) {
          /* ignore */
        }
      }
    }, 450);
  }

  window.addEventListener("beforeunload", () => {
    if (channel) channel.close();
  });
})();
