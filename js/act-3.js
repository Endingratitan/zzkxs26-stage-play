(() => {
  "use strict";

  const scene = document.querySelector(".act3");
  const signatures = document.getElementById("signatures");
  const snowCanvas = document.getElementById("snowfield");
  const dustCanvas = document.getElementById("dustfield");
  const resLines = Array.from(document.querySelectorAll(".a3-res-line"));
  const caret = document.querySelector(".a3-caret");

  const QUOTE = [
    "作为新中国培养的科学家，",
    "我愿意放弃自己做了多年的基础理论研究，",
    "改行从事国家急需的工作。",
    "我们随时听从祖国的召唤。",
  ];

  let typeToken = 0;
  let lastCue = -1;

  /* Draw the swarm of signatures as loose ink strokes. No real names are
     invented; at a distance they read as a crowded signature page. */
  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function buildSignatures() {
    const rnd = seeded(19591206);
    const cols = 5;
    const rows = 4;
    const cellW = 820 / cols;
    const cellH = 156 / rows;
    let markup = "";
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellW + 16 + rnd() * 28;
        const y = row * cellH + 29 + rnd() * 9;
        const width = cellW * (0.43 + rnd() * 0.28);
        const h = 10 + rnd() * 12;
        const shape = Math.floor(rnd() * 4);
        const tilt = (rnd() - 0.5) * 10;
        let d = "";
        if (shape === 0) {
          d = `M ${x.toFixed(1)} ${y.toFixed(1)} c ${(width * 0.06).toFixed(1)} ${(-h * 1.25).toFixed(1)}, ${(width * 0.21).toFixed(1)} ${(-h * 0.75).toFixed(1)}, ${(width * 0.31).toFixed(1)} ${(-h * 0.06).toFixed(1)} c ${(width * 0.08).toFixed(1)} ${(h * 0.62).toFixed(1)}, ${(width * 0.17).toFixed(1)} ${(h * 0.75).toFixed(1)}, ${(width * 0.27).toFixed(1)} ${(h * 0.15).toFixed(1)} c ${(width * 0.09).toFixed(1)} ${(-h * 0.74).toFixed(1)}, ${(width * 0.22).toFixed(1)} ${(-h * 0.7).toFixed(1)}, ${(width * 0.28).toFixed(1)} ${(-h * 0.02).toFixed(1)} c ${(width * 0.05).toFixed(1)} ${(h * 0.42).toFixed(1)}, ${(width * 0.11).toFixed(1)} ${(h * 0.48).toFixed(1)}, ${(width * 0.18).toFixed(1)} ${(h * 0.1).toFixed(1)}`;
        } else if (shape === 1) {
          d = `M ${x.toFixed(1)} ${(y + 1).toFixed(1)} q ${(width * 0.06).toFixed(1)} ${(-h * 1.8).toFixed(1)}, ${(width * 0.14).toFixed(1)} ${(-h * 0.3).toFixed(1)} q ${(width * 0.06).toFixed(1)} ${(h * 1.1).toFixed(1)}, ${(width * 0.15).toFixed(1)} ${(-h * 0.12).toFixed(1)} q ${(width * 0.08).toFixed(1)} ${(-h * 0.9).toFixed(1)}, ${(width * 0.17).toFixed(1)} ${(h * 0.22).toFixed(1)} q ${(width * 0.04).toFixed(1)} ${(h * 0.65).toFixed(1)}, ${(width * 0.2).toFixed(1)} ${(h * 0.55).toFixed(1)} t ${(width * 0.19).toFixed(1)} ${(h * 0.1).toFixed(1)} m ${(-width * 0.47).toFixed(1)} ${(h * 1.65).toFixed(1)} h ${(width * 0.54).toFixed(1)}`;
        } else if (shape === 2) {
          d = `M ${x.toFixed(1)} ${y.toFixed(1)} c ${(width * 0.1).toFixed(1)} ${(-h * 1.35).toFixed(1)}, ${(width * 0.3).toFixed(1)} ${(-h * 1.1).toFixed(1)}, ${(width * 0.25).toFixed(1)} ${(-h * 0.1).toFixed(1)} c ${(-width * 0.03).toFixed(1)} ${(h * 0.8).toFixed(1)}, ${(-width * 0.22).toFixed(1)} ${(h * 0.8).toFixed(1)}, ${(-width * 0.28).toFixed(1)} ${(h * 0.07).toFixed(1)} m ${(width * 0.3).toFixed(1)} ${(-h * 0.45).toFixed(1)} c ${(width * 0.08).toFixed(1)} ${(-h * 0.8).toFixed(1)}, ${(width * 0.24).toFixed(1)} ${(-h * 0.5).toFixed(1)}, ${(width * 0.3).toFixed(1)} ${(h * 0.1).toFixed(1)} c ${(width * 0.04).toFixed(1)} ${(h * 0.5).toFixed(1)}, ${(width * 0.18).toFixed(1)} ${(h * 0.9).toFixed(1)}, ${(width * 0.18).toFixed(1)} ${(h * 0.1).toFixed(1)}`;
        } else {
          d = `M ${x.toFixed(1)} ${y.toFixed(1)} c ${(width * 0.12).toFixed(1)} ${(-h * 1.15).toFixed(1)}, ${(width * 0.24).toFixed(1)} ${(h * 0.3).toFixed(1)}, ${(width * 0.4).toFixed(1)} ${(-h * 0.25).toFixed(1)} c ${(width * 0.08).toFixed(1)} ${(-h * 0.35).toFixed(1)}, ${(width * 0.16).toFixed(1)} ${(-h * 0.18).toFixed(1)}, ${(width * 0.19).toFixed(1)} ${(h * 0.55).toFixed(1)} l ${(width * 0.07).toFixed(1)} ${(-h * 1.25).toFixed(1)} m ${(-width * 0.5).toFixed(1)} ${(h * 1.3).toFixed(1)} l ${(width * 0.3).toFixed(1)} ${(h * 0.5).toFixed(1)}`;
        }
        markup += `<path class="sig-path" pathLength="1" d="${d}" transform="rotate(${tilt.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" style="animation-delay:${(row * 0.14 + col * 0.075 + rnd() * 0.26).toFixed(2)}s"></path>`;
      }
    }
    signatures.innerHTML = markup;
  }

  function clearTypewriter() {
    typeToken += 1;
    resLines.forEach((el) => (el.textContent = ""));
    if (caret) caret.style.display = "inline-block";
  }

  function typeDecision() {
    clearTypewriter();
    const token = typeToken;
    if (caret) caret.style.display = "inline-block";
    let line = 0;
    let char = 0;

    function step() {
      if (token !== typeToken) return;
      if (line >= QUOTE.length) {
        if (caret) {
          setTimeout(() => {
            if (token === typeToken) caret.style.display = "none";
          }, 1200);
        }
        return;
      }
      if (char < QUOTE[line].length) {
        resLines[line].textContent += QUOTE[line][char];
        char += 1;
        setTimeout(step, char % 6 === 0 ? 70 : 36);
      } else {
        line += 1;
        char = 0;
        setTimeout(step, 280);
      }
    }
    setTimeout(step, 850);
  }

  buildSignatures();

  const api = SceneCore.init({
    act: 3,
    title: "一封签了名的信",
    totalCues: 5,
    cues: [
      { label: "1960 · 冬 · 杜布纳", note: "台灯亮起，联名信在桌面上" },
      { label: "二十余人的签名", note: "签名逐个落纸" },
      { label: "决心书逐行打出", note: "信念被写到纸上" },
      { label: "1961 · 北京", note: "画面切到回国后的北京" },
      { label: "灯暗，本幕收", note: "沉入黑场" },
    ],
    onCue(n) {
      for (let i = 1; i <= 4; i++) {
        scene.classList.toggle(`step-${i}`, n >= i);
      }
      if (n === 2) {
        if (lastCue !== 2) typeDecision();
      } else {
        clearTypewriter();
      }
      lastCue = n;
    },
  });

  if (!api) return;

  const snow = new SceneCore.ParticleField(snowCanvas, {
    type: "snow",
    count: 72,
    color: "rgba(190,212,214,0.56)",
    minSize: 0.6,
    maxSize: 2.3,
    speed: 0.3,
    wind: 0.055,
    alpha: 0.7,
  });
  const dust = new SceneCore.ParticleField(dustCanvas, {
    type: "dust",
    count: 46,
    color: "rgba(239,195,132,0.55)",
    minSize: 0.5,
    maxSize: 1.8,
    speed: 0.08,
    wind: 0.015,
    alpha: 0.58,
  });
  api.addParticles(snow);
  api.addParticles(dust);
})();
