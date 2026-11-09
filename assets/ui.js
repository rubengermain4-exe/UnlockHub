/* UnlockHub shared behaviour: navigation, search palette, reveals, title lines, table of contents.
   Pages work without it; this only adds motion and the global search. */
(() => {
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const script = document.currentScript;
  const ROOT = script ? new URL("..", script.src).href : new URL("./", location.href).href;
  const nav = document.querySelector("[data-nav]");
  const isHome = document.body.classList.contains("is-home");

  /* ---------- nav: colour follows the section under it ---------- */
  let darks = [];
  const collectDarks = () => (darks = [...document.querySelectorAll('[data-theme="dark"]')]);
  collectDarks();
  function navState() {
    if (!nav) return;
    const y = nav.offsetHeight / 2;
    let dark = false;
    for (const el of darks) {
      if (el.dataset.theme !== "dark") continue;
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) { dark = true; break; }
    }
    nav.classList.toggle("on-dark", dark && !doc.classList.contains("nav-open"));
    nav.classList.toggle("is-top", isHome && scrollY < 8);
  }
  let navTick = false;
  addEventListener("scroll", () => {
    if (navTick) return;
    navTick = true;
    requestAnimationFrame(() => { navState(); navTick = false; });
  }, { passive: true });
  addEventListener("resize", navState);
  navState();
  // the home hero flips its theme while flying through the keyhole
  new MutationObserver(navState).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const sheet = document.getElementById("nav-sheet");
  function setMenu(open) {
    doc.classList.toggle("nav-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
    if (sheet) sheet.inert = !open;
    navState();
  }
  if (sheet) sheet.inert = true;
  if (toggle) toggle.addEventListener("click", () => setMenu(!doc.classList.contains("nav-open")));
  if (sheet) sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  /* ---------- reveals ---------- */
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  if (reveals.length) {
    if (reduce || !("IntersectionObserver" in window)) reveals.forEach((el) => el.classList.add("is-in"));
    else {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ---------- titles rise line by line, once ---------- */
  function splitLines(el) {
    const original = el.innerHTML;
    const tokens = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        // split on breakable spaces only: no-break spaces (French punctuation) stay glued to their word
        node.textContent.split(/([ \t\n\r]+)/).forEach((t) => { if (t) tokens.push(/[^ \t\n\r]/.test(t) ? { text: t } : { space: true }); });
      } else if (node.nodeName === "BR") tokens.push({ br: true });
      else tokens.push({ html: node.outerHTML });
    });
    el.innerHTML = tokens.map((t) => t.space ? " " : t.br ? "<br>" : `<span class="tok">${t.text ?? t.html}</span>`).join("");
    // group tokens by rendered line, keeping spaces only where the source had them
    const lines = [];
    let top = null;
    el.childNodes.forEach((n) => {
      if (n.nodeType === 1 && n.classList.contains("tok")) {
        const y = Math.round(n.offsetTop);
        if (top === null || Math.abs(y - top) > 4) { lines.push([]); top = y; }
        lines[lines.length - 1].push(n.innerHTML);
      } else if (n.nodeType === 3 && lines.length) lines[lines.length - 1].push(" ");
    });
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    el.innerHTML = lines.map((l, i) => `<span class="split-line" aria-hidden="true" style="--l:${i}"><span>${l.join("").trim()}</span></span>`).join("");
    el.classList.add("is-splitting");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add("is-split");
      const total = 1000 + lines.length * 90 + 120;
      setTimeout(() => {
        el.innerHTML = original;
        el.removeAttribute("aria-label");
        el.classList.remove("is-splitting", "is-split");
      }, total);
    }));
  }
  if (!reduce) {
    const titles = [...document.querySelectorAll("[data-split]")];
    if (titles.length) {
      const go = () => titles.forEach(splitLines);
      (document.fonts && document.fonts.status !== "loaded") ? document.fonts.ready.then(go) : go();
    }
  }

  /* ---------- table of contents follows the reading position ---------- */
  const tocLinks = [...document.querySelectorAll(".toc a[href^='#']")];
  if (tocLinks.length) {
    const pairs = tocLinks.map((a) => [document.getElementById(decodeURIComponent(a.hash.slice(1))), a]).filter(([t]) => t);
    let ticking = false;
    const spy = () => {
      ticking = false;
      let current = null;
      for (const [t, a] of pairs) if (t.getBoundingClientRect().top < innerHeight * 0.35) current = a;
      tocLinks.forEach((a) => a.classList.toggle("is-current", a === current));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  /* ---------- instant navigation where the browser supports it ---------- */
  if (HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules") && location.protocol.startsWith("http")) {
    const rules = document.createElement("script");
    rules.type = "speculationrules";
    rules.textContent = JSON.stringify({ prerender: [{ where: { and: [{ href_matches: "/*" }, { not: { selector_matches: "[target=_blank]" } }] }, eagerness: "moderate" }] });
    document.head.appendChild(rules);
  }

  /* ---------- global search palette ---------- */
  const fold = (s) => [...String(s)].map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() || " ").join("");
  // for matching, hyphens and apostrophes vanish so "wifi" finds "Wi-Fi"
  const squash = (s) => fold(s).replace(/[-‐’'.]/g, "");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ICONS = {
    guide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>',
    cat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>',
    page: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  };
  let palette, input, list, items = [], sel = 0, index = null, lastFocus = null;

  function loadIndex() {
    if (index || window.UH_INDEX) return Promise.resolve((index = window.UH_INDEX));
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = ROOT + "assets/search-index.js";
      s.onload = () => res((index = window.UH_INDEX));
      s.onerror = () => res((index = { guides: [], apps: [], cats: [], pages: [] }));
      document.head.appendChild(s);
    });
  }

  function build() {
    palette = document.createElement("div");
    palette.className = "palette";
    palette.setAttribute("role", "dialog");
    palette.setAttribute("aria-modal", "true");
    palette.setAttribute("aria-label", "Rechercher");
    palette.innerHTML =
      '<div class="palette-backdrop" data-close></div>' +
      '<div class="palette-panel">' +
      '<label class="palette-field"><span class="sr-only">Rechercher un guide ou un logiciel</span>' +
      '<input type="search" autocomplete="off" spellcheck="false" placeholder="Rechercher un guide ou un logiciel…" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"><kbd>Échap</kbd></label>' +
      '<div class="palette-results" id="palette-list" role="listbox" aria-label="Résultats"></div>' +
      '<div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd>naviguer</span><span><kbd>Entrée</kbd>ouvrir</span><span><kbd>Échap</kbd>fermer</span></div>' +
      "</div>";
    document.body.appendChild(palette);
    input = palette.querySelector("input");
    list = palette.querySelector(".palette-results");
    palette.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closePalette(); });
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        mark();
      } else if (e.key === "Enter") {
        const a = items[sel];
        if (a) { e.preventDefault(); location.href = a.href; }
      } else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    });
    list.addEventListener("mousemove", (e) => {
      const a = e.target.closest(".palette-item");
      if (a) { const i = items.indexOf(a); if (i !== sel) { sel = i; mark(false); } }
    });
  }

  function highlight(title, q) {
    const tokens = fold(q).split(/\s+/).filter(Boolean);
    const f = fold(title);
    let best = null;
    tokens.forEach((t) => { const i = f.indexOf(t); if (i >= 0 && (!best || t.length > best[1])) best = [i, t.length]; });
    if (!best) return esc(title);
    const chars = [...title];
    return esc(chars.slice(0, best[0]).join("")) + "<mark>" + esc(chars.slice(best[0], best[0] + best[1]).join("")) + "</mark>" + esc(chars.slice(best[0] + best[1]).join(""));
  }

  function score(entry, tokens) {
    const t = squash(entry.t), hay = squash(entry.t + " " + (entry.d || "") + " " + (entry.k || ""));
    let s = 0;
    for (const tok of tokens) {
      if (!hay.includes(tok)) return -1;
      if (t.startsWith(tok)) s += 6;
      else if (new RegExp("\\b" + tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(t)) s += 4;
      else if (t.includes(tok)) s += 2;
      else s += 1;
    }
    return s;
  }

  function render() {
    const q = input.value.trim();
    const tokens = squash(q).split(/\s+/).filter(Boolean);
    const groups = [];
    const pick = (arr, max) => {
      if (!tokens.length) return arr.slice(0, max);
      return arr.map((e) => [score(e, tokens), e]).filter(([s]) => s >= 0).sort((a, b) => b[0] - a[0]).slice(0, max).map(([, e]) => e);
    };
    if (!index) { list.innerHTML = '<p class="palette-empty">Chargement…</p>'; return; }
    const g = pick(index.guides, tokens.length ? 7 : 5);
    const a = pick(index.apps, tokens.length ? 6 : 4);
    const c = pick(index.cats, tokens.length ? 3 : 0);
    const p = tokens.length ? pick(index.pages, 2) : [];
    if (g.length) groups.push(["Guides", g, "guide"]);
    if (a.length) groups.push(["Logiciels", a, "app"]);
    if (c.length) groups.push(["Dossiers", c, "cat"]);
    if (p.length) groups.push(["Pages", p, "page"]);
    if (!groups.length) {
      list.innerHTML = `<p class="palette-empty">Aucun résultat pour « ${esc(q)} ». Essaie « blender », « wifi » ou « cv ».</p>`;
      items = [];
      return;
    }
    let html = "", n = 0;
    groups.forEach(([label, arr, kind]) => {
      html += `<p class="palette-group" role="presentation">${tokens.length ? label : label === "Guides" ? "Guides à la une" : "Logiciels populaires"}</p>`;
      arr.forEach((e) => {
        const icon = kind === "app" ? `<img src="${ROOT}${e.i}" alt="" width="22" height="22">` : ICONS[kind];
        html += `<a class="palette-item" role="option" id="pi-${n}" href="${ROOT}${e.u}"><span class="p-icon">${icon}</span><span class="p-text"><span class="p-title">${highlight(e.t, q)}</span><span class="p-sub">${esc(e.s || "")}</span></span></a>`;
        n++;
      });
    });
    list.innerHTML = html;
    items = [...list.querySelectorAll(".palette-item")];
    sel = 0;
    mark();
  }

  function mark(scroll = true) {
    items.forEach((a, i) => a.setAttribute("aria-selected", String(i === sel)));
    if (items[sel]) {
      input.setAttribute("aria-activedescendant", items[sel].id);
      if (scroll) items[sel].scrollIntoView({ block: "nearest" });
    }
  }

  function openPalette(prefill = "") {
    if (!palette) build();
    lastFocus = document.activeElement;
    setMenu(false);
    palette.classList.add("is-open");
    doc.style.overflow = "hidden";
    input.value = prefill;
    requestAnimationFrame(() => input.focus());
    render();
    loadIndex().then(render);
  }
  function closePalette() {
    if (!palette || !palette.classList.contains("is-open")) return;
    palette.classList.remove("is-open");
    doc.style.overflow = "";
    input.blur();
    if (lastFocus && lastFocus !== document.body && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-palette]");
    if (t) { e.preventDefault(); openPalette(); }
  });
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openPalette(); return; }
    if (e.key === "/" && !typing) { e.preventDefault(); openPalette(); return; }
    if (e.key === "Escape") {
      if (palette && palette.classList.contains("is-open")) closePalette();
      else if (doc.classList.contains("nav-open")) setMenu(false);
    }
  });
  // warm the index when the pointer heads for the search button
  document.addEventListener("pointerover", (e) => { if (e.target.closest && e.target.closest("[data-palette]")) loadIndex(); }, { passive: true });
})();
