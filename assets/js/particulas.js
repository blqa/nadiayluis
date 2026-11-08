/* =========================================================
   Partículas de fondo: pétalos, corazoncitos, destellos y luces
   suaves que flotan despacio. Se alejan un poquito del cursor.
   Al tocar el sello de la portada (o algo con data-chispas)
   sale una ráfaga de corazones: window.chispas(x, y).
   Respetan "reducir movimiento" y se pausan con la pestaña oculta.
   ========================================================= */
(function () {
  const reducir = matchMedia("(prefers-reduced-motion: reduce)");
  if (reducir.matches) return;

  const lienzo = document.createElement("canvas");
  lienzo.setAttribute("aria-hidden", "true");
  lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none";
  document.body.prepend(lienzo);
  const ctx = lienzo.getContext("2d");

  let ancho = 0, alto = 0, dpr = 1;
  let paleta = { rosa: "#B4234F", pastel: "#F7CAD0", luz: "#FFFFFF", oscuro: false };
  const cursor = { x: -9999, y: -9999, activo: false };
  let parts = [], rafagas = [];

  /* Formas */
  const corazon = new Path2D("M0,-0.3 C-0.9,-1.1 -1.9,0.1 0,1.5 C1.9,0.1 0.9,-1.1 0,-0.3 Z");
  const petalo = new Path2D("M0,-1.4 C1.1,-0.8 1.1,0.8 0,1.4 C-1.1,0.8 -1.1,-0.8 0,-1.4 Z");
  const destello = new Path2D("M0,-1.6 L0.28,-0.28 L1.6,0 L0.28,0.28 L0,1.6 L-0.28,0.28 L-1.6,0 L-0.28,-0.28 Z");

  function leerPaleta() {
    const css = getComputedStyle(document.documentElement);
    const raiz = document.documentElement;
    const oscuro = raiz.dataset.modo === "oscuro";
    paleta = {
      rosa: css.getPropertyValue("--cereza").trim() || "#B4234F",
      pastel: css.getPropertyValue("--pastel").trim() || "#F7CAD0",
      luz: oscuro ? "#FFE9F2" : "#FFFFFF",
      oscuro,
    };
  }

  const azar = (a, b) => a + Math.random() * (b - a);

  function crear(inicial) {
    const tipo = Math.random();
    const base = {
      x: azar(0, ancho),
      y: inicial ? azar(0, alto) : alto + azar(20, 120),
      fase: azar(0, Math.PI * 2),
      giro: azar(0, Math.PI * 2),
    };
    if (tipo < 0.34) {            // pétalo
      return { ...base, forma: "petalo", t: azar(7, 15), vy: azar(0.12, 0.34), vgiro: azar(-0.012, 0.012), sway: azar(10, 30), alfa: azar(0.35, 0.7), color: Math.random() < 0.6 ? "pastel" : "rosa", prof: azar(0.4, 1) };
    }
    if (tipo < 0.55) {            // corazoncito
      return { ...base, forma: "corazon", t: azar(5, 10), vy: azar(0.1, 0.26), vgiro: azar(-0.006, 0.006), sway: azar(8, 20), alfa: azar(0.3, 0.6), color: Math.random() < 0.5 ? "rosa" : "pastel", prof: azar(0.4, 1) };
    }
    if (tipo < 0.82) {            // destello que titila
      return { ...base, forma: "destello", t: azar(3, 8), vy: azar(0.03, 0.1), vgiro: 0, sway: azar(4, 10), alfa: azar(0.4, 0.9), color: "luz", titila: azar(0.012, 0.03), prof: azar(0.3, 0.8) };
    }
    return { ...base, forma: "luz", t: azar(40, 110), vy: azar(0.04, 0.12), vgiro: 0, sway: azar(20, 50), alfa: azar(0.05, 0.12), color: Math.random() < 0.5 ? "pastel" : "rosa", prof: azar(0.2, 0.5) };
  }

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = innerWidth; alto = innerHeight;
    lienzo.width = ancho * dpr; lienzo.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(46, Math.max(16, ancho * alto / 26000)));
    while (parts.length < n) parts.push(crear(true));
    parts.length = n;
  }

  function trazo(p, x, y, alfa) {
    const c = paleta[p.color];
    ctx.globalAlpha = Math.max(0, Math.min(1, alfa));
    if (p.forma === "luz") {
      const g = ctx.createRadialGradient(x, y, 0, x, y, p.t);
      g.addColorStop(0, c); g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, p.t, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(x, y); ctx.rotate(p.giro); ctx.scale(p.t, p.t);
    ctx.fillStyle = c;
    if (p.forma === "destello" && paleta.oscuro) { ctx.shadowColor = paleta.pastel; ctx.shadowBlur = 8; }
    ctx.fill(p.forma === "petalo" ? petalo : p.forma === "corazon" ? corazon : destello);
    ctx.restore();
  }

  let ultimo = 0, corriendo = true;
  function cuadro(ahora) {
    if (!corriendo) return;
    const dt = Math.min(2.5, (ahora - ultimo) / 16.67 || 1); ultimo = ahora;
    ctx.clearRect(0, 0, ancho, alto);
    ctx.globalCompositeOperation = paleta.oscuro ? "lighter" : "source-over";

    for (const p of parts) {
      p.fase += 0.012 * dt;
      p.y -= p.vy * dt * (0.6 + p.prof);
      p.giro += p.vgiro * dt;
      let x = p.x + Math.sin(p.fase) * p.sway;
      let y = p.y;
      if (cursor.activo) {
        const dx = x - cursor.x, dy = y - cursor.y, d2 = dx * dx + dy * dy, r = 130;
        if (d2 < r * r) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / r) * 26 * p.prof;
          p.x += (dx / d) * f * 0.06 * dt;
          p.y += (dy / d) * f * 0.06 * dt;
        }
      }
      let alfa = p.alfa;
      if (p.titila) alfa *= 0.35 + 0.65 * Math.abs(Math.sin(p.fase * p.titila * 40));
      if (y < -p.t * 2) Object.assign(p, crear(false));
      if (paleta.oscuro && p.forma === "luz") alfa *= 1.4;
      trazo(p, x, y, alfa);
    }

    /* Ráfagas de corazones */
    for (let i = rafagas.length - 1; i >= 0; i--) {
      const r = rafagas[i];
      r.vida -= 0.014 * dt;
      if (r.vida <= 0) { rafagas.splice(i, 1); continue; }
      r.vy += 0.045 * dt; r.x += r.vx * dt; r.y += r.vy * dt; r.giro += r.vgiro * dt;
      trazo(r, r.x, r.y, r.vida * 0.95);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    requestAnimationFrame(cuadro);
  }

  window.chispas = function (x, y, cuantas = 18) {
    for (let i = 0; i < cuantas; i++) {
      const ang = azar(-Math.PI, 0) + azar(-0.5, 0.5), vel = azar(2.6, 7.2);
      rafagas.push({
        x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 1.2, vgiro: azar(-0.1, 0.1), giro: azar(-0.5, 0.5),
        forma: Math.random() < 0.65 ? "corazon" : "petalo", t: azar(6, 13), color: Math.random() < 0.5 ? "rosa" : "pastel", vida: azar(0.8, 1),
      });
    }
  };

  /* Cursor y toques */
  addEventListener("pointermove", e => { cursor.x = e.clientX; cursor.y = e.clientY; cursor.activo = e.pointerType !== "touch"; }, { passive: true });
  addEventListener("pointerleave", () => { cursor.activo = false; });
  document.addEventListener("click", e => {
    const el = e.target.closest && e.target.closest("[data-chispas]");
    if (el) window.chispas(e.clientX, e.clientY);
  });

  /* Una lluvia de corazones desde abajo */
  window.lluvia = function (olas = 14) {
    for (let i = 0; i < olas; i++) {
      setTimeout(() => window.chispas(azar(ancho * 0.08, ancho * 0.92), alto * 0.95, 10), i * 170);
    }
  };

  /* Secreto: escribe "te amo" en cualquier página (sin estar en un campo de texto) */
  let teclas = "";
  document.addEventListener("keydown", e => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) || e.target.isContentEditable) return;
    if (e.key.length !== 1) return;
    teclas = (teclas + e.key.toLowerCase()).slice(-6);
    if (/teamo$|te amo$/.test(teclas)) { teclas = ""; window.lluvia(); }
  });

  addEventListener("resize", medir);
  document.addEventListener("visibilitychange", () => {
    corriendo = !document.hidden;
    if (corriendo) { ultimo = performance.now(); requestAnimationFrame(cuadro); }
  });
  new MutationObserver(leerPaleta).observe(document.documentElement, { attributes: true, attributeFilter: ["data-modo", "data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => setTimeout(leerPaleta, 0));

  leerPaleta(); medir();
  requestAnimationFrame(cuadro);
})();
