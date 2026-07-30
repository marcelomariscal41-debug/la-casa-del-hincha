/* admin.js — Panel de administración */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var LCH = window.LCH;

  var loginEl = $("[data-login]"), adminEl = $("[data-admin]");
  var pendingImages = [null, null, null, null, null, null]; // File objects para las 6 fotos
  var editingImages = [];                  // URLs existentes al editar

  /* ---------- arranque ---------- */
  if (!LCH || !LCH.configured) {
    $("[data-config-note]").textContent = "⚠ Falta conectar Supabase. Abre lib/supabase-config.js y pega tu URL y clave (ver GUIA-SUPABASE.md).";
    $("[data-login-btn]").disabled = true;
    return;
  }
  LCH.currentUser().then(function (u) { if (u) showAdmin(); });

  /* ---------- login ---------- */
  $("[data-login-form]").addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = $("[data-login-btn]"), msg = $("[data-login-msg]");
    msg.classList.add("hidden");
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      await LCH.signIn($("#em").value.trim(), $("#pw").value);
      showAdmin();
    } catch (err) {
      msg.textContent = "Correo o contraseña incorrectos.";
      msg.classList.remove("hidden");
    } finally { btn.disabled = false; btn.textContent = "Ingresar"; }
  });

  $("[data-logout]").addEventListener("click", async function () {
    await LCH.signOut(); location.reload();
  });

  function showAdmin() {
    loginEl.style.display = "none";
    adminEl.style.display = "block";
    loadProducts(); loadOrders(); loadSettings();
  }

  /* ---------- tabs ---------- */
  $$(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".tabs button").forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      $$(".panel").forEach(function (p) { p.classList.remove("is-active"); });
      $('[data-panel="' + b.dataset.tab + '"]').classList.add("is-active");
    });
  });

  /* ---------- promo toggle ---------- */
  $("[data-promo]").addEventListener("change", function () {
    $("[data-promo-field]").classList.toggle("hidden", !this.checked);
  });

  /* ---------- imágenes producto ---------- */
  $$('[data-img]').forEach(function (inp) {
    inp.addEventListener("change", function () {
      var i = parseInt(inp.dataset.img, 10);
      var file = inp.files[0];
      pendingImages[i] = file || null;
      var slot = inp.closest(".imgslot");
      if (file) {
        var url = URL.createObjectURL(file);
        slot.style.backgroundImage = "";
        var img = slot.querySelector("img") || document.createElement("img");
        img.src = url; if (!img.parentNode) slot.appendChild(img);
      }
    });
  });

  /* ---------- guardar producto ---------- */
  $("[data-product-form]").addEventListener("submit", async function (e) {
    e.preventDefault();
    var form = e.target, btn = $("[data-save-btn]"), msg = $("[data-form-msg]");
    msg.classList.add("hidden");
    var cats = $$('[data-cats] input:checked').map(function (c) { return c.value; });
    var sizes = $$('[data-sizes] input:checked').map(function (c) { return c.value; });
    if (!cats.length) return showMsg(msg, "Elige al menos una categoría.", false);
    if (!sizes.length) return showMsg(msg, "Elige al menos una talla.", false);

    var isPromo = form.is_promo.checked;
    var price = Number(form.price.value);
    var priceOld = null, sellPrice = price;
    if (isPromo) {
      var promo = Number(form.price_promo.value);
      if (!promo || promo <= 0) return showMsg(msg, "Ingresa el precio promocional.", false);
      priceOld = price; sellPrice = promo;
    }

    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Guardando…';
    try {
      // subir imágenes nuevas
      var urls = editingImages.slice();
      for (var i = 0; i < 6; i++) {
        if (pendingImages[i]) {
          var u = await LCH.uploadImage("productos", pendingImages[i]);
          urls[i] = u;
        }
      }
      urls = urls.filter(Boolean).slice(0, 6);

      var row = {
        name: form.name.value.trim(),
        team: form.team.value.trim(),
        description: form.description.value.trim(),
        categories: cats, sizes: sizes,
        stock: Number(form.stock.value) || 0,
        price: sellPrice, is_promo: isPromo, price_old: priceOld,
        allow_custom: form.allow_custom.checked,
        images: urls, active: true
      };

      var id = form.id.value;
      var res;
      if (id) res = await LCH.client.from("products").update(row).eq("id", id);
      else res = await LCH.client.from("products").insert([row]);
      if (res.error) throw res.error;

      showMsg(msg, id ? "Producto actualizado ✅" : "Producto agregado ✅", true);
      resetForm();
      loadProducts();
    } catch (err) {
      showMsg(msg, "Error al guardar: " + (err.message || err), false);
    } finally { btn.disabled = false; btn.textContent = "Guardar producto"; }
  });

  $("[data-cancel-edit]").addEventListener("click", resetForm);

  function resetForm() {
    var form = $("[data-product-form]");
    form.reset();
    form.id.value = "";
    pendingImages = [null, null, null, null, null, null]; editingImages = [];
    $$('[data-imgs] .imgslot').forEach(function (s) { var im = s.querySelector("img"); if (im) im.remove(); });
    $("[data-promo-field]").classList.add("hidden");
    $("[data-form-title]").textContent = "Agregar producto";
    $("[data-cancel-edit]").classList.add("hidden");
    $("[data-save-btn]").textContent = "Guardar producto";
  }

  /* ---------- lista de productos ---------- */
  async function loadProducts() {
    var box = $("[data-products-list]");
    var res = await LCH.client.from("products").select("*").order("created_at", { ascending: false });
    if (res.error) { box.innerHTML = '<div class="empty">Error al cargar.</div>'; return; }
    var list = res.data || [];
    if (!list.length) { box.innerHTML = '<div class="empty">Aún no hay productos. Agrega el primero.</div>'; return; }
    box.innerHTML = list.map(function (p) {
      var priceHtml = p.is_promo && p.price_old
        ? '<span class="row__old">' + LCH.fmt(p.price_old) + '</span>' + LCH.fmt(p.price)
        : LCH.fmt(p.price);
      var tags = '';
      if (p.is_promo) tags += '<span class="tag tag--promo">Promo</span> ';
      if (!p.active) tags += '<span class="tag tag--off">Oculto</span> ';
      if (p.allow_custom) tags += '<span class="tag">Personalizable</span> ';
      return '<div class="row">' +
        '<img class="row__img" src="' + ((p.images && p.images[0]) || "assets/img/logo-mark.webp") + '" alt="" />' +
        '<div class="row__main"><div class="row__name">' + esc(p.name) + '</div>' +
        '<div class="row__meta">' + (p.categories || []).join(", ") + " · " + (p.sizes || []).join(" ") + " · stock " + (p.stock || 0) + '</div>' +
        '<div style="margin-top:.3rem">' + tags + '</div></div>' +
        '<div style="text-align:right"><div class="row__price">' + priceHtml + '</div>' +
        '<div class="row__actions" style="margin-top:.5rem">' +
        '<button class="btn btn--ghost btn--sm" data-edit="' + p.id + '">Editar</button>' +
        '<button class="btn btn--ghost btn--sm" data-reviews="' + p.id + '">Reseñas</button>' +
        '<button class="btn btn--ghost btn--sm" data-toggle="' + p.id + '">' + (p.active ? "Ocultar" : "Mostrar") + '</button>' +
        '<button class="btn btn--ghost btn--sm" data-del="' + p.id + '">Eliminar</button>' +
        '</div></div></div>';
    }).join("");

    $$('[data-edit]', box).forEach(function (b) { b.addEventListener("click", function () { editProduct(b.dataset.edit, list); }); });
    $$('[data-reviews]', box).forEach(function (b) { b.addEventListener("click", function () { openReviews(list.find(function (x) { return x.id === b.dataset.reviews; })); }); });
    $$('[data-toggle]', box).forEach(function (b) { b.addEventListener("click", async function () {
      var p = list.find(function (x) { return x.id === b.dataset.toggle; });
      await LCH.client.from("products").update({ active: !p.active }).eq("id", p.id); loadProducts();
    }); });
    $$('[data-del]', box).forEach(function (b) { b.addEventListener("click", async function () {
      if (!confirm("¿Eliminar este producto?")) return;
      await LCH.client.from("products").delete().eq("id", b.dataset.del); loadProducts();
    }); });
  }

  function editProduct(id, list) {
    var p = list.find(function (x) { return x.id === id; });
    if (!p) return;
    var form = $("[data-product-form]");
    form.id.value = p.id;
    form.name.value = p.name || "";
    form.team.value = p.team || "";
    form.description.value = p.description || "";
    form.stock.value = p.stock || 0;
    form.allow_custom.checked = !!p.allow_custom;
    $$('[data-cats] input').forEach(function (c) { c.checked = (p.categories || []).indexOf(c.value) >= 0; });
    $$('[data-sizes] input').forEach(function (c) { c.checked = (p.sizes || []).indexOf(c.value) >= 0; });
    form.is_promo.checked = !!p.is_promo;
    $("[data-promo-field]").classList.toggle("hidden", !p.is_promo);
    if (p.is_promo && p.price_old) { form.price.value = p.price_old; form.price_promo.value = p.price; }
    else { form.price.value = p.price; }
    editingImages = (p.images || []).slice();
    pendingImages = [null, null, null, null, null, null];
    $$('[data-imgs] .imgslot').forEach(function (s, i) {
      var im = s.querySelector("img"); if (im) im.remove();
      if (editingImages[i]) { var img = document.createElement("img"); img.src = editingImages[i]; s.appendChild(img); }
    });
    $("[data-form-title]").textContent = "Editar producto";
    $("[data-cancel-edit]").classList.remove("hidden");
    $("[data-save-btn]").textContent = "Actualizar producto";
    $$('.tabs button').forEach(function (x) { x.classList.remove("is-active"); });
    $('.tabs button[data-tab="add"]').classList.add("is-active");
    $$(".panel").forEach(function (pn) { pn.classList.remove("is-active"); });
    $('[data-panel="add"]').classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- reseñas (moderación) ---------- */
  var revModal = $("[data-rev-modal]");
  $$('[data-rev-close]').forEach(function (b) { b.addEventListener("click", function () { revModal.hidden = true; }); });

  async function openReviews(p) {
    if (!p) return;
    $("[data-rev-title]").textContent = "Reseñas · " + p.name;
    var list = $("[data-rev-list]");
    list.innerHTML = '<div class="empty"><span class="spin"></span></div>';
    revModal.hidden = false;
    var res = await LCH.client.from("reviews").select("*").eq("product_id", p.id).order("created_at", { ascending: false });
    var rows = (res && res.data) || [];
    if (!rows.length) { list.innerHTML = '<div class="empty">Este producto aún no tiene reseñas.</div>'; return; }
    list.innerHTML = rows.map(function (r) {
      var stars = ""; for (var i = 1; i <= 5; i++) stars += i <= r.rating ? "★" : "☆";
      return '<div class="revm__item">' +
        (r.photo ? '<a href="' + esc(r.photo) + '" target="_blank"><img class="revm__img" src="' + esc(r.photo) + '" alt="" /></a>' : '<div class="revm__img revm__img--none">sin foto</div>') +
        '<div class="revm__body">' +
          '<div style="color:#e6a700;font-size:1rem">' + stars + '</div>' +
          '<b>' + esc(r.author || "Cliente") + '</b>' + (r.approved ? '' : ' <span class="tag tag--promo">Pendiente</span>') +
          (r.comment ? '<p style="margin:.3rem 0;color:var(--soft);font-size:.9rem">' + esc(r.comment) + '</p>' : '') +
          '<div class="revm__actions">' +
            (r.approved ? '' : '<button class="btn btn--sm" data-approve="' + r.id + '">Aprobar</button>') +
            '<button class="btn btn--ghost btn--sm" data-rdel="' + r.id + '">Eliminar</button>' +
          '</div></div></div>';
    }).join("");
    $$('[data-approve]', list).forEach(function (b) { b.addEventListener("click", async function () {
      await LCH.client.from("reviews").update({ approved: true }).eq("id", b.dataset.approve); openReviews(p);
    }); });
    $$('[data-rdel]', list).forEach(function (b) { b.addEventListener("click", async function () {
      if (!confirm("¿Eliminar esta reseña?")) return;
      await LCH.client.from("reviews").delete().eq("id", b.dataset.rdel); openReviews(p);
    }); });
  }

  /* ---------- pedidos ---------- */
  async function loadOrders() {
    var box = $("[data-orders-list]");
    var res = await LCH.client.from("orders").select("*").order("created_at", { ascending: false });
    if (res.error) { box.innerHTML = '<div class="empty">Error al cargar pedidos.</div>'; return; }
    var list = res.data || [];
    if (!list.length) { box.innerHTML = '<div class="empty">Aún no hay pedidos.</div>'; return; }
    box.innerHTML = list.map(function (o) {
      var items = (o.items || []).map(function (it) {
        var extra = [];
        if (it.size) extra.push("Talla " + it.size);
        if (it.qty) extra.push("x" + it.qty);
        if (it.custom_name || it.custom_number) extra.push("Personalizado: " + (it.custom_name || "") + " " + (it.custom_number || ""));
        return '<div class="order__it"><b>' + esc(it.name) + '</b> — ' + extra.join(" · ") + " — " + LCH.fmt(it.price * (it.qty || 1)) + '</div>';
      }).join("");
      var d = new Date(o.created_at);
      return '<div class="order"><div class="order__top">' +
        '<div><span class="order__buyer">' + esc(o.buyer_name) + '</span> ' +
        '<span class="tag">' + (o.delivery === "envio" ? "Envío" : "Retiro en tienda") + '</span></div>' +
        '<span class="order__date">' + d.toLocaleString("es-BO") + '</span></div>' +
        '<div class="order__items">' + items + '</div>' +
        (o.phone ? '<div class="order__meta" style="font-size:.82rem;color:var(--soft);margin-top:.5rem">Tel: ' + esc(o.phone) + '</div>' : '') +
        (o.note ? '<div style="font-size:.82rem;color:var(--soft);margin-top:.3rem">Nota: ' + esc(o.note) + '</div>' : '') +
        '<div class="order__foot"><b>Total: ' + LCH.fmt(o.total) + '</b>' +
        '<select class="state" data-order="' + o.id + '">' +
        opt("nuevo", o.status) + opt("en proceso", o.status) + opt("entregado", o.status) +
        '</select></div></div>';
    }).join("");
    $$('[data-order]', box).forEach(function (sel) {
      sel.addEventListener("change", async function () {
        await LCH.client.from("orders").update({ status: sel.value }).eq("id", sel.dataset.order);
      });
    });
  }
  function opt(v, cur) { return '<option value="' + v + '"' + (v === cur ? " selected" : "") + '>' + v + '</option>'; }

  /* ---------- ajustes / QR ---------- */
  var qrFile = null;
  $("[data-qr-file]").addEventListener("change", function () {
    qrFile = this.files[0] || null;
    if (qrFile) { var prev = $("[data-qr-prev]"); prev.src = URL.createObjectURL(qrFile); prev.classList.remove("hidden"); }
  });
  async function loadSettings() {
    var s = await LCH.getSettings();
    if (s.qr_url) { var prev = $("[data-qr-prev]"); prev.src = s.qr_url; prev.classList.remove("hidden"); }
    $("[data-qr-note]").value = s.qr_note || "";
  }
  $("[data-qr-save]").addEventListener("click", async function () {
    var msg = $("[data-qr-msg]"), btn = this;
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      if (qrFile) {
        var url = await LCH.uploadImage("productos", qrFile);
        await LCH.client.from("settings").upsert({ key: "qr_url", value: url });
      }
      await LCH.client.from("settings").upsert({ key: "qr_note", value: $("[data-qr-note]").value.trim() });
      showMsg(msg, "Guardado ✅", true);
    } catch (err) { showMsg(msg, "Error: " + (err.message || err), false); }
    finally { btn.disabled = false; btn.textContent = "Guardar QR y texto"; }
  });

  /* ---------- utils ---------- */
  function showMsg(el, text, ok) {
    el.textContent = text;
    el.className = "msg " + (ok ? "msg--ok" : "msg--err");
    el.classList.remove("hidden");
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
})();
