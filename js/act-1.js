(() => {
  "use strict";

  const scene = document.querySelector(".act1");
  const snowCanvas = document.getElementById("snowfield");
  const dustCanvas = document.getElementById("dustfield");

  let snowField = null;
  let dustField = null;

  const api = SceneCore.init({
    act: 1,
    title: "三十七页",
    totalCues: 5,
    cues: [
      { label: "1959 · 春 · 杜布纳", note: "冷场进入，论文在暗处等待" },
      { label: "论文首页浮现，署名空着", note: "屏幕出现第 37 页，署名处留白" },
      { label: "写下名字", note: "钢笔落纸，署名完成" },
      { label: "未拆的家书", note: "纸页退后，信封进入光里" },
      { label: "灯灭，本幕收", note: "画面沉入黑场，等下一次切幕" },
    ],
    onCue(n) {
      for (let i = 1; i <= 4; i++) {
        scene.classList.toggle(`step-${i}`, n >= i);
      }
      scene.classList.toggle("at-sign", n === 2);
      scene.classList.toggle("at-letter", n === 3);
      if (n >= 3 && snowField) snowField.config.alpha = 0.5;
    },
  });

  if (!api) return;

  // Snow is confined to the window-view; dust drifts through the room light.
  snowField = new SceneCore.ParticleField(snowCanvas, {
    type: "snow",
    count: 94,
    color: "rgba(195,216,222,0.6)",
    minSize: 0.7,
    maxSize: 2.5,
    speed: 0.34,
    wind: 0.09,
    alpha: 0.7,
  });
  dustField = new SceneCore.ParticleField(dustCanvas, {
    type: "dust",
    count: 34,
    color: "rgba(197,213,211,0.34)",
    minSize: 0.5,
    maxSize: 1.4,
    speed: 0.08,
    wind: 0.015,
    alpha: 0.55,
  });

  api.addParticles(snowField);
  api.addParticles(dustField);
})();
