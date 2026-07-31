/* shop.js — catálogo, destacados (home), producto, reseñas, carrito y checkout */
(function () {
  "use strict";
  var LCH = window.LCH;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };

  // Filtro básico de lenguaje no permitido (sexual, armas, drogas, insultos)
  var BAD = ["porno","xxx"," sexo","sexual","desnud","pene","vagina","tetas"," culo","pija","concha ","zorra","maricon","puta","puto","mierda","verga","coño","pornograf","nazi","hitler","arma","pistola","fusil","rifle","escopeta","bala","droga","cocain","marihuana","cochabamba no","matar","violar","violacion","pedofil"];
  function badText(s) { s = " " + String(s || "").toLowerCase() + " "; return BAD.some(function (w) { return s.indexOf(w) >= 0; }); }

  var PAGE = 8;
  var grid = $("[data-shop-grid]");        // catálogo completo (catalogo.html)
  var featGrid = $("[data-shop-featured]"); // destacados (index.html)
  var moreWrap = $("[data-load-more-wrap]");
  var state = { search: "", cats: [], sizes: [], promo: false, shown: 0 };
  var ALL = [];

  if (!LCH || !LCH.configured) {
    if (grid) grid.innerHTML = '<div class="shop-empty">La tienda todavía no está conectada a la base de datos.<br>' +
      'Configura Supabase (ver GUIA-SUPABASE.md) para ver los productos.</div>';
    if (featGrid) featGrid.innerHTML = '<div class="shop-empty">Conecta Supabase para mostrar productos aquí.</div>';
    bindCartUI();
    return;
  }

  /* ---------------- helpers ---------------- */
  function priceHtml(p) {
    if (p.is_promo && p.price_old) {
      return '<span class="old">' + LCH.fmt(p.price_old) + '</span><span class="promo">' + LCH.fmt(p.price) + '</span>';
    }
    return LCH.fmt(p.price);
  }
  function starStr(avg) { var f = Math.round(avg), s = ""; for (var i = 1; i <= 5; i++) s += i <= f ? "★" : "☆"; return s; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------------- filtrado (cliente) ---------------- */
  function filtered() {
    var q = state.search.toLowerCase();
    return ALL.filter(function (p) {
      if (state.cats.length && !state.cats.some(function (c) { return (p.categories || []).indexOf(c) >= 0; })) return false;
      if (state.sizes.length && !state.sizes.some(function (s) { return (p.sizes || []).indexOf(s) >= 0; })) return false;
      if (state.promo && !p.is_promo) return false;
      if (q) {
        var hay = ((p.name || "") + " " + (p.team || "") + " " + (p.description || "") + " " + (p.categories || []).join(" ")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function renderCatalog(reset) {
    if (!grid) return;
    var list = filtered();
    if (reset) { state.shown = 0; grid.innerHTML = ""; }
    if (!list.length) { grid.innerHTML = '<div class="shop-empty">No encontramos productos con esos filtros.</div>'; moreWrap.classList.add("hidden"); updateCount(list.length); return; }
    var slice = list.slice(state.shown, state.shown + PAGE);
    slice.forEach(function (p) { grid.appendChild(cardEl(p)); });
    state.shown += slice.length;
    moreWrap.classList.toggle("hidden", state.shown >= list.length);
    updateCount(list.length);
    loadCardRatings(slice);
  }
  function updateCount(n) {
    var cnt = $("[data-shop-count]");
    if (cnt) cnt.textContent = n + (n === 1 ? " producto" : " productos");
    var any = state.search || state.cats.length || state.sizes.length || state.promo;
    var clr = $("[data-clear]"); if (clr) clr.classList.toggle("hidden", !any);
  }

  function renderFeatured() {
    if (!featGrid) return;
    var list = shuffle(ALL.slice()).slice(0, 8);
    featGrid.innerHTML = "";
    if (!list.length) { featGrid.innerHTML = '<div class="shop-empty">Pronto verás nuestros productos aquí.</div>'; return; }
    list.forEach(function (p) { featGrid.appendChild(cardEl(p)); });
    loadCardRatings(list);
  }

  /* ---------------- tarjeta ---------------- */
  function cardEl(p) {
    var el = document.createElement("article");
    el.className = "pcard";
    var img = (p.images && p.images[0])
      ? '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '" loading="lazy" />'
      : '<div class="pcard__ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8 3L4 6l2 3 2-1v10h8V8l2 1 2-3-4-3-2 2H10L8 3z"/></svg></div>';
    el.innerHTML =
      '<div class="pcard__media" data-open="1">' + (p.is_promo ? '<span class="pcard__promo">Promo</span>' : '') + img + '</div>' +
      '<div class="pcard__body">' +
        '<span class="pcard__team">' + esc(p.team || "") + '</span>' +
        '<span class="pcard__name" data-open="1">' + esc(p.name) + '</span>' +
        '<span class="pcard__stars" data-stars="' + p.id + '"></span>' +
        '<span class="pcard__price">' + priceHtml(p) + '</span>' +
        '<div class="pcard__btns">' +
          '<button class="pbtn pbtn--buy" data-buy="1">Comprar</button>' +
          '<button class="pbtn pbtn--cart" data-add="1" aria-label="Añadir al carrito">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/></svg></button>' +
        '</div>' +
      '</div>';
    $$("[data-open]", el).forEach(function (n) { n.addEventListener("click", function () { openProduct(p); }); });
    el.querySelector("[data-buy]").addEventListener("click", function () { openProduct(p); });
    el.querySelector("[data-add]").addEventListener("click", function () { openProduct(p); });
    return el;
  }

  async function loadCardRatings(products) {
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var slot = $('[data-stars="' + p.id + '"]');
      if (!slot) continue;
      var r = await LCH.productRating(p.id);
      if (r.count) slot.innerHTML = '<span style="color:#e6a700">' + starStr(r.avg) + '</span> ' + r.count;
    }
  }

  /* ---------------- filtros (solo catálogo) ---------------- */
  if (grid) {
    var searchTimer;
    var si = $("[data-search]");
    if (si) si.addEventListener("input", function () {
      clearTimeout(searchTimer); var v = this.value.trim();
      searchTimer = setTimeout(function () { state.search = v; renderCatalog(true); }, 250);
    });
    $$("[data-cat]").forEach(function (b) { b.addEventListener("click", function () {
      b.classList.toggle("is-on"); toggleArr(state.cats, b.dataset.cat); renderCatalog(true);
    }); });
    $$("[data-size]").forEach(function (b) { b.addEventListener("click", function () {
      b.classList.toggle("is-on"); toggleArr(state.sizes, b.dataset.size); renderCatalog(true);
    }); });
    var pf = $("[data-promo-filter]");
    if (pf) pf.addEventListener("click", function () { this.classList.toggle("is-on"); state.promo = this.classList.contains("is-on"); renderCatalog(true); });
    var cl = $("[data-clear]");
    if (cl) cl.addEventListener("click", function () {
      state.search = ""; state.cats = []; state.sizes = []; state.promo = false;
      if (si) si.value = ""; $$(".fchip").forEach(function (c) { c.classList.remove("is-on"); });
      renderCatalog(true);
    });
    var lm = $("[data-load-more]");
    if (lm) lm.addEventListener("click", function () { renderCatalog(false); });
  }
  function toggleArr(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

  /* ---------------- modal producto ---------------- */
  var pModal = $("[data-product-modal]"), pmInner = $("[data-pm-inner]");
  var sel = { size: null, qty: 1, cname: "", cnum: "" };

  function openProduct(p) {
    if (!pModal) return;
    sel = { size: null, qty: 1, cname: "", cnum: "" };
    var imgs = (p.images && p.images.length) ? p.images : [];
    var mainImg = imgs.length ? '<img src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '" data-pm-main />'
      : '<div class="pm__ph"><svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1"><path d="M8 3L4 6l2 3 2-1v10h8V8l2 1 2-3-4-3-2 2H10L8 3z"/></svg></div>';
    var thumbs = imgs.length > 1 ? '<div class="pm__thumbs">' + imgs.map(function (u, i) {
      return '<button class="pm__thumb' + (i === 0 ? ' is-on' : '') + '" data-thumb="' + i + '"><img src="' + esc(u) + '" alt="" /></button>';
    }).join("") + '</div>' : '';
    var sizes = (p.sizes || []).map(function (s) { return '<button class="pm__size" data-size="' + esc(s) + '">' + esc(s) + '</button>'; }).join("");
    var custom = p.allow_custom ? '<span class="pm__label">Personalización (opcional)</span>' +
      '<div class="pm__custom"><input type="text" data-cname placeholder="Nombre en la camiseta" maxlength="14" />' +
      '<input type="text" data-cnum placeholder="N°" maxlength="3" /></div>' : '';

    pmInner.innerHTML =
      '<div class="pm__gallery"><div class="pm__main">' + mainImg + '</div>' + thumbs + '</div>' +
      '<div class="pm__info">' +
        '<span class="pm__team">' + esc(p.team || "") + '</span>' +
        ((p.categories && p.categories.length) ? '<div class="pm__cats">' + p.categories.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join("") + '</div>' : '') +
        '<h2 class="pm__name">' + esc(p.name) + '</h2>' +
        '<div class="pm__stars" data-pm-stars>Sin reseñas todavía</div>' +
        '<div class="pm__price">' + priceHtml(p) + '</div>' +
        (p.description ? '<p class="pm__desc">' + esc(p.description) + '</p>' : '') +
        '<span class="pm__label">Elige tu talla</span><div class="pm__sizes">' + sizes + '</div>' +
        custom +
        '<span class="pm__label">Cantidad</span><div class="pm__qty">' +
          '<button class="qtybtn" data-qminus>−</button><span data-qval>1</span><button class="qtybtn" data-qplus>+</button></div>' +
        '<div class="pm__actions">' +
          '<button class="pbtn pbtn--cart" data-pm-add>Añadir al carrito</button>' +
          '<button class="pbtn pbtn--buy" data-pm-buy>Comprar ahora</button>' +
        '</div><div class="pm__err" data-pm-err></div>' +
      '</div><div class="reviews" data-reviews></div>';

    $$('[data-thumb]', pmInner).forEach(function (t) { t.addEventListener("click", function () {
      $("[data-pm-main]", pmInner).src = imgs[t.dataset.thumb];
      $$('[data-thumb]', pmInner).forEach(function (x) { x.classList.remove("is-on"); });
      t.classList.add("is-on");
    }); });
    // click en la foto principal -> galería ampliada con deslizar
    var mainEl = $("[data-pm-main]", pmInner);
    if (mainEl && imgs.length) {
      mainEl.style.cursor = "zoom-in";
      mainEl.addEventListener("click", function () {
        var i = imgs.indexOf(mainEl.getAttribute("src"));
        openGallery(imgs, i < 0 ? 0 : i);
      });
    }
    $$('[data-size]', pmInner).forEach(function (s) { s.addEventListener("click", function () {
      $$('[data-size]', pmInner).forEach(function (x) { x.classList.remove("is-on"); });
      s.classList.add("is-on"); sel.size = s.dataset.size; $("[data-pm-err]").textContent = "";
    }); });
    $("[data-qminus]", pmInner).addEventListener("click", function () { sel.qty = Math.max(1, sel.qty - 1); $("[data-qval]", pmInner).textContent = sel.qty; });
    $("[data-qplus]", pmInner).addEventListener("click", function () { sel.qty += 1; $("[data-qval]", pmInner).textContent = sel.qty; });
    $("[data-pm-add]", pmInner).addEventListener("click", function () { if (addSel(p)) { openCart(); closeModal(pModal); } });
    $("[data-pm-buy]", pmInner).addEventListener("click", function () { if (addSel(p)) { closeModal(pModal); openCheckout(); } });

    openModal(pModal);
    loadReviews(p);
  }

  function addSel(p) {
    var err = $("[data-pm-err]");
    if (!sel.size) { if (err) err.textContent = "Elige una talla."; return false; }
    if (p.allow_custom) { sel.cname = ($("[data-cname]", pmInner) || {}).value || ""; sel.cnum = ($("[data-cnum]", pmInner) || {}).value || ""; }
    LCH.addToCart({
      product_id: p.id, name: p.name, image: (p.images && p.images[0]) || "",
      size: sel.size, qty: sel.qty, price: p.price, allow_custom: p.allow_custom,
      custom_name: (sel.cname || "").trim(), custom_number: (sel.cnum || "").trim()
    });
    return true;
  }

  /* ---------------- reseñas ---------------- */
  async function loadReviews(p) {
    var box = $("[data-reviews]"); if (!box) return;
    var list = await LCH.fetchReviews(p.id);
    var r = await LCH.productRating(p.id);
    var starsTop = $("[data-pm-stars]");
    if (starsTop && r.count) starsTop.innerHTML = '<span style="color:#e6a700">' + starStr(r.avg) + '</span> ' + r.avg.toFixed(1) + ' · ' + r.count + ' reseña' + (r.count > 1 ? "s" : "");
    var items = list.map(function (rv) {
      return '<div class="review">' +
        (rv.photo ? '<img class="review__ph" src="' + esc(rv.photo) + '" alt="" data-lb="' + esc(rv.photo) + '" />' : '') +
        '<div><div class="review__who">' + esc(rv.author || "Cliente") + '</div>' +
        '<div class="review__stars">' + starStr(rv.rating) + '</div>' +
        (rv.comment ? '<div class="review__text">' + esc(rv.comment) + '</div>' : '') +
        '<div class="review__date">' + new Date(rv.created_at).toLocaleDateString("es-BO") + '</div></div></div>';
    }).join("");
    box.innerHTML = '<h3>Opiniones de clientes</h3>' + (items || '<p style="color:var(--ink-mute);font-size:.9rem">Todavía no hay opiniones. ¡Sé el primero en opinar!</p>') +
      '<form class="rev-form" data-rev-form>' +
      '<h4>Deja tu opinión</h4><p class="sub">Cuéntanos qué te pareció tu camiseta.</p>' +
      '<div class="star-pick" data-star-pick><span data-v="1">★</span><span data-v="2">★</span><span data-v="3">★</span><span data-v="4">★</span><span data-v="5">★</span></div>' +
      '<input type="text" data-rev-name placeholder="Tu nombre" maxlength="40" />' +
      '<textarea data-rev-comment rows="3" placeholder="Tu comentario"></textarea>' +
      '<div class="rev-file"><label>Foto (opcional): <input type="file" accept="image/*" data-rev-photo /></label></div>' +
      '<button class="pbtn pbtn--buy" type="submit" style="padding:.8rem 1.6rem">Publicar opinión</button>' +
      '<div class="pm__err" data-rev-err></div></form>';

    var pick = 5, starEls = $$('[data-star-pick] span', box);
    function paint(n) { starEls.forEach(function (s) { s.classList.toggle("on", parseInt(s.dataset.v, 10) <= n); }); }
    paint(5);
    starEls.forEach(function (s) {
      s.addEventListener("click", function () { pick = parseInt(s.dataset.v, 10); paint(pick); });
      s.addEventListener("mouseenter", function () { paint(parseInt(s.dataset.v, 10)); });
    });
    $("[data-star-pick]", box).addEventListener("mouseleave", function () { paint(pick); });
    $("[data-rev-form]", box).addEventListener("submit", async function (e) {
      e.preventDefault();
      var err = $("[data-rev-err]", box), btn = e.target.querySelector("button");
      var comment = $("[data-rev-comment]", box).value.trim();
      var name = $("[data-rev-name]", box).value.trim() || "Cliente";
      var file = $("[data-rev-photo]", box).files[0] || null;
      if (!comment && !file) { err.textContent = "Escribe un comentario o sube una foto."; return; }
      if (badText(comment) || badText(name)) { err.textContent = "Tu comentario contiene lenguaje no permitido."; return; }
      btn.disabled = true; btn.textContent = "Enviando…";
      try {
        var r = await LCH.addReview({ product_id: p.id, author: name, rating: pick, comment: comment }, file);
        if (r && r.pending) {
          box.innerHTML = '<h3>Opiniones de clientes</h3>' +
            '<p style="color:var(--ink-soft);font-size:.95rem">¡Gracias por tu opinión! Como incluye una foto, la tienda la revisará antes de publicarla.</p>';
        } else { loadReviews(p); loadCardRatings([p]); }
      }
      catch (er) { err.textContent = "No se pudo publicar. Intenta de nuevo."; btn.disabled = false; btn.textContent = "Publicar opinión"; }
    });
    $$('[data-lb]', box).forEach(function (im) { im.addEventListener("click", function () { openLb(im.dataset.lb); }); });
  }

  /* ---------------- carrito ---------------- */
  var cartModal = $("[data-cart-modal]");
  function bindCartUI() {
    $$("[data-open-cart]").forEach(function (b) { b.addEventListener("click", openCart); });
    $$("[data-close-cart]").forEach(function (b) { b.addEventListener("click", function () { closeModal(cartModal); }); });
    document.addEventListener("cart:change", renderCartCount);
    renderCartCount();
  }
  function renderCartCount() {
    var n = LCH.cartCount();
    $$("[data-cart-count]").forEach(function (b) { b.textContent = n; b.style.display = n ? "grid" : "none"; });
  }
  function openCart() { if (!cartModal) return; renderCart(); openModal(cartModal); }
  function renderCart() {
    var box = $("[data-cart-items]"), foot = $("[data-cart-foot]");
    if (!box) return;
    var cart = LCH.getCart();
    if (!cart.length) { box.innerHTML = '<div class="cart__empty">Tu carrito está vacío.</div>'; foot.innerHTML = ""; return; }
    box.innerHTML = cart.map(function (it, i) {
      var custom = (it.custom_name || it.custom_number) ? '<div class="citem__meta">Personalizado: ' + esc(it.custom_name || "") + ' ' + esc(it.custom_number || "") + '</div>' : '';
      var img = it.image ? '<img class="citem__img" src="' + esc(it.image) + '" alt="" />' : '<div class="citem__img"></div>';
      return '<div class="citem">' + img + '<div class="citem__main">' +
        '<div class="citem__name">' + esc(it.name) + '</div>' +
        '<div class="citem__meta">Talla ' + esc(it.size) + ' · ' + LCH.fmt(it.price) + '</div>' + custom +
        '<div class="citem__row"><div class="citem__qty">' +
          '<button data-cm="' + i + '">−</button><span>' + it.qty + '</span><button data-cp="' + i + '">+</button>' +
        '</div><button class="citem__rm" data-crm="' + i + '">Quitar</button></div></div></div>';
    }).join("");
    foot.innerHTML = '<div class="cart__total"><span>Total</span><span>' + LCH.fmt(LCH.cartTotal()) + '</span></div>' +
      '<button class="pbtn pbtn--buy" style="width:100%;padding:1rem" data-go-checkout>Finalizar compra</button>';
    $$('[data-cm]', box).forEach(function (b) { b.addEventListener("click", function () { LCH.updateQty(+b.dataset.cm, LCH.getCart()[+b.dataset.cm].qty - 1); renderCart(); }); });
    $$('[data-cp]', box).forEach(function (b) { b.addEventListener("click", function () { LCH.updateQty(+b.dataset.cp, LCH.getCart()[+b.dataset.cp].qty + 1); renderCart(); }); });
    $$('[data-crm]', box).forEach(function (b) { b.addEventListener("click", function () { LCH.removeFromCart(+b.dataset.crm); renderCart(); }); });
    $("[data-go-checkout]", foot).addEventListener("click", function () { closeModal(cartModal); openCheckout(); });
  }

  /* ---------------- checkout ---------------- */
  var coModal = $("[data-checkout-modal]"), coInner = $("[data-checkout-inner]");
  $$("[data-close-checkout]").forEach(function (b) { b.addEventListener("click", function () { closeModal(coModal); }); });

  function openCheckout() {
    if (!coModal) return;
    if (!LCH.getCart().length) { openCart(); return; }
    renderCheckoutForm(); openModal(coModal);
  }
  function renderCheckoutForm() {
    var cart = LCH.getCart();
    var sum = cart.map(function (it) {
      var extra = "Talla " + esc(it.size) + " · x" + it.qty;
      if (it.custom_name || it.custom_number) extra += " · " + esc(it.custom_name || "") + " " + esc(it.custom_number || "");
      return '<div class="co-sum__it"><b>' + esc(it.name) + '</b> — ' + extra + ' — ' + LCH.fmt(it.price * it.qty) + '</div>';
    }).join("");
    coInner.innerHTML =
      '<h3>Finalizar compra</h3><p class="step-sub">Revisa tu pedido y completa tus datos.</p>' +
      '<div class="co-sum">' + sum + '<div class="co-sum__tot"><span>Total</span><span>' + LCH.fmt(LCH.cartTotal()) + '</span></div></div>' +
      '<form data-co-form>' +
        '<div class="co-field"><label>Nombre del comprador</label><input type="text" name="buyer" placeholder="Tu nombre y apellido" required /></div>' +
        '<div class="co-field"><label>Teléfono / WhatsApp</label><input type="text" name="phone" placeholder="Ej. 75136016" required /></div>' +
        '<div class="co-field"><label>¿Cómo lo quieres recibir?</label>' +
          '<select name="delivery" data-delivery><option value="retiro">Retirar en la tienda</option><option value="envio">Envío a mi dirección</option></select></div>' +
        '<div class="co-note hidden" data-envio-note>Al ser envío, la tienda te dirá el costo del envío cuando te contactes por WhatsApp, después de finalizar la compra.</div>' +
        '<div class="co-field"><label>Nota (opcional)</label><textarea name="note" rows="2" placeholder="Alguna aclaración de tu pedido"></textarea></div>' +
        '<button class="pbtn pbtn--buy" type="submit" style="width:100%;padding:1rem">Continuar al pago</button>' +
      '</form>';
    $("[data-delivery]", coInner).addEventListener("change", function () { $("[data-envio-note]", coInner).classList.toggle("hidden", this.value !== "envio"); });
    $("[data-co-form]", coInner).addEventListener("submit", function (e) {
      e.preventDefault(); if (!e.target.reportValidity()) return;
      renderPayment({ buyer_name: e.target.buyer.value.trim(), phone: e.target.phone.value.trim(), delivery: e.target.delivery.value, note: e.target.note.value.trim() });
    });
  }
  async function renderPayment(data) {
    var settings = await LCH.getSettings();
    var total = LCH.cartTotal();
    var qr = settings.qr_url ? '<img src="' + esc(settings.qr_url) + '" alt="QR de pago" />'
      : '<div class="co-note">La tienda aún no cargó su QR de pago. Igual puedes enviar tu pedido por WhatsApp y coordinamos el pago.</div>';
    coInner.innerHTML =
      '<h3>Pago</h3><p class="step-sub">Escanea el QR, paga el total y envíanos tu comprobante.</p>' +
      '<div class="co-qr"><div class="amt">' + LCH.fmt(total) + '</div>' + qr +
        '<p class="qr-note">' + esc(settings.qr_note || "Escanea el QR, paga el total y luego envía tu comprobante por WhatsApp.") + '</p>' +
        '<button class="btn-wa" style="width:100%" data-send-wa>' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3-1.3-5-4.4-5.1-4.6-.2-.2-1.3-1.7-1.3-3.2s.8-2.3 1.1-2.6c.3-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.9-.1 1.5z"/></svg>' +
          'Enviar comprobante por WhatsApp</button>' +
        '<a class="co-back" data-co-back>← Volver a mis datos</a></div>';
    $("[data-co-back]", coInner).addEventListener("click", renderCheckoutForm);
    $("[data-send-wa]", coInner).addEventListener("click", function () { finishOrder(data); });
  }
  async function finishOrder(data) {
    var cart = LCH.getCart(), total = LCH.cartTotal();
    var order = {
      buyer_name: data.buyer_name, phone: data.phone, delivery: data.delivery, note: data.note,
      total: total, status: "nuevo",
      items: cart.map(function (it) { return { product_id: it.product_id, name: it.name, size: it.size, qty: it.qty, price: it.price, custom_name: it.custom_name || "", custom_number: it.custom_number || "" }; })
    };
    try { await LCH.createOrder(order); } catch (e) { console.warn("order", e); }
    var lines = ["Hola La Casa del Hincha, acabo de hacer una compra y les envio mi comprobante:", ""];
    lines.push("Comprador: " + data.buyer_name);
    lines.push("Telefono: " + data.phone);
    lines.push("Entrega: " + (data.delivery === "envio" ? "Envio (quedo atento al costo)" : "Retiro en tienda"));
    lines.push(""); lines.push("Pedido:");
    cart.forEach(function (it) {
      var l = "- " + it.name + " | Talla " + it.size + " | x" + it.qty;
      if (it.custom_name || it.custom_number) l += " | Personalizado: " + (it.custom_name || "") + " " + (it.custom_number || "");
      l += " | " + LCH.fmt(it.price * it.qty);
      lines.push(l);
    });
    if (data.note) { lines.push(""); lines.push("Nota: " + data.note); }
    lines.push(""); lines.push("Total: " + LCH.fmt(total));
    lines.push("Adjunto mi comprobante de pago. Gracias!");
    window.open(LCH.waUrl(lines.join("\n")), "_blank");
    LCH.clearCart(); renderCartCount();
    coInner.innerHTML = '<h3>¡Gracias por tu compra!</h3>' +
      '<p class="step-sub">Se abrió WhatsApp para que envíes tu comprobante. Si no se abrió, escríbenos al ' +
      '<a href="' + LCH.waUrl("Hola, acabo de hacer una compra y quiero enviar mi comprobante.") + '" target="_blank" style="text-decoration:underline">WhatsApp de la tienda</a>.</p>' +
      '<button class="pbtn pbtn--buy" style="width:100%;padding:1rem" data-close-checkout>Volver</button>';
    $("[data-close-checkout]", coInner).addEventListener("click", function () { closeModal(coModal); });
  }

  /* ---------------- overlays ---------------- */
  function openModal(m) { m.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  function closeModal(m) { if (!m) return; m.classList.remove("is-open"); document.body.style.overflow = ""; }
  $$("[data-close-modal]").forEach(function (b) { b.addEventListener("click", function () { closeModal(pModal); }); });
  document.addEventListener("keydown", function (e) {
    if (glb && glb.classList.contains("is-open")) {
      if (e.key === "Escape") return closeGlb();
      if (e.key === "ArrowLeft") return glbGo(-1);
      if (e.key === "ArrowRight") return glbGo(1);
      return;
    }
    if (e.key === "Escape") { closeModal(pModal); closeModal(cartModal); closeModal(coModal); closeLb(); }
  });

  /* galería ampliada de fotos de producto (zoom + deslizar) */
  var glb, glbImgs = [], glbIdx = 0;
  function buildGlb() {
    glb = document.createElement("div");
    glb.className = "glb";
    glb.innerHTML =
      '<button class="glb__close" aria-label="Cerrar"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button class="glb__btn glb__prev" aria-label="Anterior"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<img alt="Foto del producto" />' +
      '<button class="glb__btn glb__next" aria-label="Siguiente"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<span class="glb__count"></span>';
    document.body.appendChild(glb);
    glb.querySelector(".glb__close").addEventListener("click", closeGlb);
    glb.querySelector(".glb__prev").addEventListener("click", function (e) { e.stopPropagation(); glbGo(-1); });
    glb.querySelector(".glb__next").addEventListener("click", function (e) { e.stopPropagation(); glbGo(1); });
    glb.addEventListener("click", function (e) { if (e.target === glb) closeGlb(); });
    var sx = null;
    glb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    glb.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) glbGo(dx < 0 ? 1 : -1);
      sx = null;
    });
  }
  function renderGlb() {
    var img = glb.querySelector("img"); img.src = glbImgs[glbIdx];
    var multi = glbImgs.length > 1;
    glb.querySelector(".glb__prev").style.display = multi ? "grid" : "none";
    glb.querySelector(".glb__next").style.display = multi ? "grid" : "none";
    var c = glb.querySelector(".glb__count");
    c.textContent = (glbIdx + 1) + " / " + glbImgs.length;
    c.style.display = multi ? "block" : "none";
  }
  function glbGo(d) { glbIdx = (glbIdx + d + glbImgs.length) % glbImgs.length; renderGlb(); }
  function openGallery(images, idx) {
    if (!glb) buildGlb();
    glbImgs = images || []; glbIdx = idx || 0;
    renderGlb(); glb.classList.add("is-open"); document.body.style.overflow = "hidden";
  }
  function closeGlb() { if (glb) { glb.classList.remove("is-open"); document.body.style.overflow = ""; } }

  var lb;
  function openLb(src) {
    if (!lb) {
      lb = document.createElement("div");
      lb.style.cssText = "position:fixed;inset:0;z-index:1300;display:grid;place-items:center;background:rgba(6,6,6,.9);padding:6vw";
      lb.addEventListener("click", closeLb);
      lb.innerHTML = '<img style="max-width:92vw;max-height:88vh;border-radius:8px" />';
      document.body.appendChild(lb);
    }
    lb.querySelector("img").src = src; lb.style.display = "grid";
  }
  function closeLb() { if (lb) lb.style.display = "none"; }

  /* ---------------- init ---------------- */
  bindCartUI();
  LCH.fetchAllProducts().then(function (list) {
    ALL = list;
    if (grid) renderCatalog(true);
    if (featGrid) renderFeatured();
  });
})();
