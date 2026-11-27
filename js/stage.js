(() => {
  "use strict";

  const CHILD_CHANNEL = "shuming-stage";
  const CONTROL_CHANNEL = "shuming-stage-control";
  const CONSOLE_CHANNEL = "shuming-stage-console";
  const params = new URLSearchParams(location.search);
  const skipIntro = params.get("skipintro") === "1";
  const setupMode = params.get("setup") === "1";
  const autoStart = !setupMode;
  // The projection surface must stay clean by default. A tiny operator HUD can
  // still be enabled explicitly with ?hud=1 for stage-only rehearsal.
  const hudDisabled = params.get("hud") !== "1";
  const requestedAct = Number.parseInt(params.get("act") || "0", 10);
  const requestedCue = Number.parseInt(params.get("cue") || "0", 10);

  const frames = Array.from(document.querySelectorAll(".scene-frame"));
  const intro = document.getElementById("intro");
  const projector = document.getElementById("projector");
  const startButton = document.getElementById("startButton");
  const startLabel = document.getElementById("startLabel");
  const loadStatus = document.getElementById("loadStatus");
  const loadingLine = document.getElementById("loadingLine");
  const veil = document.getElementById("transitionVeil");
  const blackoutVeil = document.getElementById("blackoutVeil");
  const hud = document.getElementById("hud");
  const hudAct = document.getElementById("hudAct");
  const hudCue = document.getElementById("hudCue");
  const hudHint = document.getElementById("hudHint");

  const total = frames.length;
  const meta = new Map();
  frames.forEach((frame, i) => {
    meta.set(i, {
      act: Number(frame.dataset.act),
      title: frame.dataset.title,
      ready: false,
      cues: [],
      cueIndex: -1,
      cueLabel: "",
      totalCues: 0,
    });
  });

  const state = {
    started: false,
    activeAct: -1,
    activeCue: -1,
    actTitle: "",
    cueLabel: "",
    totalCues: 0,
    blackout: false,
    readyCount: 0,
    switching: false,
    pending: null,
    introHidden: false,
    blackoutAnnouncement: "",
  };

  const seenConsoleCommands = new Set();
  let hudTimer = null;
  let idleTimer = null;
  let switchTimer = null;
  let pendingTimer = null;
  let startFallbackTimer = null;

  const consoleChannel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CONSOLE_CHANNEL) : null;

  function clampAct(n) {
    return Math.min(5, Math.max(0, Number.isFinite(n) ? n : 0));
  }

  function frameFor(act) {
    return frames.find((f) => Number(f.dataset.act) === act);
  }

  function sendToAct(act, type, payload = {}) {
    const frame = frameFor(act);
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(
        Object.assign({ channel: CONTROL_CHANNEL, type }, payload),
        "*"
      );
    } catch (e) {
      /* if the frame is still booting */
    }
  }

  function currentMeta() {
    return meta.get(state.activeAct) || null;
  }

  function updateHud() {
    const m = currentMeta();
    const actIndex = state.activeAct >= 0 ? String(state.activeAct).padStart(2, "0") : "—";
    hudAct.textContent = `${actIndex} / ${m ? m.title : "待机"}`;
    if (m && m.totalCues > 0) {
      const n = Math.max(0, m.cueIndex);
      const label = m.cueLabel || (m.cues[n] && m.cues[n].label) || "";
      hudCue.textContent = `CUE ${String(n + 1).padStart(2, "0")} / ${String(
        m.totalCues
      ).padStart(2, "0")}${label ? " · " + label : ""}`;
    } else {
      hudCue.textContent = "CUE — / —";
    }
    hudHint.textContent = state.blackout
      ? "BLACKOUT · 按 B 恢复 · 1–5 仍可预切换"
      : "SPACE 下一提示 · 1–5 切幕 · B 黑场 · F 全屏 · R 重播";
  }

  function showHud(ms = 1900) {
    if (hudDisabled || !state.started) return;
    updateHud();
    hud.classList.add("is-visible");
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => hud.classList.remove("is-visible"), ms);
  }

  function hideHud() {
    hud.classList.remove("is-visible");
  }

  function updateLoadStatus() {
    const ready = state.readyCount;
    const pct = Math.round((ready / total) * 100);
    loadingLine.style.width = `${pct}%`;
    if (ready >= total) {
      loadStatus.textContent = "场景已就绪 · 6 / 6";
      startButton.disabled = false;
      startButton.classList.add("is-ready");
      startLabel.textContent = "开始放映";
    } else {
      loadStatus.textContent = `预载场景 · ${ready} / ${total}`;
      if (state.readyCount > 0) {
        startLabel.textContent = "正在预载";
      }
    }
  }

  function enableStartFallback() {
    if (state.started) return;
    startButton.disabled = false;
    startButton.classList.add("is-ready");
    startLabel.textContent = "开始放映";
    if (state.readyCount < total) {
      loadStatus.textContent = `场景将按需加载 · ${state.readyCount} / ${total}`;
    }
  }

  function hideIntro() {
    if (state.introHidden) return;
    state.introHidden = true;
    intro.classList.add("is-hidden");
    intro.hidden = true;
    if (startButton) startButton.blur();
    document.body.style.cursor = "default";
    resetIdleCursor();
  }

  function startShow(act = 0, cue = 0) {
    if (state.started) return;
    state.started = true;
    hideIntro();
    attemptFullscreen();
    activateAct(clampAct(act), Math.max(0, cue), { immediate: true });
    postConsoleStatus();
  }

  function startProjection(act = 0, cue = 0) {
    if (state.started) return;
    state.started = true;
    hideIntro();
    activateAct(clampAct(act), Math.max(0, cue), { immediate: true });
    postConsoleStatus();
  }

  function attemptFullscreen() {
    if (document.fullscreenElement) return;
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  function activateAct(act, cue, options = {}) {
    const previous = state.activeAct;
    if (previous >= 0) {
      const prevFrame = frameFor(previous);
      if (prevFrame) prevFrame.classList.remove("is-active");
      sendToAct(previous, "deactivate");
    }

    const frame = frameFor(act);
    if (!frame) return;
    frames.forEach((f) => f.classList.remove("is-active"));
    frame.classList.add("is-active");
    state.activeAct = act;
    state.activeCue = cue;
    const m = meta.get(act);
    state.actTitle = m ? m.title : "";
    state.totalCues = m ? m.totalCues : 0;
    state.cueLabel = m && m.cues[cue] ? m.cues[cue].label : "";
    if (m) {
      m.cueIndex = cue;
      m.cueLabel = state.cueLabel;
    }
    updateHud();
    sendToAct(act, "activate", { cue });

    if (!options.immediate) {
      setTimeout(() => {
        showHud(1600);
      }, 300);
    }
    postConsoleStatus();
    resetIdleCursor();
  }

  function switchAct(act, cue = 0) {
    if (!state.started) {
      if (!startButton.disabled) startShow(act, cue);
      return;
    }
    const target = clampAct(act);
    if (target === state.activeAct) {
      showHud(900);
      return;
    }
    if (state.switching) {
      state.pending = { act: target, cue: Math.max(0, cue) };
      updateHud();
      return;
    }

    state.switching = true;
    state.pending = null;
    veil.classList.add("is-on");
    clearTimeout(switchTimer);
    clearTimeout(pendingTimer);
    switchTimer = setTimeout(() => {
      activateAct(target, Math.max(0, cue));
      pendingTimer = setTimeout(() => {
        veil.classList.remove("is-on");
      }, 90);
      setTimeout(() => {
        state.switching = false;
        if (state.pending) {
          const next = state.pending;
          state.pending = null;
          switchAct(next.act, next.cue);
        }
      }, 860);
    }, 280);
  }

  function nextCue() {
    if (!state.started) return;
    showHud();
    sendToAct(state.activeAct, "next");
  }

  function prevCue() {
    if (!state.started) return;
    showHud();
    sendToAct(state.activeAct, "prev");
  }

  function resetAct() {
    if (!state.started) return;
    showHud();
    sendToAct(state.activeAct, "reset");
    const m = currentMeta();
    if (m) {
      m.cueIndex = 0;
      m.cueLabel = m.cues[0] ? m.cues[0].label : "";
    }
    updateHud();
    postConsoleStatus();
  }

  function toggleBlackout(value) {
    if (!state.started) return;
    state.blackout = typeof value === "boolean" ? value : !state.blackout;
    blackoutVeil.classList.toggle("is-on", state.blackout);
    showHud(1600);
    postConsoleStatus();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      attemptFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function postConsoleStatus() {
    if (!consoleChannel) return;
    const m = currentMeta();
    const payload = {
      source: "shuming-stage",
      type: "status",
      started: state.started,
      introHidden: state.introHidden,
      activeAct: state.activeAct,
      activeCue: m && m.cueIndex >= 0 ? m.cueIndex : 0,
      totalCues: m ? m.totalCues : 0,
      actTitle: m ? m.title : "待机",
      cueLabel: m && m.cueLabel ? m.cueLabel : "",
      cues: m ? m.cues : [],
      blackout: state.blackout,
      readyCount: state.readyCount,
      total,
    };
    try {
      consoleChannel.postMessage(payload);
    } catch (e) {
      /* console not open */
    }
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, "*");
      }
    } catch (e) {
      /* cross-window fallback unavailable */
    }
  }

  function handleKeyCode(code, event) {
    if (!state.started) {
      if (code === "Space" || code === "Enter" || code === "NumpadEnter") {
        event && event.preventDefault();
        if (!startButton.disabled) startShow(requestedAct, requestedCue);
      }
      return;
    }

    const digit = code.match(/^(?:Digit|Numpad)([0-5])$/);
    if (digit) {
      event && event.preventDefault();
      switchAct(Number(digit[1]), 0);
      return;
    }

    switch (code) {
      case "Space":
      case "ArrowRight":
      case "PageDown":
      case "Enter":
      case "NumpadEnter":
        event && event.preventDefault();
        nextCue();
        break;
      case "ArrowLeft":
      case "PageUp":
      case "Backspace":
        event && event.preventDefault();
        prevCue();
        break;
      case "KeyB":
        event && event.preventDefault();
        toggleBlackout();
        break;
      case "KeyR":
        event && event.preventDefault();
        resetAct();
        break;
      case "KeyF":
        event && event.preventDefault();
        toggleFullscreen();
        break;
      case "KeyH":
        event && event.preventDefault();
        if (state.blackout) toggleBlackout(false);
        showHud(2400);
        break;
      case "Escape":
        hideHud();
        break;
      default:
        break;
    }
  }

  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    handleKeyCode(event.code, event);
  }

  /* ---------- messaging ---------- */

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;

    if (data.channel === CHILD_CHANNEL) {
      const act = Number(data.act);
      if (!Number.isFinite(act) || act < 0 || act > 5) return;
      const m = meta.get(act);
      if (!m) return;

      if (data.type === "scene-ready") {
        const wasReady = m.ready;
        if (!wasReady) {
          m.ready = true;
          state.readyCount += 1;
        }
        m.totalCues = data.totalCues || m.totalCues;
        m.cues = Array.isArray(data.cues) ? data.cues : m.cues;
        m.title = data.title || m.title;
        updateLoadStatus();
        maybeAutoStart();
        // If an act was selected before its iframe finished booting, the first
        // activate message could have gone to about:blank. Re-send it once.
        if (!wasReady && state.started && state.activeAct === act) {
          sendToAct(act, "activate", { cue: Math.max(0, state.activeCue || 0) });
          postConsoleStatus();
        }
        postConsoleStatus();
      } else if (data.type === "scene-state") {
        m.cueIndex = Number.isFinite(data.cue) ? data.cue : 0;
        m.cueLabel = data.cueLabel || "";
        if (Number.isFinite(data.totalCues)) m.totalCues = data.totalCues;
        if (act === state.activeAct) {
          state.activeCue = m.cueIndex;
          state.cueLabel = m.cueLabel;
          state.totalCues = m.totalCues;
          updateHud();
          postConsoleStatus();
        }
      } else if (data.type === "forward-key") {
        handleKeyCode(data.code);
      }
      return;
    }

    if (data.channel === CONSOLE_CHANNEL + "-cmd") {
      handleConsoleCommand(data);
    }
  });

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("pointermove", () => {
    if (!state.started) return;
    document.body.style.cursor = "default";
    resetIdleCursor();
  });

  function resetIdleCursor() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (state.started) document.body.style.cursor = "none";
    }, 1700);
  }

  function handleConsoleCommand(data) {
    if (!data || data.cmd == null) return;
    if (data.id) {
      if (seenConsoleCommands.has(data.id)) return;
      seenConsoleCommands.add(data.id);
      if (seenConsoleCommands.size > 200) {
        const first = seenConsoleCommands.values().next().value;
        seenConsoleCommands.delete(first);
      }
    }
    switch (data.cmd) {
      case "start":
        startShow(
          Number.isFinite(data.act) ? data.act : requestedAct,
          Number.isFinite(data.cue) ? data.cue : requestedCue
        );
        break;
      case "switch":
        if (!state.started) startShow(data.act, data.cue || 0);
        else switchAct(data.act, data.cue || 0);
        break;
      case "next":
        nextCue();
        break;
      case "prev":
        prevCue();
        break;
      case "reset":
        resetAct();
        break;
      case "cue": {
        const cue = Math.max(0, Number(data.cue) || 0);
        if (!state.started) {
          startShow(data.act, cue);
        } else if (Number(data.act) === state.activeAct) {
          sendToAct(state.activeAct, "set-cue", { cue });
          const m = currentMeta();
          if (m) {
            m.cueIndex = cue;
            m.cueLabel = m.cues[cue] ? m.cues[cue].label : "";
          }
          updateHud();
          showHud(1100);
          postConsoleStatus();
        } else {
          switchAct(data.act, cue);
        }
        break;
      }
      case "blackout":
        toggleBlackout(Boolean(data.value));
        break;
      case "fullscreen":
        toggleFullscreen();
        break;
      case "ping":
        postConsoleStatus();
        break;
      default:
        break;
    }
  }

  /* BroadcastChannel commands from the backstage console.
     A plain postMessage fallback is handled here too. */
  if (consoleChannel) {
    consoleChannel.addEventListener("message", (event) => {
      const data = event.data;
      if (!data) return;
      if (data.source === "shuming-console" && data.type === "command") {
        handleConsoleCommand(data);
      }
    });
  }

  // A second fallback for the console's popup window.
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (data && data.source === "shuming-console" && data.type === "command") {
      handleConsoleCommand(data);
    }
  });

  /* ---------- boot ---------- */

  startButton.addEventListener("click", () => {
    startShow(requestedAct, requestedCue);
  });

  // On the projector, a click anywhere is also a trusted fullscreen gesture.
  // It is intentionally invisible: no on-screen CTA during the performance.
  projector.addEventListener("click", () => {
    if (!state.started) return;
    if (!document.fullscreenElement) attemptFullscreen();
  });

  frames.forEach((frame) => {
    frame.addEventListener("load", () => {
      // If the frame's ready message raced the parent script, ask for state.
      setTimeout(() => {
        const act = Number(frame.dataset.act);
        const m = meta.get(act);
        if (m && !m.ready) {
          sendToAct(act, "request-state");
        }
      }, 500);
    });
  });

  function maybeAutoStart() {
    if (!autoStart || state.started) return;
    const requested = Number.isFinite(requestedAct) ? clampAct(requestedAct) : 0;
    const m = meta.get(requested) || meta.get(0);
    if (m && m.ready) {
      startProjection(requested, Math.max(0, requestedCue));
    }
  }

  // Default stage: no operator UI on the projector. The pre-show begins as soon
  // as its scene is ready; all other scenes continue preloading.
  if (autoStart || skipIntro) {
    intro.hidden = true;
    state.introHidden = true;
    document.body.classList.add("auto-mode");
    startFallbackTimer = setTimeout(() => {
      if (!state.started) {
        startProjection(clampAct(requestedAct), Math.max(0, requestedCue));
      }
    }, 2600);
  } else {
    startButton.disabled = true;
    intro.hidden = false;
  }

  // Fallback for the setup screen if a frame never announces itself.
  if (setupMode) setTimeout(enableStartFallback, 7000);

  updateLoadStatus();
  updateHud();
  postConsoleStatus();

  window.addEventListener("beforeunload", () => {
    if (consoleChannel) consoleChannel.close();
  });
})();
