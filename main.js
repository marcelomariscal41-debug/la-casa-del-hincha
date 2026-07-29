(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const $  = (s, sc) => (sc || document).querySelector(s);
  const $$ = (s, sc) => Array.from((sc || document).querySelectorAll(s));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---------- placeholder / card markup ---------- */
  function shirtSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">' +
      '<path d="M8 3L4 6l2 3 2-1v10h8V8l2 1 2-3-4-3-2 2H10L8 3z"/></svg>';
  }
  function cardHTML(p) {
    const hasImg = p.photo && p.photo.trim() !== "";
    const media = hasImg
      ? '<img src="' + escHTML(p.photo) + '" alt="' + escHTML(p.name) + '" loading="lazy" decoding="async" />'
      : '<div class="card__ph">' + shirtSVG() + '<small>Foto próximamente</small></div>';
    const badge = p.tag ? '<span class="card__badge">' + escHTML(p.tag) + '</span>' : "";
    return '' +
      '<article class="card" data-cat="' + escHTML(p.cat) + '">' +
        '<div class="card__media">' + badge +
          '<button class="card__fav" aria-label="Guardar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21C5 16 3 12 3 8.5 3 6 5 4 7.5 4c1.7 0 3 .9 4.5 2.5C13.5 4.9 14.8 4 16.5 4 19 4 21 6 21 8.5c0 3.5-2 7.5-9 12.5z"/></svg>' +
          '</button>' + media +
        '</div>' +
        '<div class="card__body">' +
          '<span class="card__team">' + escHTML(p.team) + '</span>' +
          '<span class="card__name">' + escHTML(p.name) + '</span>' +
          '<div class="card__foot">' +
            '<span class="card__price">Bs ' + escHTML(p.price) + ' <span>c/u</span></span>' +
            '<span class="card__add">Pedir</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------- mounts ---------- */
  function mountFeatured() {
    const t = $("[data-featured]");
    if (!t || t.children.length > 0 || !data.products) return;
    t.innerHTML = data.products.slice(0, 8).map(cardHTML).join("");
    $$(".card", t).forEach((c, i) => { c.classList.add("reveal"); c.classList.add("d" + ((i % 4) + 1)); });
  }
  function mountCatalog() {
    const t = $("[data-catalog]");
    if (!t || t.children.length > 0 || !data.products) return;
    t.innerHTML = data.products.map(cardHTML).join("");
  }
  function mountFilters() {
    const t = $("[data-filters]");
    if (!t || t.children.length > 0 || !data.categories) return;
    t.innerHTML = data.categories.map((c, i) =>
      '<button data-filter="' + escHTML(c.id) + '"' + (i === 0 ? ' class="is-active"' : "") + '>' + escHTML(c.label) + '</button>'
    ).join("");
  }

  /* ---------- catalog filtering ---------- */
  function initCatalog() {
    const grid = $("[data-catalog]");
    const filters = $("[data-filters]");
    if (!grid || !filters) return;
    const label = $("[data-count-label]");
    const cards = $$(".card", grid);

    function apply(cat) {
      let n = 0;
      cards.forEach(card => {
        const show = cat === "todos" || card.dataset.cat === cat;
        card.classList.toggle("is-hidden", !show);
        if (show) n++;
      });
      if (label) label.textContent = n + (n === 1 ? " modelo" : " modelos");
    }
    filters.addEventListener("click", e => {
      const b = e.target.closest("[data-filter]");
      if (!b) return;
      $$("button", filters).forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      apply(b.dataset.filter);
    });
    apply("todos");

    // deep-link (index footer / hash)
    const jump = location.hash.replace("#", "");
    const validCats = (data.categories || []).map(c => c.id);
    if (jump && validCats.indexOf(jump) !== -1) {
      const btn = filters.querySelector('[data-filter="' + jump + '"]');
      if (btn) btn.click();
    }
    // footer data-jump links
    $$("[data-jump]").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const btn = filters.querySelector('[data-filter="' + a.dataset.jump + '"]');
        if (btn) { btn.click(); document.getElementById("catalogo").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveals() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    items.forEach(i => io.observe(i));
    // safety net
    setTimeout(() => {
      $$(".reveal:not(.is-visible)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.2) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- count up ---------- */
  function initCount() {
    const nums = $$("[data-count]");
    if (!nums.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1500; const start = performance.now();
      const suffix = target >= 1000 ? "" : "";
      function tick(t) {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        let val = Math.round(target * eased);
        el.textContent = val >= 1000 ? val.toLocaleString("es-BO") : val;
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if (reduced || !("IntersectionObserver" in window)) { nums.forEach(n => n.textContent = (+n.dataset.count).toLocaleString("es-BO")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- nav scroll state ---------- */
  function initNav() {
    const nav = $("[data-nav]");
    if (!nav) return;
    if (nav.hasAttribute("data-nav-solid")) return; // catálogo: siempre sólida
    const hero = $(".hero");
    const threshold = () => (hero ? hero.offsetHeight - 90 : 120);
    const onScroll = () => {
      if (window.scrollY > threshold()) { nav.classList.add("nav--solid"); nav.classList.remove("nav--over"); }
      else { nav.classList.remove("nav--solid"); nav.classList.add("nav--over"); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- burger (scroll to menu / simple toggle) ---------- */
  function initBurger() {
    const b = $("[data-burger]");
    if (!b) return;
    b.addEventListener("click", () => { location.href = "catalogo.html"; });
  }

  /* ---------- hero parallax (subtle) ---------- */
  function initHeroParallax() {
    if (reduced) return;
    const img = $(".hero__img");
    const hero = $(".hero");
    if (!img || !hero) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        if (r.bottom > 0) {
          const p = Math.min(1, Math.max(0, -r.top / hero.offsetHeight));
          img.style.transform = "scale(" + (1 + p * 0.06) + ") translateY(" + (p * 26) + "px)";
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- smooth anchor scroll ---------- */
  function initSmoothScroll() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 80,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------- splash ---------- */
  function initSplash() {
    const splash = $("[data-splash]");
    if (!splash) return;
    const hide = () => splash.classList.add("is-out");
    if (document.readyState === "complete") setTimeout(hide, 650);
    else window.addEventListener("load", () => setTimeout(hide, 500));
    setTimeout(hide, 3500);
  }

  /* ---------- WhatsApp ---------- */
  var WA = "59175136016";
  function waUrl(msg) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); }

  function initWaLinks() {
    var restore = document.querySelector("[data-wa-restore]");
    if (restore) restore.href = waUrl("Hola La Casa del Hincha, me gustaria restaurar mi camiseta. Me pueden ayudar?");
    var floatWa = document.querySelector("[data-wa-float]");
    if (floatWa) floatWa.href = waUrl("Hola La Casa del Hincha, quiero hacer una consulta.");
  }

  /* ---------- Formulario de pedido → WhatsApp ---------- */
  function initOrderForm() {
    var form = document.querySelector("[data-order-form]");
    if (!form) return;
    var pers = form.querySelector("[data-pers]");
    var persFields = form.querySelector("[data-pers-fields]");
    if (pers && persFields) {
      var sync = function () { persFields.classList.toggle("is-hidden", pers.value !== "Sí"); };
      pers.addEventListener("change", sync); sync();
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var g = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
      var lines = [];
      lines.push("Hola La Casa del Hincha, quiero hacer un pedido especial:");
      lines.push("");
      lines.push("Nombre: " + g("nombre"));
      lines.push("Camiseta: " + g("modelo"));
      lines.push("Talla: " + g("talla"));
      lines.push("Cantidad: " + g("cantidad"));
      if (g("personalizar") === "Sí") {
        lines.push("Personalizacion: " + (g("dorsal_nombre") || "(nombre)") + " - N " + (g("dorsal_numero") || "(numero)"));
      } else {
        lines.push("Personalizacion: No");
      }
      var notas = g("notas");
      if (notas) lines.push("Notas: " + notas);
      lines.push("");
      lines.push("Entiendo que pago el 50% al confirmar y el 50% al recibir, y que llega en 2 semanas. Me confirman disponibilidad?");
      window.open(waUrl(lines.join("\n")), "_blank");
    });
  }

  /* ---------- Testimonios: duplicar para loop infinito ---------- */
  function initTestiCarousel() {
    $$("[data-testi-track]").forEach(function (track) {
      if (track.dataset.cloned) return;
      var kids = Array.prototype.slice.call(track.children);
      kids.forEach(function (k) {
        var c = k.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.tabIndex = -1;
        track.appendChild(c);
      });
      track.dataset.cloned = "1";
    });
  }

  /* ---------- Lightbox testimonios ---------- */
  function initLightbox() {
    var lb = document.querySelector("[data-lightbox]");
    if (!lb) return;
    var img = lb.querySelector("img");
    var closeBtn = lb.querySelector("[data-lb-close]");
    function open(src, alt) {
      img.src = src; img.alt = alt || "Testimonio";
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = ""; img.removeAttribute("src");
    }
    document.addEventListener("click", function (e) {
      var card = e.target.closest(".tcard");
      if (card) {
        var im = card.querySelector("img");
        if (im && im.getAttribute("src")) open(im.currentSrc || im.src, im.alt);
        return;
      }
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---------- Carrusel de cuidados (coverflow) ---------- */
  function initCareCarousel() {
    var root = document.querySelector("[data-care]");
    if (!root) return;
    var track = root.querySelector("[data-care-track]");
    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;
    var current = Math.min(1, slides.length - 1); // arranca mostrando el 2do centrado da sensación de galería
    current = 0;

    function layout() {
      var slide = slides[current];
      var center = root.clientWidth / 2;
      var target = slide.offsetLeft + slide.offsetWidth / 2;
      track.style.transform = "translateX(" + (center - target) + "px)";
      slides.forEach(function (s, i) { s.classList.toggle("is-current", i === current); });
    }
    function go(i) { current = (i + slides.length) % slides.length; layout(); }

    var prev = root.parentNode.querySelector("[data-care-prev]");
    var next = root.parentNode.querySelector("[data-care-next]");
    if (prev) prev.addEventListener("click", function () { go(current - 1); });
    if (next) next.addEventListener("click", function () { go(current + 1); });
    slides.forEach(function (s, i) { s.addEventListener("click", function () { if (i !== current) go(i); }); });

    // soporte swipe táctil
    var startX = null;
    root.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
      startX = null;
    });

    window.addEventListener("resize", layout);
    layout();
    setTimeout(layout, 300); // recalcula tras cargar fuentes/imágenes
    window.addEventListener("load", layout);
  }

  /* ---------- misc ---------- */
  function initYear() { $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear()); }

  function boot() {
    safe(mountFeatured, "mountFeatured");
    safe(mountCatalog, "mountCatalog");
    safe(mountFilters, "mountFilters");
    safe(initCatalog, "initCatalog");
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initBurger, "initBurger");
    safe(initReveals, "initReveals");
    safe(initCount, "initCount");
    safe(initHeroParallax, "initHeroParallax");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initWaLinks, "initWaLinks");
    safe(initOrderForm, "initOrderForm");
    safe(initTestiCarousel, "initTestiCarousel");
    safe(initCareCarousel, "initCareCarousel");
    safe(initLightbox, "initLightbox");
    safe(initYear, "initYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
