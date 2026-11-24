(() => {
  "use strict";

  const scene = document.querySelector(".act4");
  const grid = document.getElementById("numberGrid");
  const dustCanvas = document.getElementById("dustfield");
  const emberCanvas = document.getElementById("emberfield");

  let chalkDust = null;
  let dust = null;
  let embers = null;
  let lastCue = -1;
  const timers = new Set();

  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function fillBoard() {
    const rnd = seeded(19610109);
    const values = [];
    for (let i = 0; i < 55; i++) {
      const value = rnd();
      let text;
      if (value < 0.14) text = (rnd() * 9 + 1).toFixed(2);
      else if (value < 0.3) text = `0.${Math.floor(rnd() * 900 + 100)}`;
      else if (value < 0.46) text = `${Math.floor(rnd() * 90 + 10)}.${Math.floor(rnd() * 10)}`;
      else if (value < 0.58) text = `${Math.floor(rnd() * 9)}.${Math.floor(rnd() * 900 + 100)}`;
      else if (value < 0.7) text = `×${(rnd() * 3 + 0.1).toFixed(2)}`;
      else if (value < 0.82) text = `ρ${Math.floor(rnd() * 9)}`;
      else if (value < 0.92) text = `δ${Math.floor(rnd() * 9)}`;
      else text = `· ${Math.floor(rnd() * 98 + 1)}`;
      values.push(`<span>${text}</span>`);
    }
    grid.innerHTML = values.join("");
  }

  function burstChalk(x, y, count) {
    if (!chalkDust) return;
    chalkDust.burst(x, y, count, {
      color: "rgba(231, 229, 214, 0.62)",
      speed: 2.8,
      gravity: 0.055,
      life: 96,
      size: 2.2,
    });
    if (dust) {
      dust.burst(x - 30, y + 20, Math.round(count * 0.35), {
        color: "rgba(224, 221, 201, 0.35)",
        speed: 1.2,
        gravity: 0.025,
        life: 120,
        size: 1.4,
      });
    }
  }

  function scheduleChalkFor(n) {
    for (const id of timers) clearTimeout(id);
    timers.clear();
    if (n === 2) {
      later(() => burstChalk(770, 475, 60), 900);
    }
    if (n === 3) {
      later(() => burstChalk(1310, 538, 95), 1250);
    }
  }

  fillBoard();

  const api = SceneCore.init({
    act: 4,
    title: "第九次",
    totalCues: 5,
    cues: [
      { label: "1961 · 冬 · 北京", note: "满板算稿，煤炉还亮着" },
      { label: "第九次，还是对不上", note: "苏方数据被圈出，其他算式退后" },
      { label: "最大功", note: "只有三个字打在黑板中央" },
      { label: "擦掉那个数", note: "板擦扫过，粉笔灰落下" },
      { label: "空白", note: "黑板只剩空白，沉入黑场" },
    ],
    onCue(n) {
      for (let i = 1; i <= 4; i++) {
        scene.classList.toggle(`step-${i}`, n >= i);
      }
      if (n >= 1) {
        scene.querySelector(".a4-head")?.classList.add("is-quiet");
      } else {
        scene.querySelector(".a4-head")?.classList.remove("is-quiet");
      }
      if (n !== lastCue) scheduleChalkFor(n);
      lastCue = n;
    },
  });

  if (!api) return;

  chalkDust = new SceneCore.ParticleField(dustCanvas, {
    type: "dust",
    count: 48,
    color: "rgba(228, 226, 209, 0.34)",
    minSize: 0.45,
    maxSize: 1.5,
    speed: 0.08,
    wind: 0.018,
    alpha: 0.5,
  });
  dust = chalkDust;
  embers = new SceneCore.ParticleField(emberCanvas, {
    type: "ember",
    count: 18,
    color: "rgba(232, 138, 69, 0.64)",
    minSize: 0.5,
    maxSize: 1.8,
    speed: 0.5,
    wind: 0.02,
    alpha: 0.55,
  });

  api.addParticles(chalkDust);
  api.addParticles(embers);

  if (api.state.cue === 2) later(() => burstChalk(770, 475, 60), 1400);
  if (api.state.cue === 3) later(() => burstChalk(1310, 538, 95), 1000);
})();
