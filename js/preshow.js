(() => {
  "use strict";

  const api = SceneCore.init({
    act: 0,
    title: "预演",
    totalCues: 1,
    cues: [{ label: "开场前 · 片名静置" }],
    onCue() {},
  });

  if (!api) return;

  const dust = new SceneCore.ParticleField(document.getElementById("dust"), {
    type: "dust",
    count: 64,
    color: "rgba(232,225,211,0.42)",
    minSize: 0.6,
    maxSize: 1.8,
    speed: 0.08,
    wind: 0.02,
    alpha: 0.7,
  });

  api.addParticles(dust);
})();
