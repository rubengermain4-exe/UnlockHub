/* UnlockHub home: scroll-driven motion.
   Hero: copy leaves, the padlock moves to the centre, the shackle pops and swings open,
   the keyhole lights up, then the camera flies through the keyhole into the page. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- manifesto: words light up as you read ---------- */
  const scrub = document.querySelector("[data-scrub]");
  let words = [];
  if (scrub && !reduce) {
    const text = scrub.textContent.trim();
    scrub.setAttribute("aria-label", text);
    scrub.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="w" aria-hidden="true">${w}</span>`)
      .join(" ");
    words = [...scrub.querySelectorAll(".w")];
  }

  const hero = document.querySelector(".hero");
  const stage = hero && hero.querySelector(".hero-stage");
  const lock = hero && hero.querySelector(".lock");
  const apps = document.querySelector(".apps");
  const dots = apps ? [...apps.querySelectorAll(".app-dot")] : [];
  const strikes = [...document.querySelectorAll(".avoid-list span")];

  /* seeded scatter for the app icons, stable between visits */
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const scatter = dots.map((_, i) => {
    const a = rnd() * Math.PI * 2;
    const d = 0.55 + rnd() * 0.65;
    return { a, d, rot: (rnd() - 0.5) * 70, sc: 0.35 + rnd() * 0.35, delay: (i % 7) * 0.018 + Math.floor(i / 7) * 0.03 };
  });

  let vw = innerWidth, vh = innerHeight;
  let heroTop = 0, heroLen = 1, lockRest = null, keyR = 20;
  let appsTop = 0, appsLen = 1, appsSticky = true;

  function measure() {
    vw = innerWidth;
    vh = innerHeight;
    if (hero) {
      heroTop = hero.getBoundingClientRect().top + scrollY;
      heroLen = Math.max(1, hero.offsetHeight - vh);
      const prev = lock.style.transform;
      lock.style.transform = "none";
      const r = lock.getBoundingClientRect();
      lock.style.transform = prev;
      // keyhole centre sits at 50% / 62.4% of the lock box; its inner circle radius is 20/300 of the width
      const st = stage.getBoundingClientRect();
      lockRest = { cx: r.left + r.width / 2, cy: r.top - st.top + r.height * 0.624, w: r.width };
      keyR = (20 / 300) * r.width;
    }
    if (apps) {
      appsTop = apps.getBoundingClientRect().top + scrollY;
      appsSticky = getComputedStyle(apps.querySelector(".apps-stage")).position === "sticky";
      appsLen = appsSticky ? Math.max(1, apps.offsetHeight - vh) : vh * 0.9;
    }
  }

  let target = 0, current = -1, running = false;

  function renderHero(p) {
    // the last ~13% of the hero is overlapped by the next section, so the fly-through ends at .87
    const out = easeInOut(seg(p, 0, 0.14));
    const pop = easeOut(seg(p, 0.12, 0.19));
    const swing = easeInOut(seg(p, 0.18, 0.3));
    const lit = easeOut(seg(p, 0.27, 0.36));
    const w = seg(p, 0.31, 0.41);
    const zoomT = seg(p, 0.56, 0.88);
    const zoom = easeIn(zoomT);

    stage.style.setProperty("--out", out.toFixed(4));
    stage.style.setProperty("--pop", pop.toFixed(4));
    stage.style.setProperty("--swing", swing.toFixed(4));
    stage.style.setProperty("--lit", lit.toFixed(4));
    stage.style.setProperty("--w", (w * (1 - seg(p, 0.53, 0.58))).toFixed(4));
    stage.style.setProperty("--glow", (1 - seg(zoomT, 0, 0.3)).toFixed(4));
    stage.style.setProperty("--shadow", (1 - seg(zoomT, 0, 0.22)).toFixed(4));
    stage.style.setProperty("--cue", (1 - seg(p, 0, 0.05)).toFixed(3));

    // glide to the centre while the copy leaves, then line the keyhole up with the screen centre
    const cx = vw / 2, cy = vh / 2;
    const gx = (cx - lockRest.cx) * out;
    const restScreenY = lockRest.cy; // keyhole y inside the sticky stage
    const midY = vh * (vw < 761 ? 0.5 : 0.555);
    const gy = (midY - restScreenY) * out;
    const scaleUp = 1 + 0.04 * out;
    const need = (Math.hypot(vw, vh) / 2 / (keyR * scaleUp)) * 1.25;
    const s = scaleUp * lerp(1, need, zoom);
    const zy = (cy - midY) * easeInOut(zoomT);
    lock.style.transform = `translate3d(${gx.toFixed(2)}px, ${(gy + zy).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;

    hero.classList.toggle("is-zooming", zoomT > 0.3);
    const through = p >= 0.882;
    hero.classList.toggle("is-through", through);
    hero.dataset.theme = zoomT > 0.82 ? "light" : "dark";
  }

  function renderWords() {
    if (!words.length) return;
    const r = scrub.getBoundingClientRect();
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.32));
    const n = words.length;
    for (let i = 0; i < n; i++) {
      const o = clamp(p * (n + 6) - i, 0, 6) / 6;
      words[i].style.opacity = (0.16 + 0.84 * o).toFixed(3);
    }
  }

  function renderApps() {
    if (!dots.length) return;
    let p;
    if (appsSticky) p = clamp((scrollY - appsTop) / appsLen);
    else p = clamp((vh * 1.05 - apps.getBoundingClientRect().top) / appsLen);
    const R = Math.max(vw, vh) * 0.55;
    dots.forEach((el, i) => {
      const s = scatter[i];
      const t = easeOut(seg(p, 0.04 + s.delay, (appsSticky ? 0.62 : 0.8) + s.delay));
      const k = 1 - t;
      el.style.setProperty("--tx", (Math.cos(s.a) * R * s.d * k).toFixed(1) + "px");
      el.style.setProperty("--ty", (Math.sin(s.a) * R * 0.75 * s.d * k).toFixed(1) + "px");
      el.style.setProperty("--rot", (s.rot * k).toFixed(2) + "deg");
      el.style.setProperty("--sc", lerp(s.sc, 1, t).toFixed(3));
      el.style.setProperty("--op", clamp(t * 1.8).toFixed(3));
    });
  }

  function renderStrikes() {
    strikes.forEach((el) => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const k = clamp((vh * 0.78 - mid) / (vh * 0.3));
      el.style.setProperty("--k", easeInOut(k).toFixed(3));
    });
  }

  function tick() {
    target = scrollY;
    if (current < 0) current = target;
    // a touch of inertia on the hero only, so the unlock feels physical
    current += (target - current) * 0.2;
    if (Math.abs(target - current) < 0.4) current = target;
    if (hero && lockRest) renderHero(clamp((current - heroTop) / heroLen));
    renderWords();
    renderApps();
    renderStrikes();
    if (current !== target) requestAnimationFrame(tick);
    else running = false;
  }
  function kick() {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  if (!reduce) {
    measure();
    kick();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", () => { measure(); kick(); });
    addEventListener("load", () => { measure(); kick(); });
    if (document.fonts) document.fonts.ready.then(() => { measure(); kick(); });
  }

  /* ---------- latest guides rail ---------- */
  const rail = document.querySelector(".rail");
  if (rail) {
    const prev = document.querySelector('[data-rail="prev"]');
    const next = document.querySelector('[data-rail="next"]');
    const items = [...rail.children];
    items.forEach((li, i) => li.style.setProperty("--i", i));
    const step = () => (items[0] ? items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 24) : 320);
    const sync = () => {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    };
    prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }));
    next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }));
    rail.addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync);
    sync();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { rail.classList.add("is-in"); io.disconnect(); }
    }), { threshold: 0.15 });
    io.observe(rail);
  }

  /* ---------- finale: the small padlock opens when it comes into view ---------- */
  const finale = document.querySelector(".finale");
  if (finale) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { finale.classList.add("is-in"); io.disconnect(); }
    }), { threshold: 0.4 });
    io.observe(finale);
  }
})();
