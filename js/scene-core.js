/* ============================================================
   《署名》舞台投影系统 — scene core
   - 1920×1080 fixed canvas fitted to any screen
   - cue engine + keyboard + parent/child messaging
   - reusable winter-light particle fields
   ============================================================ */
(function () {
  "use strict";

  const DESIGN = { width: 1920, height: 1080 };
  const CHANNEL = "shuming-stage";
  const CUE_LABELS = [];

  const params = new URLSearchParams(location.search);
  const isEmbedded = window.parent !== window;
  const noHud = params.get("hud") === "0";
  const requestedCue = Number.parseInt(params.get("cue") || "", 10);

  if (isEmbedded) document.body.classList.add("is-embedded");
  if (noHud) document.body.classList.add("hud-off");

  function fitStage(stage) {
    const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  function isReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  /* ----------------------------------------------------------
     Particle field — snow / dust / ash / embers / chalk
     ---------------------------------------------------------- */

  class ParticleField {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.config = Object.assign(
        {
          type: "snow",
          count: 120,
          color: "rgba(226,236,240,0.74)",
          minSize: 0.8,
          maxSize: 3.2,
          speed: 0.28,
          wind: 0.06,
          alpha: 1,
          gravity: 0.01,
          life: 1,
          spawnArea: "full",
        },
        config
      );
      this.particles = [];
      this.bursts = [];
      this.running = false;
      this.raf = null;
      this.last = 0;
      this.w = 1;
      this.h = 1;
      this.dpr = 1;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.resizeObserver =
        typeof ResizeObserver !== "undefined" ? new ResizeObserver(this.resize) : null;
      if (this.resizeObserver) this.resizeObserver.observe(canvas);
      this.resize();
      this.seed();
      if (!isEmbedded && !isReducedMotion()) this.start();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.dpr = dpr;
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.seed();
      this.draw(0);
    }

    seed() {
      const c = this.config;
      const count = Math.round(clamp(c.count * Math.min(1.6, Math.max(0.5, this.w / 1200)), 8, 520));
      this.particles = Array.from({ length: count }, () => this.makeParticle(true));
    }

    makeParticle(initial) {
      const c = this.config;
      const type = c.type;
      let x = Math.random() * this.w;
      let y = Math.random() * this.h;
      if (initial) {
        if (type === "snow") y = Math.random() * this.h;
        if (type === "ash" || type === "ember") y = Math.random() * this.h;
      }
      const base = {
        x,
        y,
        vx: rand(-1, 1) * c.wind,
        vy: c.speed * rand(0.6, 1.4),
        size: rand(c.minSize, c.maxSize),
        phase: Math.random() * Math.PI * 2,
        wobble: rand(0.2, 1.2),
        alpha: rand(0.2, 1) * c.alpha,
        rotation: Math.random() * Math.PI,
      };
      if (type === "dust") {
        base.vx = rand(-0.12, 0.12);
        base.vy = rand(-0.1, 0.1);
      }
      if (type === "ash") {
        base.vx = rand(-0.25, 0.18);
        base.vy = rand(-0.24, -0.04);
      }
      if (type === "ember") {
        base.vx = rand(-0.32, 0.2);
        base.vy = rand(-0.9, -0.25);
      }
      return base;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    setActive(active) {
      if (active) {
        this.resize();
        this.start();
      } else {
        this.stop();
      }
    }

    burst(x, y, count, options) {
      if (isReducedMotion()) return;
      const o = Object.assign(
        {
          color: "rgba(235,234,220,0.8)",
          speed: 2.2,
          gravity: 0.045,
          life: 90,
          size: 2,
        },
        options
      );
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = rand(0.25, 1) * o.speed;
        this.bursts.push({
          x,
          y,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force - rand(0, 0.6),
          g: o.gravity,
          life: o.life * rand(0.5, 1.2),
          maxLife: o.life * rand(0.6, 1.4),
          size: o.size * rand(0.35, 1.3),
          color: o.color,
        });
      }
    }

    tick(now) {
      if (!this.running) return;
      const dt = clamp(now - this.last, 8, 40) / 16.6667;
      this.last = now;
      this.update(dt);
      this.draw(now);
      this.raf = requestAnimationFrame(this.tick);
    }

    update(dt) {
      const c = this.config;
      const type = c.type;
      for (const p of this.particles) {
        p.phase += 0.004 * dt;
        if (type === "snow") {
          p.x += (p.vx + Math.sin(p.phase * 1.8 + p.wobble) * 0.16) * dt;
          p.y += p.vy * dt;
          if (p.y > this.h + 8) {
            p.y = -8;
            p.x = Math.random() * this.w;
          }
          if (p.x < -10) p.x = this.w + 10;
          if (p.x > this.w + 10) p.x = -10;
        } else if (type === "dust") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -8) p.x = this.w + 8;
          if (p.x > this.w + 8) p.x = -8;
          if (p.y < -8) p.y = this.h + 8;
          if (p.y > this.h + 8) p.y = -8;
        } else if (type === "ash") {
          p.x += (p.vx + Math.sin(p.phase) * 0.1) * dt;
          p.y += p.vy * dt;
          p.rotation += 0.01 * dt;
          if (p.y < -10) {
            p.y = this.h + 10;
            p.x = Math.random() * this.w;
          }
        } else if (type === "ember") {
          p.x += (p.vx + Math.sin(p.phase * 2.4) * 0.12) * dt;
          p.y += p.vy * dt;
          p.phase += 0.008 * dt;
          if (p.y < -8) {
            p.y = this.h + 8;
            p.x = Math.random() * this.w;
          }
        }
        p.alpha = clamp(p.alpha + rand(-0.001, 0.001), 0.08, 1);
      }

      for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy += b.g * dt;
        b.vx *= 0.985;
        b.life -= dt;
        if (b.life <= 0) this.bursts.splice(i, 1);
      }
    }

    draw() {
      const ctx = this.ctx;
      const c = this.config;
      ctx.clearRect(0, 0, this.w, this.h);
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha;
        if (c.type === "snow") {
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (c.type === "dust") {
          ctx.fillStyle = c.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else if (c.type === "ash" || c.type === "ember") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.55, p.size * 1.25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (c.type === "ember" && p.size > 1.6) {
            ctx.globalAlpha = p.alpha * 0.3;
            ctx.fillStyle = "rgba(255,150,62,0.8)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      for (const b of this.bursts) {
        ctx.globalAlpha = clamp(b.life / b.maxLife, 0, 1);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    destroy() {
      this.stop();
      if (this.resizeObserver) this.resizeObserver.disconnect();
    }
  }

  /* ----------------------------------------------------------
     Scene controller
     ---------------------------------------------------------- */

  function init(config) {
    const stage = document.querySelector(".stage");
    const scene = document.querySelector(".scene");
    if (!stage || !scene) return null;

    const state = {
      act: config.act,
      title: config.title,
      cue: -1,
      total: config.totalCues || (config.cues ? config.cues.length : 1),
      active: !isEmbedded,
      ready: false,
      blackout: false,
      cues: config.cues || [],
    };

    const particles = [];
    const timers = new Set();

    fitStage(stage);
    window.addEventListener("resize", () => fitStage(stage), { passive: true });

    // Mobile / projection letterbox: keep the stage centered.
    document.documentElement.style.setProperty("--fit-height", `${DESIGN.height}px`);

    function later(fn, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    }

    function clearTimers() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    }

    function cueLabel(index) {
      if (index < 0) return "待机";
      const item = state.cues[index];
      if (typeof item === "string") return item;
      if (item && item.label) return item.label;
      return `提示 ${String(index + 1).padStart(2, "0")}`;
    }

    function postToParent(payload) {
      if (!isEmbedded) return;
      payload = Object.assign(
        {
          channel: CHANNEL,
          act: state.act,
          title: state.title,
          totalCues: state.total,
          cues: state.cues.map((c) =>
            typeof c === "string" ? { label: c } : { label: c.label, note: c.note || "" }
          ),
          cue: state.cue,
          cueLabel: cueLabel(state.cue),
        },
        payload
      );
      try {
        window.parent.postMessage(payload, "*");
      } catch (e) {
        /* file:// or unloaded parent */
      }
    }

    function applyCue(nextCue, options) {
      const opts = Object.assign({ instant: false, first: false }, options || {});
      const n = clamp(nextCue, 0, state.total - 1);
      if (n === state.cue && !opts.force) return;
      const prev = state.cue;
      state.cue = n;
      scene.dataset.cue = String(n);
      scene.setAttribute("data-cue", String(n));
      if (opts.first) {
        scene.classList.add("is-first-cue");
        later(() => scene.classList.remove("is-first-cue"), 900);
      }
      try {
        if (typeof config.onCue === "function") {
          config.onCue(n, prev, {
            instant: opts.instant,
            first: opts.first,
            scene,
            stage,
            state,
            later,
            particles,
          });
        }
      } catch (err) {
        console.error("[scene cue]", err);
      }
      updateHud();
      postToParent({ type: "scene-state", cue: n, cueLabel: cueLabel(n) });
    }

    function nextCue() {
      if (state.cue >= state.total - 1) {
        nudge();
        return;
      }
      applyCue(state.cue + 1);
    }

    function prevCue() {
      if (state.cue <= 0) {
        nudge();
        return;
      }
      applyCue(state.cue - 1, { instant: false });
    }

    function resetScene() {
      clearTimers();
      applyCue(0, { force: true, first: true });
    }

    function nudge() {
      if (!stage) return;
      stage.classList.remove("is-nudged");
      void stage.offsetWidth;
      stage.classList.add("is-nudged");
      later(() => stage.classList.remove("is-nudged"), 380);
    }

    function setActive(active) {
      state.active = active;
      document.body.classList.toggle("is-active", active);
      document.body.classList.toggle("is-suspended", !active);
      for (const field of particles) field.setActive(active);
      if (active) {
        scene.classList.add("is-live");
      } else {
        scene.classList.remove("is-live");
      }
    }

    function setBlackout(value) {
      state.blackout = typeof value === "boolean" ? value : !state.blackout;
      document.body.classList.toggle("is-blackout", state.blackout);
    }

    /* ---------- operator HUD ---------- */

    const hud = document.createElement("div");
    hud.className = "operator-hud";
    hud.innerHTML = `
      <span class="dot"></span>
      <span class="hud-act">${String(config.act).padStart(2, "0")} / ${config.title}</span>
      <span class="hud-sep"></span>
      <span class="hud-cue">${cueLabel(0)}</span>
      <span class="hud-sep"></span>
      <span class="hud-key">SPACE 下一提示 · ← 返回 · 1–5 切幕 · B 黑场 · F 全屏</span>
    `;
    stage.appendChild(hud);

    const prompt = document.createElement("div");
    prompt.className = "scene-prompt";
    prompt.innerHTML = `<span>空格 · 下一提示</span><span>1–5 · 切幕</span><span>F · 全屏</span><span>H · 隐藏</span>`;
    stage.appendChild(prompt);

    const blackout = document.createElement("div");
    blackout.className = "blackout";
    stage.appendChild(blackout);

    let hudTimer = null;
    function showHud() {
      if (noHud || isEmbedded) return;
      hud.classList.add("is-visible");
      clearTimeout(hudTimer);
      hudTimer = setTimeout(() => hud.classList.remove("is-visible"), 1700);
    }
    function updateHud() {
      const cue = hud.querySelector(".hud-cue");
      if (cue) cue.textContent = `${String(state.cue + 1).padStart(2, "0")} / ${String(state.total).padStart(2, "0")} · ${cueLabel(state.cue)}`;
    }

    let promptTimer = null;
    function showPrompt(ms) {
      if (isEmbedded || noHud) return;
      prompt.classList.add("is-visible");
      clearTimeout(promptTimer);
      if (ms) promptTimer = setTimeout(() => prompt.classList.remove("is-visible"), ms);
    }
    function hidePrompt() {
      prompt.classList.remove("is-visible");
    }

    /* ---------- keyboard ---------- */

    const navMap = {
      "0": "preshow.html",
      "1": "act-1.html",
      "2": "act-2.html",
      "3": "act-3.html",
      "4": "act-4.html",
      "5": "act-5.html",
    };

    function navigateTo(url) {
      document.body.classList.add("is-blackout");
      later(() => {
        location.href = url;
      }, 430);
    }

    function handleKey(code, event) {
      showHud();
      hidePrompt();

      if (isEmbedded) {
        if (
          /^Digit[0-5]$/.test(code) ||
          /^Numpad[0-5]$/.test(code) ||
          ["Space", "ArrowRight", "ArrowLeft", "PageDown", "PageUp", "Enter", "KeyR", "KeyB", "KeyF", "KeyH"].includes(code)
        ) {
          postToParent({ type: "forward-key", code });
          if (event) event.preventDefault();
          return;
        }
      }

      const digit = code.match(/^(?:Digit|Numpad)([0-5])$/);
      if (digit) {
        event.preventDefault();
        if (!isEmbedded) {
          if (Number(digit[1]) !== state.act) navigateTo(navMap[digit[1]]);
        } else {
          postToParent({ type: "forward-key", code });
        }
        return;
      }

      switch (code) {
        case "Space":
        case "ArrowRight":
        case "PageDown":
        case "Enter":
          event.preventDefault();
          nextCue();
          break;
        case "ArrowLeft":
        case "PageUp":
        case "Backspace":
          event.preventDefault();
          prevCue();
          break;
        case "KeyR":
          event.preventDefault();
          resetScene();
          break;
        case "KeyB":
          event.preventDefault();
          if (isEmbedded) postToParent({ type: "forward-key", code });
          else setBlackout();
          break;
        case "KeyF":
          event.preventDefault();
          toggleFullscreen();
          break;
        case "KeyH":
        case "Escape":
          if (!isEmbedded) {
            event.preventDefault();
            document.body.classList.toggle("hud-off");
          }
          break;
        case "Digit0":
        case "Numpad0":
          if (!isEmbedded) navigateTo(navMap["0"]);
          break;
        default:
          break;
      }
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    function onKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      handleKey(event.code, event);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", () => {
      if (isEmbedded || noHud) return;
      const now = Date.now();
      if (now - (window.__lastPointerHud || 0) < 900) return;
      window.__lastPointerHud = now;
      showHud();
      hidePrompt();
    });

    /* ---------- parent messages ---------- */

    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || data.channel !== CHANNEL + "-control") return;
      switch (data.type) {
        case "activate":
          setActive(true);
          applyCue(Number.isFinite(data.cue) ? data.cue : 0, { force: true, first: true });
          break;
        case "deactivate":
          setActive(false);
          break;
        case "next":
          if (state.active) nextCue();
          break;
        case "prev":
          if (state.active) prevCue();
          break;
        case "reset":
          if (state.active) resetScene();
          break;
        case "set-cue":
          if (state.active) applyCue(Number(data.cue) || 0, { force: true });
          break;
        case "blackout":
          setBlackout(Boolean(data.value));
          break;
        case "ping":
          postToParent({ type: "scene-pong" });
          break;
        case "request-state":
          postToParent({ type: "scene-ready" });
          postToParent({ type: "scene-state" });
          break;
        default:
          break;
      }
    });

    /* ---------- boot ---------- */

    function finish() {
      if (state.ready) return;
      state.ready = true;
      stage.classList.add("is-ready");
      postToParent({ type: "scene-ready" });
      if (!isEmbedded) {
        setActive(true);
        showPrompt(6200);
      }
    }

    // Apply the first visual state before revealing to avoid flashes.
    applyCue(
      Number.isFinite(requestedCue) ? clamp(requestedCue, 0, state.total - 1) : 0,
      { first: true, instant: true, force: true }
    );
    setActive(!isEmbedded);
    if (isEmbedded) document.body.classList.add("is-suspended");

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(finish).catch(finish);
      // Never let a slow local font block the show.
      setTimeout(finish, 3800);
    } else {
      finish();
    }

    const api = {
      get cue() {
        return state.cue;
      },
      get total() {
        return state.total;
      },
      state,
      next: nextCue,
      prev: prevCue,
      reset: resetScene,
      applyCue,
      setActive,
      setBlackout,
      addParticles(field) {
        particles.push(field);
        return field;
      },
      later,
      postToParent,
      cueLabel,
      isEmbedded,
    };
    window.StageScene = api;
    return api;
  }

  window.SceneCore = {
    DESIGN,
    CHANNEL,
    init,
    ParticleField,
    fitStage,
    isReducedMotion,
    clamp,
    rand,
    isEmbedded,
  };
})();
