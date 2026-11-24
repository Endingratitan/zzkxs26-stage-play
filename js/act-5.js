(() => {
  "use strict";

  const scene = document.querySelector(".act5");
  const dustCanvas = document.getElementById("dustfield");
  const endingDustCanvas = document.getElementById("endingDust");

  const api = SceneCore.init({
    act: 5,
    title: "署名",
    totalCues: 6,
    cues: [
      { label: "1964.10.16 15:00", note: "办公室的下午，电话静着" },
      { label: "罗布泊来电", note: "光从窗外涌进，电话响了" },
      { label: "号外 · 没有他的名字", note: "报纸展开，署名处留白" },
      { label: "抽屉里的第 37 页", note: "旧稿纸从抽屉里升起" },
      { label: "这个，用不上了", note: "抽屉合上，画面沉入黑场" },
      { label: "周光召 · 1929—2024", note: "谢幕与致敬" },
    ],
    onCue(n) {
      for (let i = 1; i <= 5; i++) {
        scene.classList.toggle(`step-${i}`, n >= i);
      }
    },
  });

  if (!api) return;

  const dust = new SceneCore.ParticleField(dustCanvas, {
    type: "dust",
    count: 48,
    color: "rgba(248,206,148,0.5)",
    minSize: 0.5,
    maxSize: 1.8,
    speed: 0.09,
    wind: 0.018,
    alpha: 0.58,
  });
  const endingDust = new SceneCore.ParticleField(endingDustCanvas, {
    type: "dust",
    count: 36,
    color: "rgba(224,215,197,0.38)",
    minSize: 0.5,
    maxSize: 1.4,
    speed: 0.06,
    wind: 0.012,
    alpha: 0.46,
  });
  api.addParticles(dust);
  api.addParticles(endingDust);
})();
