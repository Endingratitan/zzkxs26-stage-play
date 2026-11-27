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
    const names = [
      "周光召", "王平", "李明", "张远", "刘青", "陈川", "杨帆", "赵林",
      "黄海", "吴声", "徐行", "孙明", "胡安", "朱光", "高远", "林平",
      "何山", "郭川", "马青", "罗闻",
    ];
    const cols = 5;
    const rows = 4;
    const cellW = 820 / cols;
    const cellH = 156 / rows;
    let markup = "";
    let nameIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const delay = (row * 0.13 + col * 0.065 + rnd() * 0.16).toFixed(2);
        const x = col * cellW + 13 + rnd() * 17;
        const y = row * cellH + 30 + rnd() * 5;
        const tilt = (rnd() - 0.5) * 9;
        const isFirst = row === 0 && col === 0;
        const drawOnly = !isFirst && rnd() < 0.22;
        let content = "";

        if (!drawOnly) {
          const name = names[nameIndex % names.length];
          nameIndex += 1;
          const size = isFirst ? 34 : 30 + rnd() * 10;
          const nameClass = isFirst ? "sig-name sig-first" : "sig-name";
          content += `<text class="${nameClass}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size.toFixed(1)}">${name}</text>`;
        }

        const hasFlourish = isFirst || drawOnly || rnd() > 0.22;
        if (hasFlourish) {
          const flourishX = x + (drawOnly ? 4 : 52 + rnd() * 30);
          const fy = y - 3 + rnd() * 5;
          const fw = drawOnly ? 92 + rnd() * 38 : 38 + rnd() * 48;
          const fh = 8 + rnd() * 14;
          const style = Math.floor(rnd() * 4);
          let d;
          if (style === 0) {
            d = [
              `M ${flourishX.toFixed(1)} ${fy.toFixed(1)}`,
              `q ${(fw * 0.2).toFixed(1)} ${(-fh * 1.15).toFixed(1)}, ${(fw * 0.36).toFixed(1)} ${(-fh * 0.18).toFixed(1)}`,
              `q ${(fw * 0.18).toFixed(1)} ${(fh * 0.85).toFixed(1)}, ${(fw * 0.38).toFixed(1)} ${(fh * 0.42).toFixed(1)}`,
              `t ${(fw * 0.34).toFixed(1)} ${(-fh * 0.35).toFixed(1)}`,
            ].join(" ");
          } else if (style === 1) {
            d = [
              `M ${flourishX.toFixed(1)} ${(fy + 1).toFixed(1)}`,
              `q ${(fw * 0.24).toFixed(1)} ${(-fh * 0.3).toFixed(1)}, ${(fw * 0.48).toFixed(1)} ${(fh * 0.15).toFixed(1)}`,
              `l ${(fw * 0.32).toFixed(1)} ${(fh * 0.2).toFixed(1)}`,
            ].join(" ");
          } else if (style === 2) {
            d = [
              `M ${flourishX.toFixed(1)} ${fy.toFixed(1)}`,
              `c ${(fw * 0.2).toFixed(1)} ${(-fh * 1.5).toFixed(1)}, ${(fw * 0.5).toFixed(1)} ${(-fh * 0.2).toFixed(1)}, ${(fw * 0.58).toFixed(1)} ${(fh * 0.75).toFixed(1)}`,
              `q ${(-fw * 0.18).toFixed(1)} ${(-fh * 0.2).toFixed(1)}, ${(-fw * 0.06).toFixed(1)} ${(fh * 0.25).toFixed(1)}`,
            ].join(" ");
          } else {
            d = [
              `M ${flourishX.toFixed(1)} ${(fy - 3).toFixed(1)}`,
              `c ${(fw * 0.1).toFixed(1)} ${(-fh * 0.7).toFixed(1)}, ${(fw * 0.25).toFixed(1)} ${(fh * 0.5).toFixed(1)}, ${(fw * 0.4).toFixed(1)} ${(fh * 0.05).toFixed(1)}`,
              `m ${(-fw * 0.36).toFixed(1)} ${(fh * 1.15).toFixed(1)} h ${(fw * 0.52).toFixed(1)}`,
            ].join(" ");
          }
          content += `<path class="sig-path" pathLength="1" d="${d}"></path>`;
        }

        markup += `<g class="sig-item" transform="rotate(${tilt.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" style="--d:${delay}s;animation-delay:${delay}s">${content}</g>`;
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
