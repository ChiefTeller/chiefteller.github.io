(() => {
  const canvas = document.getElementById("gen1-field");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    width: 0,
    height: 0,
    dpi: 1,
    time: 0,
    scroll: 0,
    pointer: { x: 0, y: 0, active: false, pulse: 0 },
    particles: [],
    pulses: [],
  };

  const colors = {
    ink: "248,245,236",
    cyan: "98,240,255",
    amber: "244,196,93",
    red: "255,106,92",
    green: "121,225,140",
  };

  const labels = ["תגובה", "מתח", "עדות", "דממה", "בחירה"];

  function fit() {
    state.dpi = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.dpi);
    canvas.height = Math.floor(state.height * state.dpi);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpi, 0, 0, state.dpi, 0, 0);
    seed();
  }

  function seed() {
    const count = Math.max(86, Math.min(160, Math.round((state.width * state.height) / 10500)));
    state.particles = Array.from({ length: count }, (_, index) => ({
      phase: Math.random(),
      lane: index % 7,
      speed: 0.000028 + Math.random() * 0.000056,
      size: 0.8 + Math.random() * 2.6,
      side: index % 2 ? 1 : -1,
      color: [colors.cyan, colors.amber, colors.green, colors.red][index % 4],
      label: labels[index % labels.length],
    }));

    state.pulses = Array.from({ length: 38 }, (_, index) => ({
      phase: Math.random(),
      speed: 0.00005 + Math.random() * 0.00008,
      offset: (index - 19) * 0.06,
      color: [colors.cyan, colors.amber, colors.green][index % 3],
    }));
  }

  function field() {
    const portrait = state.width < 880;
    return {
      x: portrait ? state.width * 0.5 : state.width * (0.48 + state.scroll * 0.06),
      y: portrait ? state.height * (0.28 + state.scroll * 0.1) : state.height * (0.48 - state.scroll * 0.04),
      scale: Math.min(state.width * (portrait ? 0.56 : 0.34), state.height * 0.54),
    };
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function pendulumPoint(theta, length, origin) {
    return {
      x: origin.x + Math.sin(theta) * length,
      y: origin.y + Math.cos(theta) * length,
    };
  }

  function lemniscate(t, scale, cx, cy) {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const denom = 1 + s * s;
    return {
      x: cx + (scale * c) / denom,
      y: cy + (scale * 0.5 * s * c) / denom,
    };
  }

  function drawBase() {
    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, state.width, state.height);
    const { x, y, scale } = field();

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(248,245,236,0.052)";
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i += 1) {
      const lift = i * (scale / 7);
      ctx.beginPath();
      ctx.moveTo(x - scale * 1.7, y + lift * 0.18);
      ctx.bezierCurveTo(
        x - scale * 0.65,
        y + lift * 0.75,
        x + scale * 0.65,
        y - lift * 0.75,
        x + scale * 1.7,
        y - lift * 0.18
      );
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(244,196,93,0.08)";
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(x, y + scale * 0.24, scale * (0.9 + i * 0.16), scale * (0.18 + i * 0.045), 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPendulum() {
    const { x, y, scale } = field();
    const portrait = state.width < 880;
    const origin = { x, y: y - scale * 0.42 };
    const length = scale * 0.86;
    const energy = 0.82 - state.scroll * 0.36;
    const theta = Math.sin(state.time * 0.00072) * energy;
    const bob = pendulumPoint(theta, length, origin);
    const opposite = pendulumPoint(-theta * 0.82, length * 0.88, origin);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(origin.x, origin.y, length, Math.PI * 0.5 - energy, Math.PI * 0.5 + energy);
    ctx.strokeStyle = `rgba(${colors.cyan}, 0.16)`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.strokeStyle = `rgba(${colors.ink}, 0.22)`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(opposite.x, opposite.y);
    ctx.bezierCurveTo(
      mix(opposite.x, bob.x, 0.28),
      origin.y + scale * 0.36,
      mix(opposite.x, bob.x, 0.72),
      origin.y + scale * 0.36,
      bob.x,
      bob.y
    );
    ctx.strokeStyle = `rgba(${colors.amber}, 0.22)`;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(bob.x, bob.y, 11 + i * 13, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${i % 2 ? colors.amber : colors.cyan}, ${0.22 - i * 0.045})`;
      ctx.lineWidth = 1.1 + i * 0.35;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(bob.x, bob.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors.ink}, 0.94)`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors.amber}, 0.82)`;
    ctx.fill();

    ctx.font = "600 13px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(${colors.ink}, ${portrait ? 0.28 : 0.6})`;
    ctx.fillText(`תנודה ${(energy * 100).toFixed(0)}%`, bob.x, bob.y + 38);
    ctx.fillStyle = `rgba(${colors.amber}, ${portrait ? 0.42 : 0.78})`;
    ctx.fillText("דממה", origin.x, origin.y - 20);
    ctx.restore();
  }

  function drawInfinity() {
    const { x, y, scale } = field();
    const phase = state.time * 0.00035;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let ring = 0; ring < 4; ring += 1) {
      ctx.beginPath();
      for (let i = 0; i <= 640; i += 1) {
        const p = lemniscate((i / 640) * Math.PI * 2 + phase * (ring % 2 ? -0.2 : 0.28), scale * (0.9 + ring * 0.08), x, y + scale * 0.12);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `rgba(${ring % 2 ? colors.amber : colors.cyan}, ${0.11 - ring * 0.015})`;
      ctx.lineWidth = 1.4 + ring * 0.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles(delta) {
    const { x, y, scale } = field();
    const portrait = state.width < 880;
    const speed = reducedMotion.matches ? 0.28 : 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    state.particles.forEach((particle, index) => {
      particle.phase = (particle.phase + delta * particle.speed * speed) % 1;
      const angle = particle.phase * Math.PI * 2;
      const p = lemniscate(angle, scale * (0.72 + particle.lane * 0.06), x, y + scale * 0.12);
      const swing = Math.sin(state.time * 0.001 + particle.lane) * particle.side * 15;
      const px = p.x;
      const py = p.y + swing;
      const d = Math.hypot(state.pointer.x - px, state.pointer.y - py);
      const pull = state.pointer.active ? Math.max(0, 1 - d / 220) : 0;
      ctx.beginPath();
      ctx.arc(px, py, particle.size + pull * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.color}, ${0.34 + pull * 0.44})`;
      ctx.fill();
      if (!portrait && (index % 17 === 0 || pull > 0.55)) {
        ctx.font = "600 11px Segoe UI, Arial, sans-serif";
        ctx.fillStyle = `rgba(${colors.ink}, ${0.28 + pull * 0.34})`;
        ctx.textAlign = "center";
        ctx.fillText(particle.label, px, py - 12);
      }
    });
    ctx.restore();
  }

  function drawPulses(delta) {
    const { x, y, scale } = field();
    const origin = { x, y: y - scale * 0.42 };
    const length = scale * 0.86;
    const speed = reducedMotion.matches ? 0.3 : 1;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    state.pulses.forEach((pulse) => {
      pulse.phase = (pulse.phase + delta * pulse.speed * speed) % 1;
      const theta = Math.sin((pulse.phase + pulse.offset) * Math.PI * 2) * 0.78;
      const p = pendulumPoint(theta, length * (0.72 + pulse.phase * 0.18), origin);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1 + Math.sin(pulse.phase * Math.PI) * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pulse.color}, ${0.28 + Math.sin(pulse.phase * Math.PI) * 0.42})`;
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPointerPulse() {
    if (!state.pointer.active && state.pointer.pulse <= 0.02) return;
    state.pointer.pulse *= 0.94;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, 46 + state.pointer.pulse * 80, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${colors.cyan}, ${state.pointer.pulse * 0.15})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }

  function syncScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.scroll = Math.min(1, Math.max(0, window.scrollY / max));
    document.documentElement.style.setProperty("--scroll", state.scroll.toFixed(3));
    document.documentElement.dataset.depth = state.scroll > 0.04 ? "reading" : "top";
  }

  let last = performance.now();
  function frame(now) {
    const delta = Math.min(34, now - last);
    last = now;
    state.time = now;
    drawBase();
    drawInfinity();
    drawPulses(delta);
    drawParticles(delta);
    drawPendulum();
    drawPointerPulse();
    requestAnimationFrame(frame);
  }

  function setPointer(event) {
    const point = event.touches ? event.touches[0] : event;
    state.pointer.x = point.clientX;
    state.pointer.y = point.clientY;
    state.pointer.active = true;
    state.pointer.pulse = Math.min(1, state.pointer.pulse + 0.08);
  }

  window.addEventListener("resize", () => {
    fit();
    syncScroll();
  });
  window.addEventListener("scroll", syncScroll, { passive: true });
  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("pointerdown", setPointer, { passive: true });
  window.addEventListener("pointerleave", () => {
    state.pointer.active = false;
  });
  window.addEventListener("touchmove", setPointer, { passive: true });

  fit();
  syncScroll();
  requestAnimationFrame(frame);
})();
