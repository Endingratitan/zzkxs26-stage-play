(() => {
  "use strict";

  const scene = document.querySelector(".act2");
  const waveCanvas = document.getElementById("wavefield");
  const letterText = document.getElementById("letterText");
  const caret = document.getElementById("caret");
  const letterLine = "家里都好，勿念。";
  let typeToken = 0;
  let lastCue = -1;

  function clearTypewriter() {
    typeToken += 1;
    if (letterText) letterText.textContent = "";
    if (caret) caret.style.display = "inline-block";
  }

  function typeLetter() {
    clearTypewriter();
    const token = typeToken;
    if (!letterText) return;
    caret.style.display = "inline-block";
    let i = 0;
    function step() {
      if (token !== typeToken) return;
      if (i >= letterLine.length) {
        setTimeout(() => {
          if (token === typeToken && caret) caret.style.display = "none";
        }, 1100);
        return;
      }
      letterText.textContent += letterLine[i++];
      setTimeout(step, i < 3 ? 240 : 158);
    }
    setTimeout(step, 980);
  }

  const api = SceneCore.init({
    act: 2,
    title: "消息",
    totalCues: 5,
    cues: [
      { label: "1959.6 · 杜布纳", note: "收音机亮起，房间进入黄昏" },
      { label: "塔斯社电波 · 协定暂停", note: "新闻与波形进入画面" },
      { label: "暂停援助", note: "四个字压满画面，定格" },
      { label: "家里都好，勿念。", note: "信纸出现并逐字打出" },
      { label: "灯暗，本幕收", note: "沉入黑场" },
    ],
    onCue(n) {
      for (let i = 1; i <= 4; i++) {
        scene.classList.toggle(`step-${i}`, n >= i);
      }
      if (n === 3) {
        if (lastCue !== 3) typeLetter();
      } else {
        clearTypewriter();
      }
      lastCue = n;
    },
  });

  if (!api) return;

  /* ---------- oscilloscope / radio wave ---------- */

  class Waveform {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.time = 0;
      this.last = performance.now();
      this.running = true;
      this.resize = this.resize.bind(this);
      this.draw = this.draw.bind(this);
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(this.resize).observe(canvas);
      }
      this.resize();
      this.raf = requestAnimationFrame(this.draw);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    draw(now) {
      if (!this.running) return;
      const dt = Math.min(40, now - this.last) / 1000;
      this.last = now;
      this.time += dt;

      const active = document.body.classList.contains("is-active");
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      if (active) {
        const step = Number(scene.dataset.cue || 0);
        const amp = step >= 3 ? 5 : step >= 1 ? 23 : 12;
        const speed = step >= 3 ? 0.85 : 2.1;
        const mid = this.h * 0.52;
        const t = this.time * speed;

        // A very quiet grid helps it read as a real broadcast monitor.
        ctx.strokeStyle = "rgba(212,169,107,0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < this.w; x += 68) {
          ctx.beginPath();
          ctx.moveTo(x, 13);
          ctx.lineTo(x, this.h - 13);
          ctx.stroke();
        }

        const drawLine = (offset, alpha, weight) => {
          ctx.beginPath();
          for (let x = 0; x <= this.w; x += 3) {
            const nx = x / this.w;
            const envelope = Math.sin(Math.PI * nx) * 0.82 + 0.18;
            const y =
              mid +
              offset +
              Math.sin(nx * 13.8 + t * 2.1) * amp * envelope * 0.38 +
              Math.sin(nx * 33.1 - t * 3.4) * amp * envelope * 0.16 +
              Math.sin(nx * 71.3 + t * 5.2) * amp * envelope * 0.06 +
              (Math.random() - 0.5) * (step === 2 ? 1.7 : 0.6);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(220,169,98,${alpha})`;
          ctx.lineWidth = weight;
          ctx.shadowColor = "rgba(219,155,80,0.34)";
          ctx.shadowBlur = 9;
          ctx.stroke();
          ctx.shadowBlur = 0;
        };

        drawLine(0, 0.76, 1.25);
        drawLine(9, 0.16, 1);
        drawLine(-8, 0.1, 1);

        ctx.fillStyle = "rgba(222,177,114,0.58)";
        ctx.font = "9px 'IBM Plex Mono', monospace";
        ctx.fillText(step === 2 ? "SIGNAL / INTERRUPTED" : "TASS / LONGWAVE", 2, 13);
      }
      this.raf = requestAnimationFrame(this.draw);
    }
  }

  new Waveform(waveCanvas);

  const dust = new SceneCore.ParticleField(document.getElementById("dustfield"), {
    type: "dust",
    count: 38,
    color: "rgba(245,209,158,0.48)",
    minSize: 0.5,
    maxSize: 1.7,
    speed: 0.1,
    wind: 0.02,
    alpha: 0.62,
  });
  api.addParticles(dust);
})();
